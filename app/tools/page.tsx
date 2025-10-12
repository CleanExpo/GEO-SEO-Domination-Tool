/**
 * Free SEO Tools Landing Page
 *
 * Hub for all 4 free tools:
 * - Backlink Checker
 * - Keyword Generator
 * - Authority Checker
 * - SERP Checker
 *
 * SEO-optimized landing page with internal linking
 */

import Link from 'next/link';
import {
  Link2,
  Sparkles,
  TrendingUp,
  Search,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';

export default function FreeToolsHub() {
  const tools = [
    {
      name: 'Backlink Checker',
      icon: Link2,
      description: 'Check any domain\'s backlink profile instantly. Get Domain Rating, total backlinks, and top referring domains.',
      href: '/tools/backlink-checker',
      gradient: 'from-blue-600 to-purple-600',
      hoverGradient: 'from-blue-700 to-purple-700',
      features: [
        'Domain Rating (0-100)',
        'Total backlinks count',
        'Referring domains',
        'Top 10 backlinks',
      ],
      searches: '49,500',
    },
    {
      name: 'Keyword Generator',
      icon: Sparkles,
      description: 'Generate keyword ideas from a seed keyword using AI. Get 20 free suggestions with search volume and difficulty.',
      href: '/tools/keyword-generator',
      gradient: 'from-purple-600 to-pink-600',
      hoverGradient: 'from-purple-700 to-pink-700',
      features: [
        '20 AI-generated keywords',
        'Search volume data',
        'Keyword difficulty',
        'Relevance scoring',
      ],
      searches: '22,200',
    },
    {
      name: 'Authority Checker',
      icon: TrendingUp,
      description: 'Check domain authority with our free tool. See Domain Rating, trust score, and authority level instantly.',
      href: '/tools/authority-checker',
      gradient: 'from-indigo-600 to-blue-600',
      hoverGradient: 'from-indigo-700 to-blue-700',
      features: [
        'Domain Rating score',
        'Trust score calculation',
        'Authority level (Low-High)',
        'Improvement recommendations',
      ],
      searches: '33,100',
    },
    {
      name: 'SERP Checker',
      icon: Search,
      description: 'Analyze Google search results for any keyword. See top 10 rankings with Domain Rating and backlink counts.',
      href: '/tools/serp-checker',
      gradient: 'from-green-600 to-teal-600',
      hoverGradient: 'from-green-700 to-teal-700',
      features: [
        'Top 10 search results',
        'Domain Rating per result',
        'Backlink counts',
        'SERP features detected',
      ],
      searches: '8,100',
    },
  ];

  const totalSearches = 112900;
  const expectedSignups = '2,258-5,645';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Zap className="h-16 w-16" />
              <h1 className="text-6xl font-bold">Free SEO Tools</h1>
            </div>
            <p className="text-2xl text-white/90 mb-4">
              Professional SEO analysis tools - 100% FREE. No signup required.
            </p>
            <p className="text-lg text-white/80 mb-8">
              The same tools used by enterprise SEO professionals, now accessible to everyone.
            </p>
            <div className="flex items-center justify-center gap-8 text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span className="text-lg">4 Professional Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span className="text-lg">Real-Time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span className="text-lg">No Credit Card</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link
                key={idx}
                href={tool.href}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-purple-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
              >
                {/* Tool Header */}
                <div className={`bg-gradient-to-r ${tool.gradient} text-white p-8`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{tool.name}</h3>
                      <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{tool.searches} monthly searches</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed">{tool.description}</p>
                </div>

                {/* Tool Features */}
                <div className="p-8">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    What You Get Free:
                  </h4>
                  <ul className="space-y-3 mb-6">
                    {tool.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-3 text-gray-700">
                        <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div
                    className={`bg-gradient-to-r ${tool.gradient} group-hover:${tool.hoverGradient} text-white px-6 py-4 rounded-lg flex items-center justify-between transition-all`}
                  >
                    <span className="font-bold text-lg">Try {tool.name}</span>
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Free SEO Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Data</h3>
              <p className="text-gray-600 leading-relaxed">
                Live data from multiple sources, not weeks-old cached data. Get accurate, up-to-date insights instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Quality</h3>
              <p className="text-gray-600 leading-relaxed">
                Enterprise-grade SEO tools used by professionals. Get the same quality data as paid tools, completely free.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Signup Required</h3>
              <p className="text-gray-600 leading-relaxed">
                Start analyzing immediately. No account creation, no credit card, no email verification. Just instant results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-blue-400 mb-2">{totalSearches.toLocaleString()}</div>
              <div className="text-gray-300">Monthly Search Volume</div>
              <div className="text-sm text-gray-400 mt-1">Combined tool popularity</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-400 mb-2">{expectedSignups}</div>
              <div className="text-gray-300">Expected Sign-ups/Month</div>
              <div className="text-sm text-gray-400 mt-1">At 2-5% conversion rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-pink-400 mb-2">99%</div>
              <div className="text-gray-300">Cheaper Than Ahrefs</div>
              <div className="text-sm text-gray-400 mt-1">Save $14,868/year</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="max-w-4xl mx-auto px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              <h2 className="text-4xl font-bold">Ready for Advanced SEO Tools?</h2>
            </div>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Get unlimited access to all tools plus advanced features like competitor analysis,
              SERP tracking, AI-powered insights, and comprehensive 117-point SEO audits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">Unlimited backlink analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">100+ keyword suggestions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">Full competitor analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">SERP opportunity scoring</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <span className="text-gray-700">AI-powered recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <span className="text-gray-700">117-point technical audit</span>
              </div>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition font-bold text-xl shadow-xl hover:shadow-2xl"
            >
              Start Free Trial - 99% Cheaper Than Ahrefs
              <ArrowRight className="h-7 w-7" />
            </Link>
            <p className="text-gray-500 mt-4">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Free SEO Tools</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/tools/backlink-checker" className="hover:text-white transition">Backlink Checker</Link></li>
                <li><Link href="/tools/keyword-generator" className="hover:text-white transition">Keyword Generator</Link></li>
                <li><Link href="/tools/authority-checker" className="hover:text-white transition">Authority Checker</Link></li>
                <li><Link href="/tools/serp-checker" className="hover:text-white transition">SERP Checker</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Premium Tools</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/signup" className="hover:text-white transition">Backlink Analysis</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">Keyword Research</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">Competitor Analysis</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">SERP Analysis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/blog" className="hover:text-white transition">SEO Blog</Link></li>
                <li><Link href="/guides" className="hover:text-white transition">SEO Guides</Link></li>
                <li><Link href="/support" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/api" className="hover:text-white transition">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 GEO-SEO Domination Tool. All rights reserved.</p>
            <p className="mt-2 text-sm">Save $14,868/year with our Ahrefs alternative.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
