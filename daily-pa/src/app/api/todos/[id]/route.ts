import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { todoRowToTodo, type UpdateTodoInput } from '@/types/todo';
import { isDevMode, updateDevTodo, deleteDevTodo } from '@/lib/dev-store';

async function getUserId() {
  if (isDevMode()) {
    return 'dev-user-id';
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// GET /api/todos/[id] - 获取单个待办事项
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(todoRowToTodo(data));
  } catch (error) {
    console.error('Error in GET /api/todos/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/todos/[id] - 更新待办事项
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateTodoInput = await request.json();
    const supabase = await createClient();

    // 转换为数据库格式
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.dueDate !== undefined) {
      updateData.due_date = body.dueDate 
        ? (typeof body.dueDate === 'string' ? body.dueDate : body.dueDate.toISOString())
        : null;
    }

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(todoRowToTodo(data));
  } catch (error) {
    console.error('Error in PUT /api/todos/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/todos/[id] - 删除待办事项
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 开发模式：从内存存储删除
    if (isDevMode()) {
      const success = deleteDevTodo(id);
      if (!success) {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/todos/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/todos/[id] - 部分更新（用于状态切换）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 开发模式：更新内存存储
    if (isDevMode()) {
      const todo = updateDevTodo(id, body);
      if (!todo) {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
      }
      return NextResponse.json(todo);
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(todoRowToTodo(data));
  } catch (error) {
    console.error('Error in PATCH /api/todos/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
