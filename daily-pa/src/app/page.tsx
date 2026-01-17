'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  Zap, 
  Shield, 
  LayoutDashboard, 
  Calendar, 
  CreditCard,
  Users,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Daily PA</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#solutions" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Solutions</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 text-sm font-medium rounded-md shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New: AI-Powered Insights</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              The workspace for <span className="text-blue-600">modern productivity.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
              Daily PA combines task management, financial tracking, and smart scheduling into one unified platform. Designed for professionals, students, and high-performance teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-base font-semibold rounded-lg shadow-md group">
                  Start for free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="border-slate-200 hover:bg-slate-50 px-8 h-14 text-base font-semibold rounded-lg">
                  View Live Demo
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-8 text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">10k+ Active Users</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-blue-50 rounded-full -z-10 blur-3xl opacity-50"></div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-base font-bold text-blue-600 uppercase tracking-widest mb-3">Features</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Everything you need to stay ahead.</h3>
            <p className="text-lg text-slate-600">Stop jumping between apps. Daily PA brings your entire workflow into a single, high-performance interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle2,
                title: "Advanced Task Management",
                description: "Organize tasks with nested subtasks, priority levels, and automated recurring schedules.",
                color: "text-blue-600",
                bgColor: "bg-blue-100"
              },
              {
                icon: CreditCard,
                title: "Financial Intelligence",
                description: "Track expenses, set budgets, and visualize spending patterns with professional-grade analytics.",
                color: "text-emerald-600",
                bgColor: "bg-emerald-100"
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Seamlessly sync with your existing calendars and manage your time with AI-driven suggestions.",
                color: "text-indigo-600",
                bgColor: "bg-indigo-100"
              },
              {
                icon: Zap,
                title: "Voice Integration",
                description: "Create tasks and log expenses on the go using advanced natural language processing.",
                color: "text-amber-600",
                bgColor: "bg-amber-100"
              },
              {
                icon: BarChart3,
                title: "Performance Reports",
                description: "Get weekly insights into your productivity and financial health with automated reports.",
                color: "text-rose-600",
                bgColor: "bg-rose-100"
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "Your data is encrypted and secure. We prioritize your privacy with enterprise-grade standards.",
                color: "text-slate-600",
                bgColor: "bg-slate-200"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-12 h-12 ${feature.bgColor} ${feature.color} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-base font-bold text-blue-600 uppercase tracking-widest mb-3">Solutions</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Tailored for your specific needs.</h3>
              
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">For Business & Office</h4>
                    <p className="text-slate-600">Manage client projects, track business expenses, and coordinate team schedules with ease.</p>
                  </div>
                </div>
                
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">For Students</h4>
                    <p className="text-slate-600">Keep track of assignments, manage study budgets, and never miss a deadline again.</p>
                  </div>
                </div>
                
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">For High Achievers</h4>
                    <p className="text-slate-600">A unified command center for your personal and professional life, optimized for speed.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl overflow-hidden">
                <div className="bg-slate-800 rounded-t-lg p-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="mx-auto bg-slate-700 rounded px-3 py-1 text-[10px] text-slate-400 font-mono">daily-pa.app/dashboard</div>
                </div>
                <div className="bg-slate-50 h-[400px] rounded-b-lg p-6">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    <div className="h-8 w-8 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="h-20 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
                    <div className="h-20 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
                    <div className="h-20 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-12 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center px-4 gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                      <div className="h-3 w-48 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-12 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center px-4 gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                      <div className="h-3 w-32 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-12 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center px-4 gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                      <div className="h-3 w-40 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-600 rounded-2xl -z-10 rotate-12 opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-500 rounded-full -z-10 opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Ready to transform your productivity?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">Join thousands of professionals and students who use Daily PA to manage their lives with precision.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-10 h-14 text-lg font-bold rounded-lg shadow-lg">
                Get Started for Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-blue-400 text-white hover:bg-blue-700 px-10 h-14 text-lg font-bold rounded-lg">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-blue-200 text-sm">No credit card required. 7-day free trial of premium features.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Daily PA</span>
              </div>
              <p className="text-sm leading-relaxed">The unified command center for modern productivity. Built for professionals, designed for everyone.</p>
            </div>
            
            <div>
              <h5 className="text-white font-bold mb-6">Product</h5>
              <ul className="space-y-4 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-bold mb-6">Company</h5>
              <ul className="space-y-4 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-bold mb-6">Legal</h5>
              <ul className="space-y-4 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs">&copy; 2025 Daily PA Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors"><span className="sr-only">Twitter</span>Twitter</Link>
              <Link href="#" className="hover:text-white transition-colors"><span className="sr-only">GitHub</span>GitHub</Link>
              <Link href="#" className="hover:text-white transition-colors"><span className="sr-only">LinkedIn</span>LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
