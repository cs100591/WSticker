'use client';

import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';
import { BarChart3, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';

export default function ReportsPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.reports.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Month Header */}
        <GlassCard className="text-center">
          <GlassCardContent>
            <h2 className="text-2xl font-bold text-gradient">{t.common.months[0]} 2026</h2>
            <p className="text-gray-500 text-sm mt-1">{t.reports.monthlySummary}</p>
          </GlassCardContent>
        </GlassCard>

        {/* Summary Stats - Outline Icons */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard>
            <GlassCardContent>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border-2 border-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">85%</p>
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
                  <p className="text-3xl font-bold text-gray-900">$1,290</p>
                  <p className="text-xs text-gray-500">{t.reports.totalSpending}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Chart Placeholder */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
              {t.reports.spendingTrends}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="h-48 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-gray-400">{t.reports.chartsComing}</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

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
      </div>
    </div>
  );
}
