'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';
import { BarChart3, CheckCircle2, DollarSign, Sparkles, TrendingUp, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

interface ReportData {
  taskCompletion: number;
  totalSpending: number;
  spendingByCategory: { category: string; amount: number; color: string }[];
  spendingTrend: { date: string; amount: number }[];
  tasksTrend: { date: string; completed: number; total: number }[];
}

export default function ReportsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchReportData();
  }, [currentMonth]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`/api/reports?year=${year}&month=${month}`);
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentMonth(newDate);
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.reports.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Month Navigation */}
        <GlassCard className="text-center">
          <GlassCardContent>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </Button>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {t.common.months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{t.reports.monthlySummary}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="rounded-xl"
                disabled={currentMonth >= new Date()}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
          </div>
        ) : data ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <GlassCard>
                <GlassCardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{data.taskCompletion}%</p>
                      <p className="text-xs text-gray-500">{t.reports.taskCompletion}</p>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-orange-500 flex items-center justify-center">
                      <DollarSign className="w-7 h-7 text-orange-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">${data.totalSpending}</p>
                      <p className="text-xs text-gray-500">{t.reports.totalSpending}</p>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Spending Trend Chart */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                  {t.reports.spendingTrends}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.spendingTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCardContent>
            </GlassCard>

            {/* Spending by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
                    Spending by Category
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.spendingByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {data.spendingByCategory.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                    Task Completion Trend
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.tasksTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="total" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Insights */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
                  {t.reports.productivityInsights}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                  <p className="text-sm text-blue-800">💡 {t.reports.insight1}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <p className="text-sm text-green-800">🎯 {t.reports.insight2}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
                  <p className="text-sm text-orange-800">📅 {t.reports.insight3}</p>
                </div>
              </GlassCardContent>
            </GlassCard>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No data available for this month
          </div>
        )}
      </div>
    </div>
  );
}
