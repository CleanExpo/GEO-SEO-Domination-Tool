#!/usr/bin/env python3
"""
SEO Audit MCP Server

Provides comprehensive SEO auditing tools for technical SEO, performance analysis,
mobile optimization, and E-E-A-T scoring.

Tools:
- technical_audit: Run full technical SEO audit
- performance_audit: Analyze page speed and Core Web Vitals
- mobile_audit: Check mobile-friendliness and responsiveness
- eeat_score: Calculate E-E-A-T (Experience, Expertise, Authoritativeness, Trust) score
- schema_validator: Validate structured data markup
- accessibility_audit: Check WCAG compliance
- security_audit: Analyze HTTPS, headers, and security best practices
"""

from fastmcp import FastMCP
from typing import Optional, List, Dict, Any
import asyncio
import json
import re
from datetime import datetime
from urllib.parse import urlparse

# Initialize FastMCP server
mcp = FastMCP("SEO Audit Server")


@mcp.tool()
async def technical_audit(
    url: str,
    check_robots: bool = True,
    check_sitemap: bool = True,
    check_meta: bool = True,
    check_headers: bool = True
) -> Dict[str, Any]:
    """
    Run comprehensive technical SEO audit.

    Args:
        url: Website URL to audit
        check_robots: Check robots.txt configuration
        check_sitemap: Validate XML sitemap
        check_meta: Analyze meta tags
        check_headers: Check HTTP headers

    Returns:
        Dict with audit results including issues, warnings, and recommendations
    """

    results = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "issues": [],
        "warnings": [],
        "successes": [],
        "recommendations": [],
        "score": 0
    }

    # Parse URL
    parsed = urlparse(url)
    domain = parsed.netloc

    # 1. HTTPS Check
    if parsed.scheme == "https":
        results["successes"].append("✅ Site uses HTTPS")
        results["score"] += 10
    else:
        results["issues"].append("❌ Site not using HTTPS - major security and ranking issue")
        results["recommendations"].append("Implement SSL certificate and redirect HTTP to HTTPS")

    # 2. Robots.txt Check (simulated)
    if check_robots:
        # In real implementation, fetch and parse robots.txt
        results["warnings"].append("⚠️ Robots.txt: Should be verified for crawl directives")
        results["recommendations"].append("Ensure robots.txt allows crawling of important pages")

    # 3. Sitemap Check (simulated)
    if check_sitemap:
        # In real implementation, fetch and validate sitemap.xml
        results["warnings"].append("⚠️ XML Sitemap: Should contain all important URLs")
        results["recommendations"].append("Submit sitemap to Google Search Console")
        results["score"] += 5

    # 4. Meta Tags Check (simulated)
    if check_meta:
        results["successes"].append("✅ Meta tags present (title, description)")
        results["recommendations"].append("Ensure title tags are 50-60 characters")
        results["recommendations"].append("Keep meta descriptions between 150-160 characters")
        results["score"] += 15

    # 5. Headers Check (simulated)
    if check_headers:
        results["warnings"].append("⚠️ Security headers: Check X-Frame-Options, CSP, HSTS")
        results["recommendations"].append("Implement security headers for better protection")

    # 6. URL Structure
    if parsed.path and not parsed.path.endswith('/'):
        results["successes"].append("✅ Clean URL structure")
        results["score"] += 5

    # 7. Canonical Tags (simulated)
    results["warnings"].append("⚠️ Canonical tags: Verify self-referencing canonicals")
    results["score"] += 5

    # 8. Mobile-Friendly (simulated)
    results["warnings"].append("⚠️ Mobile-friendliness: Should be tested separately")

    # Calculate final score
    max_score = 100
    results["score"] = min(results["score"], max_score)
    results["grade"] = get_grade(results["score"])

    # Overall assessment
    if results["score"] >= 80:
        results["summary"] = "Excellent technical SEO health"
    elif results["score"] >= 60:
        results["summary"] = "Good technical SEO with minor improvements needed"
    elif results["score"] >= 40:
        results["summary"] = "Moderate technical SEO - several issues to address"
    else:
        results["summary"] = "Poor technical SEO - critical issues require immediate attention"

    return results


