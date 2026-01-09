'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, BarChart3, Zap, Shield, Smartphone, Menu, X, Sparkles } from 'lucide-react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: CheckCircle2,
      title: '智能待办管理',
      description: '轻松管理日常任务，设置优先级和截止日期，智能提醒确保不遗漏任何重要事项',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: BarChart3,
      title: '消费追踪分析',
      description: '追踪每一笔支出，生成详细的消费报告，帮助你了解消费习惯并制定预算',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Zap,
      title: '语音助手',
      description: '用语音快速创建待办和记录消费，解放双手，提高效率',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Shield,
      title: '数据安全',
      description: '端到端加密保护你的隐私，所有数据安全存储在云端',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      icon: Smartphone,
      title: '跨平台同步',
      description: '在任何设备上无缝访问，数据实时同步，随时随地管理你的生活',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: Sparkles,
      title: 'AI 智能建议',
      description: '基于你的数据和习惯，AI 助手提供个性化的建议和优化方案',
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-50'
    },
  ];

  const testimonials = [
    {
      name: '李明',
      role: '产品经理',
      content: 'CLASP 让我的生活变得井井有条。语音功能特别好用，开会时也能快速记录待办事项。',
      avatar: '👨‍💼'
    },
    {
      name: '王芳',
      role: '自由职业者',
      content: '消费追踪功能帮我省了不少钱。现在我对自己的消费习惯了如指掌。',
      avatar: '👩‍💼'
    },
    {
      name: '张华',
      role: '学生',
      content: '日历同步功能太棒了。所有的课程和任务都能自动同步到手机上。',
      avatar: '👨‍🎓'
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">PA</span>
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:inline">CLASP</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">功能</Link>
            <Link href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">评价</Link>
            <Link href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">定价</Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-white">
                开始使用
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-white/20 p-4 space-y-4">
            <Link href="#features" className="block text-gray-700 hover:text-blue-600 font-medium">功能</Link>
            <Link href="#testimonials" className="block text-gray-700 hover:text-blue-600 font-medium">评价</Link>
            <Link href="#pricing" className="block text-gray-700 hover:text-blue-600 font-medium">定价</Link>
            <div className="flex gap-3 pt-4 border-t">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">登录</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">开始</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:pt-40 md:pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/50 border border-blue-200/50 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-600">✨ AI 驱动的个人助理</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-gradient">你的虚拟私人助理</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              智能管理待办事项、追踪消费、同步日历，所有功能集于一身。用 AI 助手让生活更有序。
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/40 transition-all text-white border-0 w-full sm:w-auto">
                立即开始 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 border-blue-200 hover:bg-blue-50 w-full sm:w-auto">
                已有账号？登录
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>数据加密保护</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>无需信用卡</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>7 天免费试用</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 md:py-32 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              功能特性
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              CLASP 集合了现代生活所需的所有工具，帮助你高效管理时间和财务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <GlassCard key={index} className="group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <GlassCardContent className="p-6 space-y-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 md:py-32 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              用户评价
            </h2>
            <p className="text-lg text-gray-600">
              加入数千名已经改变生活方式的用户
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <GlassCard key={index} className="hover:shadow-xl transition-all">
                <GlassCardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 px-4 md:py-32 relative">
        <div className="max-w-2xl mx-auto">
          <GlassCard className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 hover:shadow-2xl transition-all">
            <GlassCardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                准备好改变你的生活了吗？
              </h2>
              <p className="text-lg text-gray-600">
                立即加入 CLASP，体验智能生活管理的未来。7 天免费试用，无需信用卡。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/40 transition-all text-white border-0 w-full sm:w-auto">
                    免费开始 <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    登录账户
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-12 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">PA</span>
                </div>
                <span className="font-bold text-gray-900">CLASP</span>
              </div>
              <p className="text-sm text-gray-600">你的虚拟私人助理</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">功能</Link></li>
                <li><Link href="#pricing" className="hover:text-blue-600 transition-colors">定价</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">安全</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">公司</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">关于</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">博客</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">联系</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">法律</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">隐私</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">条款</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Cookie</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>&copy; 2024 CLASP. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-blue-600 transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">GitHub</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
