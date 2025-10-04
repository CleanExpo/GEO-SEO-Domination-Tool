# Schema.org Reference Guide

## What is Schema.org?

Schema.org is a collaborative project for creating, maintaining, and promoting structured data schemas for web content. It helps websites provide more informative and meaningful metadata that search engines can understand and use to display richer search results.

**Official Website:** https://schema.org
**Validator:** https://validator.schema.org
**GitHub:** https://github.com/schemaorg/schemaorg

---

## Current Vocabulary Stats

- **817 Types** - Different entity types (Person, Product, Event, etc.)
- **1,518 Properties** - Attributes and relationships
- **14 Datatypes** - Data types (Text, Number, Date, etc.)
- **94 Enumerations** - Fixed value lists
- **521 Enumeration Members** - Specific enumeration values

---

## Why Use Schema.org?

### Benefits for SEO and Search Engines

1. **Rich Snippets** - Enhanced search results with ratings, images, prices
2. **Knowledge Graph** - Better representation in Google's Knowledge Panel
3. **Voice Search** - Improved voice assistant understanding
4. **Better CTR** - Rich results attract more clicks
5. **Future-Proofing** - Standard supported by Google, Bing, Yahoo, Yandex

### Business Benefits

- **Increased Visibility** - Stand out in search results
- **Higher Click Rates** - Rich snippets get more attention
- **Better User Experience** - More informative search results
- **Competitive Advantage** - Many sites still don't use structured data
- **Local SEO Boost** - Crucial for local business visibility

---

## Supported Formats

### 1. JSON-LD (Recommended)

**Best for:** Modern websites, SPAs, React/Next.js apps

**Advantages:**
- Doesn't interfere with HTML structure
- Easy to add, remove, and maintain
- Preferred by Google
- Can be added anywhere in `<head>` or `<body>`

**Example:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Mike's Coffee Shop",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Portland",
    "addressRegion": "OR",
    "postalCode": "97205",
    "addressCountry": "US"
  },
  "telephone": "+1-555-123-4567",
  "openingHours": "Mo-Fr 08:00-17:00",
  "priceRange": "$$"
}
</script>
```

---

### 2. Microdata

**Best for:** Server-rendered HTML, WordPress, traditional websites

**Advantages:**
- Inline with HTML content
- Direct association with visible elements
- Good for templating systems

**Example:**
```html
<div itemscope itemtype="https://schema.org/Movie">
  <h1 itemprop="name">Avatar</h1>
  <div itemprop="director" itemscope itemtype="https://schema.org/Person">
    Director: <span itemprop="name">James Cameron</span>
  </div>
  <span itemprop="genre">Science fiction</span>
  <span itemprop="datePublished" content="2009-12-18">2009</span>
</div>
```

---

### 3. RDFa

**Best for:** Publishing industry, scientific content

**Example:**
```html
<div vocab="https://schema.org/" typeof="Product">
  <span property="name">Executive Anvil</span>
  <img property="image" src="anvil.jpg" />
  <span property="description">Sleek and modern anvil</span>
  <span property="offers" typeof="Offer">
    Price: <span property="price">$119.99</span>
    <meta property="priceCurrency" content="USD" />
  </span>
</div>
```

---

## Main Schema Categories

### 1. Creative Works

**CreativeWork Hierarchy:**
```
CreativeWork
├── Article
│   ├── BlogPosting
│   ├── NewsArticle
│   └── ScholarlyArticle
├── Book
├── Course
├── Movie
├── MusicRecording
├── Podcast
├── Recipe
├── TVSeries
└── VideoObject
```

**Common Properties:**
- `name` - Title of the work
- `author` - Creator
- `datePublished` - Publication date
- `headline` - Headline or title
- `description` - Summary
- `image` - Associated image
- `publisher` - Publishing organization

---

### 2. Organizations & Businesses

**Organization Hierarchy:**
```
Organization
├── LocalBusiness
│   ├── Restaurant
│   ├── Store
│   ├── AutoRepair
│   ├── HealthAndBeautyBusiness
│   └── ProfessionalService
├── Corporation
├── EducationalOrganization
└── GovernmentOrganization
```

**Common Properties:**
- `name` - Business name
- `address` - Physical address
- `telephone` - Phone number
- `email` - Contact email
- `logo` - Company logo
- `url` - Website URL
- `openingHours` - Business hours
- `priceRange` - Price range ($ to $$$$)
- `geo` - Geographic coordinates

---

### 3. Products & Offers

**Product Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Executive Anvil",
  "image": "https://example.com/photos/anvil.jpg",
  "description": "Sleek and modern anvil for executives",
  "brand": {
    "@type": "Brand",
    "name": "ACME"
  },
  "offers": {
    "@type": "Offer",
    "price": "119.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "ACME Store"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "237"
  }
}
```

---

### 4. Events

