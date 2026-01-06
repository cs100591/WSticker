import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { expenseRowToExpense, aggregateByCategory, calculateTotal } from '@/types/expense';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId() {
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true') {
    return DEV_USER_ID;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// GET /api/expenses/summary - 获取消费汇总
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // 解析日期范围
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // 构建查询
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    if (dateFrom) {
      query = query.gte('expense_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('expense_date', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expense summary:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const expenses = (data || []).map(expenseRowToExpense);
    const total = calculateTotal(expenses);
    const byCategory = aggregateByCategory(expenses);

    return NextResponse.json({
      total,
      byCategory,
      count: expenses.length,
    });
  } catch (error) {
    console.error('Error in GET /api/expenses/summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