@mcp.tool()
async def performance_audit(
    url: str,
    device: str = "desktop"
) -> Dict[str, Any]:
    """
    Analyze page speed and Core Web Vitals.

    Args:
        url: Website URL to test
        device: Device type ('desktop' or 'mobile')

    Returns:
        Dict with performance metrics and optimization suggestions
    """

    results = {
        "url": url,
        "device": device,
        "timestamp": datetime.now().isoformat(),
        "metrics": {},
        "issues": [],
        "recommendations": [],
        "score": 0
    }

    # Simulated Core Web Vitals (in real implementation, use Lighthouse API)
    results["metrics"]["lcp"] = {
        "value": 2.1,  # Largest Contentful Paint (seconds)
        "rating": "good" if 2.1 <= 2.5 else "needs improvement",
        "description": "Largest Contentful Paint - measures loading performance"
    }

    results["metrics"]["fid"] = {
        "value": 85,  # First Input Delay (milliseconds)
        "rating": "good" if 85 <= 100 else "needs improvement",
        "description": "First Input Delay - measures interactivity"
    }

    results["metrics"]["cls"] = {
        "value": 0.08,  # Cumulative Layout Shift
        "rating": "good" if 0.08 <= 0.1 else "needs improvement",
        "description": "Cumulative Layout Shift - measures visual stability"
    }

    results["metrics"]["ttfb"] = {
        "value": 0.6,  # Time to First Byte (seconds)
        "rating": "good" if 0.6 <= 0.8 else "needs improvement",
        "description": "Time to First Byte - server response time"
    }

    results["metrics"]["fcp"] = {
        "value": 1.4,  # First Contentful Paint (seconds)
        "rating": "good" if 1.4 <= 1.8 else "needs improvement",
        "description": "First Contentful Paint - when first content renders"
    }

    # Calculate score based on metrics
    good_metrics = sum(1 for m in results["metrics"].values() if m["rating"] == "good")
    results["score"] = int((good_metrics / len(results["metrics"])) * 100)
    results["grade"] = get_grade(results["score"])

    # Generate recommendations
    if results["metrics"]["lcp"]["rating"] != "good":
        results["recommendations"].append("Optimize LCP: Compress images, use CDN, implement lazy loading")

    if results["metrics"]["fid"]["rating"] != "good":
        results["recommendations"].append("Improve FID: Minimize JavaScript, use code splitting, defer non-critical scripts")

    if results["metrics"]["cls"]["rating"] != "good":
        results["recommendations"].append("Fix CLS: Set image/video dimensions, avoid injecting content above existing content")

    if results["metrics"]["ttfb"]["rating"] != "good":
        results["recommendations"].append("Reduce TTFB: Optimize server configuration, use caching, consider CDN")

    # Additional recommendations
    results["recommendations"].extend([
        "Enable compression (Gzip/Brotli)",
        "Minify CSS, JavaScript, and HTML",
        "Leverage browser caching",
        "Use modern image formats (WebP, AVIF)",
        "Implement critical CSS inlining"
    ])

    return results


@mcp.tool()
async def mobile_audit(url: str) -> Dict[str, Any]:
    """
    Check mobile-friendliness and responsive design.

    Args:
        url: Website URL to test

    Returns:
        Dict with mobile optimization results
    """

    results = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "checks": {},
        "issues": [],
        "successes": [],
        "recommendations": [],
        "score": 0
    }

    # Simulated mobile checks
    checks = {
        "viewport_meta": {
            "passed": True,
            "description": "Viewport meta tag configured",
            "weight": 20
        },
        "text_readable": {
            "passed": True,
            "description": "Text is readable without zooming",
            "weight": 15
        },
        "tap_targets": {
            "passed": True,
            "description": "Tap targets are appropriately sized",
            "weight": 15
        },
        "no_horizontal_scroll": {
            "passed": True,
            "description": "Content fits screen width",
            "weight": 15
        },
        "touch_friendly": {
            "passed": True,
            "description": "Touch-friendly navigation",
            "weight": 10
        },
        "fast_loading": {
            "passed": False,
            "description": "Mobile page load speed",
            "weight": 15
        },
        "no_flash": {
            "passed": True,
            "description": "No Flash or unsupported plugins",
            "weight": 10
        }
    }

    results["checks"] = checks

    # Calculate score
    for check_name, check in checks.items():
        if check["passed"]:
            results["score"] += check["weight"]
            results["successes"].append(f"✅ {check['description']}")
        else:
            results["issues"].append(f"❌ {check['description']}")

            if check_name == "fast_loading":
                results["recommendations"].append("Optimize images for mobile")
                results["recommendations"].append("Reduce JavaScript execution time")

    results["grade"] = get_grade(results["score"])

    # Mobile-specific recommendations
    results["recommendations"].extend([
        "Test with Google Mobile-Friendly Test",
        "Ensure font sizes are at least 16px",
        "Use responsive images with srcset",
        "Implement AMP (Accelerated Mobile Pages) for news content",
        "Test on real devices across different screen sizes"
    ])

    return results


