'use client';

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useI18n } from '@/lib/i18n';
import { CheckSquare, Calendar, DollarSign, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { t } = useI18n();
  const displayName = 'User';

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.nav.home} showHomeButton={false} />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {t.dashboard.hello}, {displayName}! 👋
            </h2>
            <p className="text-gray-500 mt-1">{t.dashboard.welcomeMessage}</p>
          </div>
        </div>

        {/* Quick Stats - Outline Icons */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/todos" className="group">
            <GlassCard className="h-full group-hover:scale-[1.02] transition-transform duration-200">
              <GlassCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t.dashboard.todaysTasks}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">0</p>
                    <p className="text-sm text-gray-400 mt-1">0 {t.dashboard.completed}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-blue-500 flex items-center justify-center">
                    <CheckSquare className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/calendar" className="group">
            <GlassCard className="h-full group-hover:scale-[1.02] transition-transform duration-200">
              <GlassCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t.dashboard.todaysEvents}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">0</p>
                    <p className="text-sm text-gray-400 mt-1">{t.dashboard.noUpcomingEvents}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-green-500 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-green-500" strokeWidth={1.5} />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/expenses" className="group">
            <GlassCard className="h-full group-hover:scale-[1.02] transition-transform duration-200">
              <GlassCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t.dashboard.monthlySpending}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">$0</p>
                    <p className="text-sm text-gray-400 mt-1">{t.dashboard.vsLastMonth} --</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-orange-500 flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-orange-500" strokeWidth={1.5} />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                {t.dashboard.recentTasks}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                  <CheckSquare className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-gray-500 mb-4">{t.dashboard.noTasksYet}</p>
                <Link href="/todos">
                  <Button variant="outline" className="rounded-xl">
                    {t.dashboard.addTask}
                    <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                {t.dashboard.recentExpenses}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-gray-500 mb-4">{t.dashboard.noExpensesYet}</p>
                <Link href="/expenses">
                  <Button variant="outline" className="rounded-xl">
                    {t.dashboard.addExpense}
                    <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
