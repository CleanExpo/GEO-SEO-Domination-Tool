import Link from 'next/link';
import { ArrowRight, BarChart3, Search, TrendingUp, Terminal, Sparkles, Zap, FileCode, Globe, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="flex items-center justify-center p-8 pt-24">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-3 rounded-full text-sm font-semibold text-emerald-700 mb-8 shadow-sm border border-emerald-100">
              <Sparkles className="h-4 w-4" />
              AI-Powered SEO Analytics Platform
              <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">NEW</span>
            </div>
            <h1 className="text-7xl font-bold text-gray-900 mb-6 leading-tight">
              GEO-SEO
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Domination Tool
              </span>
            </h1>
            <p className="text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Track local rankings, analyze SEO performance, and dominate search results with advanced analytics
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Featuring <span className="font-semibold text-emerald-600">MetaCoder Sandbox</span> - AI-powered code generation with Claude Code, OpenAI Codex, and more
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-5 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sandbox"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-10 py-5 rounded-xl font-semibold hover:shadow-xl transition-all border-2 border-gray-200 hover:border-emerald-200 transform hover:scale-105"
              >
                <Terminal className="h-5 w-5" />
                Try Sandbox
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600">50K+</div>
                <div className="text-sm text-gray-500 mt-1">SEO Audits Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-teal-600">1M+</div>
                <div className="text-sm text-gray-500 mt-1">Keywords Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-600">99.9%</div>
                <div className="text-sm text-gray-500 mt-1">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Sandbox Feature Highlight */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full text-sm font-semibold text-emerald-400 mb-6">
              <Terminal className="h-4 w-4" />
              MetaCoder Sandbox
              <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">BETA</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">
              AI Code Generation
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                In Your Browser
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Generate production-ready code with Claude Code Max, OpenAI Codex, Cursor Composer, and Google Gemini
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">5 AI Agents</h3>
              </div>
              <p className="text-gray-300">
                Claude Code (Max Plan), GPT-5 Codex, Cursor Composer, Google Gemini 2.0, and OpenCode Engine
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FileCode className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Real-time Logs</h3>
              </div>
              <p className="text-gray-300">
                Watch your code being generated with live terminal output and syntax highlighting
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Live Preview</h3>
              </div>
              <p className="text-gray-300">
                See your generated code running instantly with Vercel preview deployments
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Session Management</h3>
              </div>
              <p className="text-gray-300">
                Create multiple sessions, switch between projects, and open in new windows
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/sandbox"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-105"
            >
              <Terminal className="h-5 w-5" />
              Launch Sandbox
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Everything you need to
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                dominate SEO
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for modern businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                <Search className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">SEO Audits</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive website analysis with E-E-A-T scoring, actionable insights and recommendations to improve your rankings
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Keyword Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor keyword rankings in real-time and discover new opportunities for organic growth across multiple search engines
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time analytics and detailed reports to track your SEO success and ROI with advanced data visualization
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-24">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to dominate search results?
          </h2>
          <p className="text-xl text-emerald-50 mb-10">
            Join thousands of businesses optimizing their SEO with our AI-powered platform
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-white text-emerald-600 px-12 py-6 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
