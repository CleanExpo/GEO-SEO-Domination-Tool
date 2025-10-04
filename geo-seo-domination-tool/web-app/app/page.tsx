'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Search, TrendingUp, Zap, Target, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Search className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GEO-SEO</span>
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
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Floating Elements */}
      <div className="max-w-7xl mx-auto px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-emerald-700 shadow-sm border border-emerald-100">
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

            <p className="text-xl text-gray-600 leading-relaxed">
              Transform your SEO data into custom dashboards, automations, and intelligent insights with our AI-native platform.
            </p>

            <div className="flex gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-105"
              >
                Try it now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:shadow-md transition-all border border-gray-200"
              >
                Sign in with Google
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">SEO Audits</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">1M+</div>
                <div className="text-sm text-gray-600">Keywords Tracked</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right: Floating 3D Screenshot Showcase */}
          <div className="relative h-[600px]">
            {/* Main Dashboard Screenshot - Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] rounded-2xl shadow-2xl overflow-hidden border-4 border-white z-30 animate-float">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold mb-2">Analytics Dashboard</h3>
                  <p className="text-blue-100">Real-time SEO insights</p>
                </div>
              </div>
            </div>

            {/* Rankings Card - Top Left */}
            <div className="absolute top-8 left-4 w-64 h-48 rounded-xl shadow-xl overflow-hidden border-2 border-white z-20 animate-float-delayed-1">
              <div className="w-full h-full bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-gray-900">Rankings</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Position 1</span>
                    <span className="text-emerald-600 font-bold">#1</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Position 2</span>
                    <span className="text-blue-600 font-bold">#3</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Position 3</span>
                    <span className="text-purple-600 font-bold">#5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keywords Card - Top Right */}
            <div className="absolute top-20 right-8 w-56 h-40 rounded-xl shadow-xl overflow-hidden border-2 border-white z-20 animate-float-delayed-2">
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white">
                <Search className="w-6 h-6 mb-2" />
                <div className="text-3xl font-bold mb-1">2,847</div>
                <div className="text-emerald-100 text-sm">Active Keywords</div>
                <div className="mt-2 text-xs text-emerald-200">↑ 12% this month</div>
              </div>
            </div>

            {/* Companies Card - Bottom Left */}
            <div className="absolute bottom-16 left-8 w-60 h-44 rounded-xl shadow-xl overflow-hidden border-2 border-white z-10 animate-float-delayed-3">
              <div className="w-full h-full bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Companies</span>
                </div>
                <div className="space-y-2">
                  {['Company A', 'Company B', 'Company C'].map((name, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule Card - Bottom Right */}
            <div className="absolute bottom-24 right-4 w-48 h-36 rounded-xl shadow-xl overflow-hidden border-2 border-white z-10 animate-float-delayed-4">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 p-4 text-white">
                <Clock className="w-6 h-6 mb-2" />
                <div className="text-2xl font-bold mb-1">Next Audit</div>
                <div className="text-purple-100 text-sm">In 2 hours</div>
                <div className="mt-2 text-xs text-purple-200">Auto-scheduled</div>
              </div>
            </div>

            {/* Background Glow Effects */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-300 rounded-full opacity-20 blur-3xl -z-10"></div>
            <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl -z-10"></div>
          </div>
        </div>
      </div>

      {/* How It Works - Login Pathway */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Get started in 3 simple steps</h2>
          <p className="text-xl text-gray-600">Sign in and start optimizing your SEO in minutes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Click Sign In */}
          <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="absolute -top-4 left-8 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="mt-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  Sign In
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Click "Sign In"</h3>
              <p className="text-gray-600">
                Click the Sign In button in the top right corner to get started
              </p>
            </div>
          </div>

          {/* Step 2: Choose Google */}
          <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="absolute -top-4 left-8 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="mt-4 mb-6">
              <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in with Google</h3>
              <p className="text-gray-600">
                Use your Google account for quick and secure authentication
              </p>
            </div>
          </div>

          {/* Step 3: Start Using */}
          <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="absolute -top-4 left-8 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="mt-4 mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Optimizing</h3>
              <p className="text-gray-600">
                Access your dashboard and start tracking your SEO performance immediately
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Audits</h3>
            <p className="text-sm text-gray-600">
              Comprehensive website analysis with actionable insights and recommendations
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keyword Tracking</h3>
            <p className="text-sm text-gray-600">
              Monitor keyword rankings and discover new opportunities for growth
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Metrics</h3>
            <p className="text-sm text-gray-600">
              Real-time analytics and detailed reports to track your SEO success
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to dominate search results?</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses optimizing their SEO with our platform
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed-1 {
          animation: float 6s ease-in-out infinite 0.5s;
        }

        .animate-float-delayed-2 {
          animation: float 6s ease-in-out infinite 1s;
        }

        .animate-float-delayed-3 {
          animation: float 6s ease-in-out infinite 1.5s;
        }

        .animate-float-delayed-4 {
          animation: float 6s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
}
