import Link from 'next/link';
import { ArrowRight, BarChart3, Search, TrendingUp, Terminal, Sparkles, Zap, FileCode, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

// Force rebuild - production deployment
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="flex items-center justify-center p-8 pt-24">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <Badge variant="outline" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-3 text-sm font-semibold text-emerald-700 mb-8 border-emerald-200">
              <Sparkles className="h-4 w-4" />
              AI-Powered SEO Analytics Platform
              <Badge className="ml-2 bg-emerald-500 text-white text-xs">NEW</Badge>
            </Badge>
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
              <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 px-10 py-7 text-lg">
                <Link href="/onboarding">
                  Add New Client
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-10 py-7 text-lg border-2 hover:border-emerald-200">
                <Link href="/dashboard">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Dashboard
                </Link>
              </Button>
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
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-emerald-500/50 transition-all group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">5 AI Agents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Claude Code (Max Plan), GPT-5 Codex, Cursor Composer, Google Gemini 2.0, and OpenCode Engine
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-emerald-500/50 transition-all group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCode className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">Real-time Logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Watch your code being generated with live terminal output and syntax highlighting
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-emerald-500/50 transition-all group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">Live Preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  See your generated code running instantly with Vercel preview deployments
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-emerald-500/50 transition-all group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">Session Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Create multiple sessions, switch between projects, and open in new windows
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 px-10 py-7 text-lg">
              <Link href="/sandbox">
                <Terminal className="mr-2 h-5 w-5" />
                Launch Sandbox
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
            <Card className="hover:shadow-2xl transition-all transform hover:scale-105 group">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Search className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">SEO Audits</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed text-base">
                  Comprehensive website analysis with E-E-A-T scoring, actionable insights and recommendations to improve your rankings
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all transform hover:scale-105 group">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Keyword Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed text-base">
                  Monitor keyword rankings in real-time and discover new opportunities for organic growth across multiple search engines
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all transform hover:scale-105 group">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed text-base">
                  Real-time analytics and detailed reports to track your SEO success and ROI with advanced data visualization
                </CardDescription>
              </CardContent>
            </Card>
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
          <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-50 px-12 py-8 text-lg font-bold shadow-xl hover:shadow-2xl">
            <Link href="/onboarding">
              Add Your First Client
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