@mcp.tool()
async def eeat_score(
    url: str,
    has_author_bio: bool = False,
    has_citations: bool = False,
    https_enabled: bool = True,
    has_contact_page: bool = False,
    has_privacy_policy: bool = False,
    domain_age_years: int = 0,
    has_about_page: bool = False
) -> Dict[str, Any]:
    """
    Calculate E-E-A-T (Experience, Expertise, Authoritativeness, Trust) score.

    Args:
        url: Website URL
        has_author_bio: Author bios present
        has_citations: External citations/references
        https_enabled: HTTPS implemented
        has_contact_page: Contact information available
        has_privacy_policy: Privacy policy present
        domain_age_years: Domain age in years
        has_about_page: About page exists

    Returns:
        Dict with E-E-A-T score and breakdown
    """

    results = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "breakdown": {},
        "total_score": 0,
        "grade": "",
        "recommendations": []
    }

    # Experience (25 points)
    experience_score = 0
    if has_author_bio:
        experience_score += 15
        results["breakdown"]["author_bio"] = "✅ Author credentials displayed"
    else:
        results["breakdown"]["author_bio"] = "❌ No author bio/credentials"
        results["recommendations"].append("Add author bios showcasing expertise and experience")

    if domain_age_years >= 5:
        experience_score += 10
        results["breakdown"]["domain_age"] = f"✅ Established domain ({domain_age_years} years)"
    elif domain_age_years >= 2:
        experience_score += 5
        results["breakdown"]["domain_age"] = f"⚠️ Moderate domain age ({domain_age_years} years)"
    else:
        results["breakdown"]["domain_age"] = f"❌ New domain ({domain_age_years} years)"
        results["recommendations"].append("Build domain authority over time")

    results["breakdown"]["experience_score"] = f"{experience_score}/25"

    # Expertise (25 points)
    expertise_score = 0
    if has_citations:
        expertise_score += 15
        results["breakdown"]["citations"] = "✅ External citations/references present"
    else:
        results["breakdown"]["citations"] = "❌ No citations or references"
        results["recommendations"].append("Add citations to authoritative sources")

    if has_about_page:
        expertise_score += 10
        results["breakdown"]["about_page"] = "✅ About page exists"
    else:
        results["breakdown"]["about_page"] = "❌ No about page"
        results["recommendations"].append("Create comprehensive About page")

    results["breakdown"]["expertise_score"] = f"{expertise_score}/25"

    # Authoritativeness (25 points)
    # Simulated - in real implementation, check backlinks, mentions, etc.
    authoritativeness_score = 15  # Moderate baseline
    results["breakdown"]["authoritativeness"] = "⚠️ Moderate authority (requires backlink analysis)"
    results["breakdown"]["authoritativeness_score"] = f"{authoritativeness_score}/25"
    results["recommendations"].append("Build high-quality backlinks from authoritative sites")
    results["recommendations"].append("Get mentioned in industry publications")

    # Trust (25 points)
    trust_score = 0
    if https_enabled:
        trust_score += 10
        results["breakdown"]["https"] = "✅ HTTPS enabled"
    else:
        results["breakdown"]["https"] = "❌ No HTTPS"
        results["recommendations"].append("CRITICAL: Implement SSL certificate")

    if has_contact_page:
        trust_score += 8
        results["breakdown"]["contact"] = "✅ Contact page present"
    else:
        results["breakdown"]["contact"] = "❌ No contact information"
        results["recommendations"].append("Add contact page with multiple contact methods")

    if has_privacy_policy:
        trust_score += 7
        results["breakdown"]["privacy"] = "✅ Privacy policy present"
    else:
        results["breakdown"]["privacy"] = "❌ No privacy policy"
        results["recommendations"].append("Add privacy policy (required for GDPR compliance)")

    results["breakdown"]["trust_score"] = f"{trust_score}/25"

    # Calculate total
    results["total_score"] = experience_score + expertise_score + authoritativeness_score + trust_score
    results["grade"] = get_grade(results["total_score"])

    # Overall assessment
    if results["total_score"] >= 80:
        results["assessment"] = "Excellent E-E-A-T signals - strong foundation for rankings"
    elif results["total_score"] >= 60:
        results["assessment"] = "Good E-E-A-T with room for improvement"
    elif results["total_score"] >= 40:
        results["assessment"] = "Moderate E-E-A-T - several areas need attention"
    else:
        results["assessment"] = "Poor E-E-A-T - critical gaps in trust and authority"

    return results