**Event Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Web Development Conference 2025",
  "startDate": "2025-03-15T09:00",
  "endDate": "2025-03-17T18:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Convention Center",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Conference Blvd",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "postalCode": "94102",
      "addressCountry": "US"
    }
  },
  "image": "https://example.com/event-image.jpg",
  "description": "Annual web development conference",
  "offers": {
    "@type": "Offer",
    "price": "299.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/tickets"
  },
  "performer": {
    "@type": "Person",
    "name": "Jane Developer"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Web Dev Alliance",
    "url": "https://webdevalliance.org"
  }
}
```

---

### 5. People

**Person Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jane Doe",
  "jobTitle": "Senior Software Engineer",
  "image": "https://example.com/jane-photo.jpg",
  "url": "https://janedoe.dev",
  "sameAs": [
    "https://twitter.com/janedoe",
    "https://linkedin.com/in/janedoe",
    "https://github.com/janedoe"
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "Tech Corp"
  },
  "email": "jane@example.com",
  "telephone": "+1-555-987-6543",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "addressCountry": "US"
  }
}
```

---

### 6. Reviews & Ratings

**Review Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "Product",
    "name": "Wireless Headphones",
    "image": "https://example.com/headphones.jpg"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Person",
    "name": "John Smith"
  },
  "reviewBody": "Amazing sound quality and comfortable to wear all day!",
  "datePublished": "2025-01-15"
}
```

**AggregateRating:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Wireless Headphones",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "1523",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

---

### 7. Recipes

**Recipe Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Chocolate Chip Cookies",
  "image": "https://example.com/cookies.jpg",
  "author": {
    "@type": "Person",
    "name": "Chef Sarah"
  },
  "datePublished": "2025-01-20",
  "description": "Classic homemade chocolate chip cookies",
  "prepTime": "PT15M",
  "cookTime": "PT10M",
  "totalTime": "PT25M",
  "recipeYield": "24 cookies",
  "recipeCategory": "Dessert",
  "recipeCuisine": "American",
  "keywords": "chocolate chip, cookies, dessert",
  "recipeIngredient": [
    "2 1/4 cups all-purpose flour",
    "1 cup butter, softened",
    "3/4 cup sugar",
    "2 eggs",
    "2 cups chocolate chips"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": "Preheat oven to 375°F"
    },
    {
      "@type": "HowToStep",
      "text": "Mix butter and sugar until fluffy"
    },
    {
      "@type": "HowToStep",
      "text": "Add eggs and mix well"
    }
  ],
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "150 calories",
    "fatContent": "8g",
    "carbohydrateContent": "20g"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "342"
  }
}
```

---

### 8. Articles & Blog Posts

**Article Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "10 Tips for Better SEO in 2025",
  "image": "https://example.com/seo-tips.jpg",
  "author": {
    "@type": "Person",
    "name": "Mike Johnson",
    "url": "https://example.com/author/mike"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SEO Experts Blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-20",
  "description": "Learn the latest SEO strategies for 2025",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/seo-tips"
  },
  "articleSection": "SEO",
  "wordCount": 1500,
  "keywords": ["SEO", "search optimization", "2025"]
}
```

---

### 9. FAQs

**FAQPage Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Schema.org?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Schema.org is a collaborative project to create and promote structured data schemas for the web."
      }
    },
    {
      "@type": "Question",
      "name": "Why should I use Schema markup?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Schema markup helps search engines understand your content better, leading to rich snippets and better visibility."
      }
    }
  ]
}
```

---

### 10. Breadcrumbs

**BreadcrumbList Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://example.com/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Electronics",
      "item": "https://example.com/products/electronics"
    }
  ]
}
```

---

## Implementation Best Practices

### 1. Mark Up Only Visible Content
- Don't include hidden or invisible text in schema markup
- Schema should reflect what users actually see on the page
- Use `<meta>` tags sparingly for truly implicit information

### 2. Use Specific Types
- Use the most specific schema type available
- Example: Use `Restaurant` instead of generic `LocalBusiness`
- Example: Use `BlogPosting` instead of generic `Article`

### 3. Required vs Recommended Properties
- Always include required properties
- Add recommended properties for better rich results
- More complete schemas = better search visibility

### 4. Date and Time Formats

**Use ISO 8601 format:**
```html
<!-- Date only -->
<time datetime="2025-03-15">March 15, 2025</time>

<!-- Date and time -->
<time datetime="2025-03-15T14:30:00-08:00">2:30 PM PST</time>

<!-- Duration -->
<meta itemprop="prepTime" content="PT15M">  <!-- 15 minutes -->
<meta itemprop="cookTime" content="PT1H30M"> <!-- 1 hour 30 minutes -->
```

### 5. Multiple Schemas on One Page

**Combine multiple schemas:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Example Company",
      "url": "https://example.com"
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "publisher": {
        "@id": "https://example.com/#organization"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://example.com/about",
      "url": "https://example.com/about",
      "isPartOf": {
        "@id": "https://example.com/#website"
      }
    }
  ]
}
</script>
```

