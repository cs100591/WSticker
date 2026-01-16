import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithToken } from '@/lib/supabase/server';
import { todoRowToTodo, type CreateTodoInput, type TodoFilters } from '@/types/todo';
import { isDevMode, getDevTodos, addDevTodo } from '@/lib/dev-store';

async function getUserId(request?: NextRequest) {
  if (isDevMode()) {
    return 'dev-user-id';
  }

  const supabase = await createClient();

  // 1. Try Cookie-based session (Web)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  // 2. Try Header-based session (Mobile/API)
  if (request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: headerUser } } = await supabase.auth.getUser(token);
      if (headerUser) return headerUser.id;
    }
  }

  return null;
}

// GET /api/todos - 获取待办事项列表
export async function GET(request: NextRequest) {
  try {
    // 开发模式：从内存存储获取
    if (isDevMode()) {
      const devTodos = getDevTodos();
      // Convert dev-store format to API format
      const todos = devTodos.map(t => ({
        ...t,
        userId: t.userId || 'dev-user-id',
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
      return NextResponse.json({
        todos,
        total: todos.length,
        page: 1,
        limit: 50,
      });
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const status = searchParams.get('status') as TodoFilters['status'];
    const priority = searchParams.get('priority') as TodoFilters['priority'];
    const search = searchParams.get('search');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建查询
    let query = supabase
      .from('todos')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // 应用过滤
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // 应用排序
    const dbSortField = sortField === 'createdAt' ? 'created_at'
      : sortField === 'dueDate' ? 'due_date'
        : sortField;
    query = query.order(dbSortField, { ascending: sortOrder === 'asc' });

    // 应用分页
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching todos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const todos = (data || []).map(todoRowToTodo);

    return NextResponse.json({
      todos,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/todos - 创建待办事项
export async function POST(request: NextRequest) {
  try {
    const body: CreateTodoInput = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // 开发模式：存入内存存储
    if (isDevMode()) {
      const dueDateStr = body.dueDate
        ? (typeof body.dueDate === 'string' ? body.dueDate : body.dueDate.toISOString().split('T')[0])
        : undefined;
      const devTodo = addDevTodo({
        title: body.title,
        description: body.description,
        dueDate: dueDateStr,
        priority: body.priority,
        tags: body.tags,
        color: body.color || 'yellow',
      });
      // Convert to API format
      const todo = {
        ...devTodo,
        userId: devTodo.userId || 'dev-user-id',
        dueDate: devTodo.dueDate ? new Date(devTodo.dueDate) : null,
        createdAt: new Date(devTodo.createdAt),
        updatedAt: new Date(devTodo.updatedAt),
      };
      return NextResponse.json(todo, { status: 201 });
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine client based on Auth method (Token vs Cookie)
    let supabase;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = await createClientWithToken(token);
    } else {
      supabase = await createClient();
    }

    // Build insert data without color if it might cause issues
    const insertData: Record<string, unknown> = {
      user_id: userId,
      title: body.title,
      description: body.description,
      due_date: body.dueDate
        ? typeof body.dueDate === 'string'
          ? body.dueDate
          : body.dueDate.toISOString()
        : undefined,
      priority: body.priority ?? 'medium',
      tags: body.tags ?? [],
    };

    // Only add color if provided (column might not exist in production)
    if (body.color) {
      insertData.color = body.color;
    }

    const { data, error } = await supabase
      .from('todos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating todo:', error);
      // If color column doesn't exist, try without it
      if (error.message?.includes('color')) {
        delete insertData.color;
        const { data: retryData, error: retryError } = await supabase
          .from('todos')
          .insert(insertData)
          .select()
          .single();

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
        return NextResponse.json(todoRowToTodo(retryData), { status: 201 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(todoRowToTodo(data), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
