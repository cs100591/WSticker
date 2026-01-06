import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { todoRowToTodo, createTodoInputToInsert, type CreateTodoInput, type TodoFilters } from '@/types/todo';
import type { Database } from '@/types/database.types';

// 开发模式下的模拟用户 ID
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId() {
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true') {
    return DEV_USER_ID;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// GET /api/todos - 获取待办事项列表
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
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
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTodoInput = await request.json();
    
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const insertData = createTodoInputToInsert(body, userId);

    const { data, error } = await supabase
      .from('todos')
      .insert(insertData as Database['public']['Tables']['todos']['Insert'])
      .select()
      .single();

    if (error) {
      console.error('Error creating todo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(todoRowToTodo(data), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
