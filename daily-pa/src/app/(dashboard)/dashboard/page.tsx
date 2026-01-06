'use client';

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useI18n } from '@/lib/i18n';
import { AIChatbot } from '@/components/chat/AIChatbot';
import { ReceiptScanner } from '@/components/camera/ReceiptScanner';
import { CheckSquare, Calendar, DollarSign, MessageCircle, TrendingUp, Clock, Sparkles, ArrowRight, Camera } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const displayName = 'User';
  const [showChatbot, setShowChatbot] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  const chatT = {
    title: locale === 'zh' ? 'AI 助手' : 'AI Assistant',
    description: locale === 'zh' 
      ? '用自然语言告诉我你想做什么，我会帮你创建待办、记录消费或安排日程。'
      : 'Tell me what you want to do in natural language. I\'ll help you create todos, record expenses, or schedule events.',
    hint: locale === 'zh'
      ? '试试说："明天下午3点开会" 或 "午饭花了50块"'
      : 'Try: "Meeting tomorrow at 3pm" or "Lunch $15"',
    button: locale === 'zh' ? '开始对话' : 'Start Chat',
    scan: locale === 'zh' ? '扫描收据' : 'Scan Receipt',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.nav.home} />
      
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

        {/* Quick Stats */}
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <CheckSquare className="w-7 h-7 text-white" />
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Calendar className="w-7 h-7 text-white" />
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>

        {/* AI Chatbot Card */}
        <GlassCard className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20" />
          <GlassCardContent className="relative">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="text-xl font-semibold text-gray-900">{chatT.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{chatT.description}</p>
                <p className="text-sm text-gray-400">{chatT.hint}</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  size="lg"
                  className="flex-1 md:flex-none px-6 py-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105"
                  onClick={() => setShowChatbot(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {chatT.button}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="flex-1 md:flex-none px-6 py-6 rounded-2xl font-semibold transition-all duration-200 hover:scale-105"
                  onClick={() => setShowReceiptScanner(true)}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {chatT.scan}
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                {t.dashboard.recentTasks}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <CheckSquare className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-4">{t.dashboard.noTasksYet}</p>
                <Link href="/todos">
                  <Button variant="outline" className="rounded-xl">
                    {t.dashboard.addTask}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                {t.dashboard.recentExpenses}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-4">{t.dashboard.noExpensesYet}</p>
                <Link href="/expenses">
                  <Button variant="outline" className="rounded-xl">
                    {t.dashboard.addExpense}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* AI Chatbot Modal */}
      <AIChatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)} 
      />

      {/* Receipt Scanner Modal */}
      <ReceiptScanner
        isOpen={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
      />
    </div>
  );
}
