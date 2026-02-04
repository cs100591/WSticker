'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Shield, 
  LayoutDashboard, 
  Calendar, 
  CreditCard,
  Users,
  MessageCircle,
  Smartphone,
  Cloud,
  Sparkles,
  Clock,
  Wallet,
  ListTodo,
  Download,
  Play,
  Star,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

// Theme colors matching mobile app
const themes = {
  ocean: {
    primary: 'from-blue-500 via-cyan-500 to-teal-400',
    accent: 'bg-blue-500',
    glow: 'bg-blue-500/20',
    text: 'text-blue-400',
  },
  sage: {
    primary: 'from-emerald-500 via-teal-500 to-cyan-400',
    accent: 'bg-emerald-500',
    glow: 'bg-emerald-500/20',
    text: 'text-emerald-400',
  },
  sunset: {
    primary: 'from-orange-500 via-pink-500 to-purple-500',
    accent: 'bg-orange-500',
    glow: 'bg-orange-500/20',
    text: 'text-orange-400',
  },
  minimal: {
    primary: 'from-slate-600 via-gray-500 to-zinc-400',
    accent: 'bg-slate-500',
    glow: 'bg-slate-500/20',
    text: 'text-slate-400',
  }
};

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<keyof typeof themes>('ocean');
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px]"
        />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[150px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Daily PA
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Preview', 'Download'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`} 
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button 
                variant="ghost" 
                className="text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 text-sm font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/5"
            >
              <div className="px-6 py-4 space-y-4">
                {['Features', 'How It Works', 'Preview', 'Download'].map((item) => (
                  <Link 
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                    className="block text-slate-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col gap-3">
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-white/10 text-slate-300">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl"
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Now with AI-powered insights</span>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
              >
                Your personal
                <span className="block mt-2">
                  <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    assistant
                  </span>
                </span>
                <span className="block mt-2 text-slate-400">reimagined.</span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl"
              >
                Daily PA combines chat, calendar, tasks, and expenses into one unified platform. 
                Stay organized across all your devices with seamless sync.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 h-14 text-base font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all group"
                  >
                    Start for free 
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#preview">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/10 hover:bg-white/5 text-white px-8 h-14 text-base font-semibold rounded-xl backdrop-blur-sm"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    See it in action
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="mt-12 flex flex-wrap items-center gap-6"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <Cloud className="w-5 h-5" />
                  <span className="text-sm">Cross-platform sync</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Smartphone className="w-5 h-5" />
                  <span className="text-sm">iOS & Android</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">End-to-end encrypted</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - App Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glassmorphism Card */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-blue-600/30 rounded-3xl blur-2xl" />
                
                {/* Main Card */}
                <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  {/* App Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Daily PA</p>
                        <p className="text-xs text-slate-400">Welcome back, Alex</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { icon: ListTodo, label: 'Tasks', value: '12', color: 'from-purple-500 to-purple-600' },
                      { icon: Calendar, label: 'Events', value: '5', color: 'from-indigo-500 to-indigo-600' },
                      { icon: CreditCard, label: 'Budget', value: '$2.4k', color: 'from-blue-500 to-cyan-500' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Tasks */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300 mb-3">Today&apos;s Tasks</p>
                    {[
                      { title: 'Team standup meeting', time: '9:00 AM', done: true },
                      { title: 'Review project proposal', time: '11:30 AM', done: false },
                      { title: 'Call with client', time: '2:00 PM', done: false },
                    ].map((task, i) => (
                      <motion.div
                        key={task.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          task.done 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-slate-500'
                        }`}>
                          {task.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${task.done ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-500">{task.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chat Preview */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-slate-300">
                          I&apos;ve organized your schedule for today. You have 3 meetings and 2 pending tasks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 shadow-xl"
                >
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Productivity</p>
                      <p className="text-[10px] text-slate-400">+28% this week</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Theme Switcher */}
      <section className="py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-slate-500 mr-2">Choose your theme:</span>
            {Object.entries(themes).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setActiveTheme(key as keyof typeof themes)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTheme === key 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 bg-gradient-to-r ${t.primary}`} />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Powerful Features</span>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                nothing you don&apos;t
              </span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-400">
              Four powerful modules working together to streamline your daily life.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: MessageCircle,
                title: "AI Chat Assistant",
                description: "Chat naturally with your PA. Ask questions, get recommendations, and manage your day through conversation.",
                gradient: "from-purple-500 to-indigo-500",
                features: ["Natural language processing", "Contextual reminders", "Smart suggestions"]
              },
              {
                icon: Calendar,
                title: "Smart Calendar",
                description: "Never miss an important date. Sync with your existing calendars and get intelligent scheduling suggestions.",
                gradient: "from-indigo-500 to-blue-500",
                features: ["Multi-calendar sync", "Smart scheduling", "Event reminders"]
              },
              {
                icon: ListTodo,
                title: "Task Management",
                description: "Organize your tasks with subtasks, priorities, and deadlines. Track progress and celebrate completion.",
                gradient: "from-blue-500 to-cyan-500",
                features: ["Nested subtasks", "Priority levels", "Progress tracking"]
              },
              {
                icon: Wallet,
                title: "Expense Tracker",
                description: "Keep your finances in check. Track expenses, set budgets, and visualize your spending patterns.",
                gradient: "from-cyan-500 to-teal-500",
                features: ["Receipt scanning", "Budget alerts", "Spending analytics"]
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full hover:bg-white/10 transition-all duration-500 overflow-hidden">
                  {/* Hover Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">{feature.description}</p>

                  <ul className="space-y-2">
                    {feature.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Simple Setup</span>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Get started in{' '}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                3 easy steps
              </span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create your account",
                description: "Sign up in seconds with your email or social accounts. No credit card required.",
                icon: Users
              },
              {
                step: "02",
                title: "Connect your world",
                description: "Link your calendars, import tasks, and set up your preferences. We'll handle the rest.",
                icon: Cloud
              },
              {
                step: "03",
                title: "Start achieving",
                description: "Let Daily PA organize your day. Chat, track, and accomplish more every day.",
                icon: Zap
              }
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                {/* Connection Line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
                )}
                
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all group">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  
                  <div className="w-16 h-16 mx-auto mt-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                    <item.icon className="w-8 h-8 text-purple-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section id="preview" className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Beautiful on{' '}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                every device
              </span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-400">
              Seamlessly sync between your phone, tablet, and desktop. Your data stays with you everywhere.
            </motion.p>
          </motion.div>

          {/* Device Mockups */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Desktop Mockup */}
            <div className="relative mx-auto max-w-5xl">
              <div className="relative bg-slate-900 rounded-t-2xl p-4 border border-white/10 shadow-2xl">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-800 rounded-lg px-4 py-1.5 text-xs text-slate-400 text-center">
                      app.dailypa.com
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="bg-slate-950 rounded-xl p-6 min-h-[400px]">
                  <div className="grid grid-cols-12 gap-4">
                    {/* Sidebar */}
                    <div className="col-span-3 bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600" />
                        <span className="font-semibold text-sm">Daily PA</span>
                      </div>
                      <div className="space-y-2">
                        {['Dashboard', 'Chat', 'Calendar', 'Tasks', 'Expenses'].map((item) => (
                          <div key={item} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="w-4 h-4 rounded bg-white/10" />
                            <span className="text-sm text-slate-400">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="col-span-9 space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-4 h-24" />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 h-48" />
                        <div className="bg-white/5 rounded-xl p-4 h-48" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stand */}
              <div className="mx-auto w-32 h-8 bg-slate-800 rounded-b-lg" />
              <div className="mx-auto w-48 h-2 bg-slate-800 rounded-full mt-1" />
            </div>

            {/* Floating Phone Mockup */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-0 w-48 hidden lg:block"
            >
              <div className="bg-slate-900 rounded-[2rem] p-3 border-4 border-slate-800 shadow-2xl">
                <div className="bg-slate-950 rounded-[1.5rem] overflow-hidden">
                  {/* Phone Notch */}
                  <div className="h-6 bg-slate-900 flex justify-center">
                    <div className="w-20 h-4 bg-black rounded-b-xl" />
                  </div>
                  {/* Phone Content */}
                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600" />
                      <div>
                        <div className="h-2 w-16 bg-white/20 rounded" />
                        <div className="h-1.5 w-10 bg-white/10 rounded mt-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-white/5 rounded-xl" />
                      <div className="h-16 bg-white/5 rounded-xl" />
                      <div className="h-16 bg-white/5 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-blue-600/20 rounded-3xl blur-3xl" />
            
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-16 text-center">
              <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Ready to get{' '}
                  <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    started?
                  </span>
                </h2>
                <p className="text-lg text-slate-400 mb-10">
                  Download the app today and transform how you manage your daily life. 
                  Available on iOS, Android, and Web.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <button className="flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
                    <Smartphone className="w-6 h-6" />
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="text-lg leading-none">App Store</div>
                    </div>
                  </button>
                  <button className="flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors">
                    <Download className="w-6 h-6" />
                    <div className="text-left">
                      <div className="text-xs">Get it on</div>
                      <div className="text-lg leading-none">Google Play</div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Free to start
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    No credit card required
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Cancel anytime
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Loved by{' '}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                thousands
              </span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Daily PA has completely transformed how I manage my work and personal life. The AI chat is incredibly intuitive.",
                author: "Sarah Chen",
                role: "Product Manager",
                company: "Tech Corp"
              },
              {
                quote: "Finally, an app that combines everything I need. No more switching between 5 different apps to stay organized.",
                author: "Marcus Johnson",
                role: "Entrepreneur",
                company: "StartUp Inc"
              },
              {
                quote: "The expense tracking feature alone has saved me hours every month. Highly recommend for anyone serious about productivity.",
                author: "Emily Rodriguez",
                role: "Freelance Designer",
                company: "Self-employed"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{testimonial.role} · {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Daily PA</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Your personal assistant for the modern age. Chat, organize, track, and achieve more every day.
              </p>
              <div className="flex gap-4 mt-6">
                {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="text-xs">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {['Features', 'Pricing', 'Security', 'Changelog'].map((item) => (
                  <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {['Privacy', 'Terms', 'Cookies', 'Licenses'].map((item) => (
                  <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Daily PA. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Cloud className="w-4 h-4" />
              <span>Syncing across all devices</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