### 6. Image Requirements

**For optimal rich results:**
- Minimum width: 1200px
- Aspect ratios: 16x9, 4x3, 1x1
- Format: JPG, PNG, WebP
- High resolution for best display
- Use absolute URLs

### 7. Canonical URLs

**Always use canonical URLs:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "url": "https://example.com/products/anvil",
  "mainEntityOfPage": "https://example.com/products/anvil"
}
```

---

## Validation and Testing

### 1. Google Rich Results Test
**URL:** https://search.google.com/test/rich-results

**Tests for:**
- Valid JSON-LD/Microdata/RDFa
- Eligibility for rich results
- Errors and warnings
- Mobile and desktop previews

### 2. Schema.org Validator
**URL:** https://validator.schema.org

**Tests for:**
- Schema syntax correctness
- Property validity
- Type hierarchies
- General conformance

### 3. Google Search Console
- Submit sitemap with structured data
- Monitor rich result performance
- View enhancement reports
- Fix structured data errors

---

## Common Schema Combinations for SEO

### Local Business with Reviews
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Mike's Italian Kitchen",
  "image": "https://example.com/restaurant.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "456 Oak Street",
    "addressLocality": "Portland",
    "addressRegion": "OR",
    "postalCode": "97205",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "45.5152",
    "longitude": "-122.6784"
  },
  "telephone": "+1-555-234-5678",
  "servesCuisine": "Italian",
  "priceRange": "$$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "17:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "12:00",
      "closes": "23:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "189"
  }
}
```

### E-commerce Product
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Ergonomic Office Chair",
  "image": [
    "https://example.com/chair-front.jpg",
    "https://example.com/chair-side.jpg"
  ],
  "description": "Premium ergonomic office chair with lumbar support",
  "sku": "CHAIR-123",
  "mpn": "EC-9000",
  "brand": {
    "@type": "Brand",
    "name": "ErgoLife"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/chair",
    "priceCurrency": "USD",
    "price": "399.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "USD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "US"
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "452"
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Sarah Johnson"
      },
      "reviewBody": "Best office chair I've ever owned!"
    }
  ]
}
```

---

## Integration with GEO SEO Domination Tool

### Automatic Schema Generation
The tool can automatically generate schema markup for:
- **LocalBusiness** - From business information
- **Product** - From product catalogs
- **Article** - From blog posts
- **FAQPage** - From FAQ sections
- **BreadcrumbList** - From site navigation
- **Review** - From customer reviews

### Schema Validation
Built-in validation using:
- Schema.org validator API
- Google Rich Results Test API
- Custom validation rules

### Schema Templates
Pre-built templates for:
- Restaurants
- Professional services
- E-commerce
- Blogs and content sites
- Events
- Real estate

---

## Resources

**Official Documentation:**
- Schema.org Homepage: https://schema.org
- Getting Started: https://schema.org/docs/gs.html
- Full Schema List: https://schema.org/docs/full.html
- Extensions: https://schema.org/docs/extension.html

**Tools:**
- Schema.org Validator: https://validator.schema.org
- Google Rich Results Test: https://search.google.com/test/rich-results
- Google Search Console: https://search.google.com/search-console
- Schema Markup Generator: https://technicalseo.com/tools/schema-markup-generator/

**Community:**
- W3C Community Group: https://www.w3.org/community/schemaorg/
- GitHub Issues: https://github.com/schemaorg/schemaorg/issues
- Stack Overflow: [schema.org] tag

**Best Practices:**
- Google Search Central: https://developers.google.com/search/docs/appearance/structured-data
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/marking-up-your-site-with-structured-data
- Yandex Structured Data: https://yandex.com/support/webmaster/schema-org/

---

## Quick Reference Cheat Sheet

### Most Common Properties

**All Types:**
- `@context` - Always "https://schema.org"
- `@type` - Schema type (Product, Article, etc.)
- `name` - Name or title
- `description` - Description
- `image` - Image URL
- `url` - Canonical URL

**Organizations:**
- `address` - PostalAddress object
- `telephone` - Phone number
- `email` - Contact email
- `logo` - Logo image URL
- `sameAs` - Social media URLs array

**Products:**
- `brand` - Brand name
- `sku` - Stock keeping unit
- `offers` - Offer object with price
- `aggregateRating` - Rating object
- `review` - Review array

**Articles:**
- `headline` - Article headline
- `author` - Person or Organization
- `publisher` - Organization object
- `datePublished` - ISO 8601 date
- `dateModified` - ISO 8601 date
- `articleBody` - Full article text

**Events:**
- `startDate` - ISO 8601 datetime
- `endDate` - ISO 8601 datetime
- `location` - Place object
- `eventStatus` - EventScheduled/EventCancelled/etc
- `performer` - Person or Organization

This reference guide provides comprehensive coverage of Schema.org for SEO optimization in the GEO SEO Domination Tool.