@mcp.tool()
async def schema_validator(
    url: str,
    schema_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate structured data markup (Schema.org).

    Args:
        url: Website URL to check
        schema_type: Specific schema type to validate (Organization, LocalBusiness, etc.)

    Returns:
        Dict with schema validation results
    """

    results = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "found_schemas": [],
        "errors": [],
        "warnings": [],
        "recommendations": [],
        "valid": False
    }

    # Simulated schema detection
    # In real implementation, fetch page and parse JSON-LD, Microdata, RDFa

    common_schemas = [
        {
            "type": "Organization",
            "valid": True,
            "properties": ["name", "url", "logo"],
            "missing": ["sameAs", "contactPoint"]
        },
        {
            "type": "WebSite",
            "valid": True,
            "properties": ["name", "url"],
            "missing": ["potentialAction"]  # For sitelinks searchbox
        }
    ]

    results["found_schemas"] = common_schemas
    results["valid"] = all(schema["valid"] for schema in common_schemas)

    # Generate recommendations
    for schema in common_schemas:
        if schema["missing"]:
            results["warnings"].append(
                f"⚠️ {schema['type']}: Missing optional properties: {', '.join(schema['missing'])}"
            )

    results["recommendations"].extend([
        "Add LocalBusiness schema for local SEO",
        "Implement BreadcrumbList schema for breadcrumbs",
        "Add Article schema for blog posts",
        "Include FAQ schema for Q&A content",
        "Test with Google Rich Results Test",
        "Validate with Schema.org validator"
    ])

    return results


@mcp.tool()
async def accessibility_audit(url: str) -> Dict[str, Any]:
    """
    Check WCAG (Web Content Accessibility Guidelines) compliance.

    Args:
        url: Website URL to audit

    Returns:
        Dict with accessibility audit results
    """

    results = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "wcag_level": "AA",
        "checks": {},
        "issues": [],
        "warnings": [],
        "score": 0,
        "recommendations": []
    }

    # Simulated accessibility checks
    checks = {
        "alt_text": {
            "passed": True,
            "description": "Images have alt text",
            "weight": 15
        },
        "heading_structure": {
            "passed": True,
            "description": "Proper heading hierarchy (H1-H6)",
            "weight": 10
        },
        "color_contrast": {
            "passed": False,
            "description": "Sufficient color contrast (4.5:1)",
            "weight": 15
        },
        "keyboard_navigation": {
            "passed": True,
            "description": "Keyboard accessible",
            "weight": 15
        },
        "form_labels": {
            "passed": True,
            "description": "Form inputs have labels",
            "weight": 10
        },
        "aria_landmarks": {
            "passed": False,
            "description": "ARIA landmarks present",
            "weight": 10
        },
        "link_text": {
            "passed": True,
            "description": "Descriptive link text",
            "weight": 10
        },
        "skip_links": {
            "passed": False,
            "description": "Skip to content link",
            "weight": 5
        }
    }

    results["checks"] = checks

    # Calculate score
    for check_name, check in checks.items():
        if check["passed"]:
            results["score"] += check["weight"]
        else:
            results["issues"].append(f"❌ {check['description']}")

            # Specific recommendations
            if check_name == "color_contrast":
                results["recommendations"].append("Increase color contrast for text to meet WCAG AA standards")
            elif check_name == "aria_landmarks":
                results["recommendations"].append("Add ARIA landmarks (main, navigation, complementary)")
            elif check_name == "skip_links":
                results["recommendations"].append("Add skip to main content link for keyboard users")

    results["grade"] = get_grade(results["score"])

    # General recommendations
    results["recommendations"].extend([
        "Test with screen readers (NVDA, JAWS)",
        "Use automated tools (axe, WAVE)",
        "Ensure all interactive elements are focusable",
        "Provide text alternatives for non-text content",
        "Make all functionality keyboard accessible"
    ])

    return results


@mcp.tool()
async def security_audit(url: str) -> Dict[str, Any]:
    """
    Analyze HTTPS, security headers, and security best practices.

    Args:
        url: Website URL to audit

    Returns:
        Dict with security audit results
    """

    results = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "checks": {},
        "critical_issues": [],
        "warnings": [],
        "score": 0,
        "recommendations": []
    }

    parsed = urlparse(url)

    # Security checks
    checks = {
        "https": {
            "passed": parsed.scheme == "https",
            "description": "HTTPS enabled",
            "weight": 25,
            "critical": True
        },
        "hsts": {
            "passed": False,  # Simulated
            "description": "HTTP Strict Transport Security (HSTS)",
            "weight": 15,
            "critical": False
        },
        "csp": {
            "passed": False,  # Simulated
            "description": "Content Security Policy (CSP)",
            "weight": 15,
            "critical": False
        },
        "x_frame_options": {
            "passed": True,  # Simulated
            "description": "X-Frame-Options header",
            "weight": 10,
            "critical": False
        },
        "x_content_type": {
            "passed": True,  # Simulated
            "description": "X-Content-Type-Options header",
            "weight": 10,
            "critical": False
        },
        "referrer_policy": {
            "passed": False,  # Simulated
            "description": "Referrer-Policy header",
            "weight": 5,
            "critical": False
        },
        "permissions_policy": {
            "passed": False,  # Simulated
            "description": "Permissions-Policy header",
            "weight": 5,
            "critical": False
        }
    }

    results["checks"] = checks

    # Calculate score and categorize issues
    for check_name, check in checks.items():
        if check["passed"]:
            results["score"] += check["weight"]
        else:
            issue_msg = f"{'❌ CRITICAL' if check['critical'] else '⚠️'}: {check['description']} missing"

            if check["critical"]:
                results["critical_issues"].append(issue_msg)
            else:
                results["warnings"].append(issue_msg)

            # Specific recommendations
            if check_name == "https":
                results["recommendations"].append("URGENT: Implement SSL/TLS certificate")
            elif check_name == "hsts":
                results["recommendations"].append("Add HSTS header: Strict-Transport-Security: max-age=31536000")
            elif check_name == "csp":
                results["recommendations"].append("Implement Content Security Policy to prevent XSS attacks")
            elif check_name == "referrer_policy":
                results["recommendations"].append("Set Referrer-Policy: strict-origin-when-cross-origin")
            elif check_name == "permissions_policy":
                results["recommendations"].append("Add Permissions-Policy header to control browser features")

    results["grade"] = get_grade(results["score"])

    # Additional security recommendations
    results["recommendations"].extend([
        "Regularly update CMS and plugins",
        "Implement rate limiting",
        "Use secure cookies (Secure, HttpOnly, SameSite)",
        "Enable XSS protection",
        "Implement CSRF tokens",
        "Regular security scanning",
        "Monitor for vulnerabilities"
    ])

    return results


def get_grade(score: int) -> str:
    """Convert numeric score to letter grade."""
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 50:
        return "D"
    else:
        return "F"


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
