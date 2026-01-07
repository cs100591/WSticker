import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Calculate date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${endDate.getDate()}`;

    // Fetch todos for task completion
    const { data: todos } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDateStr);

    const totalTasks = todos?.length || 0;
    const completedTasks = todos?.filter(t => t.status === 'completed').length || 0;
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Fetch expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDateStr);

    const totalSpending = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

    // Group expenses by category
    const categoryMap: Record<string, number> = {};
    expenses?.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + parseFloat(e.amount);
    });

    const spendingByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: Math.round(amount),
      color: getCategoryColor(category),
    }));

    // Generate spending trend (daily for last 7 days)
    const spendingTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = expenses?.filter(e => e.expense_date.startsWith(dateStr)) || [];
      const dayTotal = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      spendingTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.round(dayTotal),
      });
    }

    // Generate tasks trend (last 7 days)
    const tasksTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTodos = todos?.filter(t => t.created_at.startsWith(dateStr)) || [];
      const dayCompleted = dayTodos.filter(t => t.status === 'completed').length;
      
      tasksTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: dayCompleted,
        total: dayTodos.length,
      });
    }

    const reportData = {
      taskCompletion,
      totalSpending: Math.round(totalSpending),
      spendingByCategory,
      spendingTrend,
      tasksTrend,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: '#f97316',
    shopping: '#ec4899',
    transport: '#3b82f6',
    housing: '#10b981',
    entertainment: '#8b5cf6',
    other: '#6b7280',
  };
  return colors[category.toLowerCase()] || '#6b7280';
}
