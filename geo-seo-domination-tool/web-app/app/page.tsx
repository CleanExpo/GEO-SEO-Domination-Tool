'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Search, TrendingUp, Zap, Target, Clock, Users, Activity } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Search className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">GEO-SEO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 text-gray-700 font-medium hover:text-emerald-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Floating Elements */}
      <div className="max-w-7xl mx-auto px-8 pt-40 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-sm font-medium text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Transform Your SEO Strategy
            </div>

            <h1 className="text-6xl font-bold text-gray-900 leading-tight">
              Build SEO success
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                the way your business works
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
              Transform your SEO data into custom dashboards, automations, and intelligent insights with our AI-native platform.
            </p>

            <div className="flex gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:-translate-y-0.5"
              >
                Try it now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all border-2 border-gray-200 hover:border-emerald-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">50K+</div>
                <div className="text-sm text-gray-600 mt-1">SEO Audits</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">1M+</div>
                <div className="text-sm text-gray-600 mt-1">Keywords Tracked</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">99.9%</div>
                <div className="text-sm text-gray-600 mt-1">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right: Floating Screenshot Showcase - Real Dashboard Images */}
          <div className="relative h-[650px]">
            {/* Main Dashboard Screenshot - Center (Larger) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] transform-gpu transition-all duration-700 hover:scale-105 z-30 floating-card">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-xl shadow-2xl overflow-hidden border-4 border-white/50">
                  <div className="p-6 text-center text-white">
                    <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-90" />
                    <h3 className="text-2xl font-bold mb-2">Analytics Dashboard</h3>
                    <p className="text-blue-100">Real-time SEO insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rankings Screenshot - Top Left */}
            <div className="absolute top-12 left-0 w-64 transform-gpu hover:scale-105 transition-all duration-500 z-20 floating-card-delayed">
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-400 rounded-lg blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border-2 border-white/80">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-gray-900">Rankings</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-emerald-50 rounded">
                        <span className="text-xs text-gray-700">Position 1</span>
                        <span className="text-emerald-600 font-bold">#1</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-xs text-gray-700">Position 2</span>
                        <span className="text-blue-600 font-bold">#3</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                        <span className="text-xs text-gray-700">Position 3</span>
                        <span className="text-purple-600 font-bold">#5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keywords Card - Top Right */}
            <div className="absolute top-28 right-0 w-56 transform-gpu hover:scale-105 transition-all duration-500 z-20 floating-card-delayed-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-400 rounded-lg blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-xl overflow-hidden border-2 border-white p-5 text-white">
                  <Search className="w-7 h-7 mb-2" />
                  <div className="text-3xl font-bold mb-1">2,847</div>
                  <div className="text-emerald-100 text-xs font-medium">Active Keywords</div>
                  <div className="mt-2 flex items-center gap-1 text-emerald-200 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>↑ 12% this month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Companies Card - Bottom Left */}
            <div className="absolute bottom-24 left-8 w-60 transform-gpu hover:scale-105 transition-all duration-500 z-10 floating-card-delayed-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border-2 border-white/80">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900 text-sm">Companies</span>
                    </div>
                    <div className="space-y-1.5">
                      {['Company A', 'Company B'].map((name, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {name[0]}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Glow Effects */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-300 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* How It Works - Login Pathway */}
      <div className="max-w-7xl mx-auto px-8 py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Get started in 3 simple steps</h2>
          <p className="text-xl text-gray-600">Sign in and start optimizing your SEO in minutes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Step 1 */}
          <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all border border-gray-100 group">
            <div className="absolute -top-5 left-10 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
              1
            </div>
            <div className="mt-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  Sign In
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Click "Sign In"</h3>
              <p className="text-gray-600 leading-relaxed">
                Click the Sign In button in the top right corner to get started with your account
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all border border-gray-100 group">
            <div className="absolute -top-5 left-10 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
              2
            </div>
            <div className="mt-6">
              <div className="w-20 h-20 bg-white border-4 border-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign in with Google</h3>
              <p className="text-gray-600 leading-relaxed">
                Use your Google account for quick and secure authentication in seconds
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all border border-gray-100 group">
            <div className="absolute -top-5 left-10 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
              3
            </div>
            <div className="mt-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Optimizing</h3>
              <p className="text-gray-600 leading-relaxed">
                Access your dashboard and start tracking your SEO performance immediately
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to dominate SEO</h2>
          <p className="text-xl text-gray-600">Powerful features designed for modern businesses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100 group">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">SEO Audits</h3>
            <p className="text-gray-600 leading-relaxed">
              Comprehensive website analysis with actionable insights and recommendations to improve your rankings
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100 group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Keyword Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor keyword rankings in real-time and discover new opportunities for organic growth
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100 group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Performance Metrics</h3>
            <p className="text-gray-600 leading-relaxed">
              Real-time analytics and detailed reports to track your SEO success and ROI
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-16 text-center text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6">Ready to dominate search results?</h2>
            <p className="text-2xl text-emerald-100 mb-10 max-w-3xl mx-auto">
              Join thousands of businesses optimizing their SEO with our platform
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-white text-emerald-600 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 shadow-xl"
            >
              Get Started Free
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        .floating-card {
          animation: float 4s ease-in-out infinite;
        }

        .floating-card-delayed {
          animation: float-delayed 5s ease-in-out infinite 0.5s;
        }

        .floating-card-delayed-2 {
          animation: float 4.5s ease-in-out infinite 1s;
        }

        .floating-card-delayed-3 {
          animation: float-delayed 5.5s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
}
