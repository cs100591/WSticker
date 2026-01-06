import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { expenseRowToExpense, createExpenseInputToInsert, type CreateExpenseInput, type ExpenseFilters } from '@/types/expense';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// GET /api/expenses - 获取消费记录列表
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const category = searchParams.get('category') as ExpenseFilters['category'];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const sortField = searchParams.get('sortField') || 'expenseDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建查询
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // 应用过滤
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (dateFrom) {
      query = query.gte('expense_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('expense_date', dateTo);
    }
    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    // 应用排序
    const dbSortField = sortField === 'expenseDate' ? 'expense_date' 
      : sortField === 'createdAt' ? 'created_at' 
      : sortField;
    query = query.order(dbSortField, { ascending: sortOrder === 'asc' });

    // 应用分页
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const expenses = (data || []).map(expenseRowToExpense);

    return NextResponse.json({
      expenses,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/expenses - 创建消费记录
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateExpenseInput = await request.json();
    
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const insertData = createExpenseInputToInsert(body, userId);

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(expenseRowToExpense(data), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
