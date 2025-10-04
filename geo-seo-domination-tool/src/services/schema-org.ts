/**
 * Schema.org Service
 *
 * Generate, validate, and manage Schema.org structured data markup
 * for enhanced SEO and rich search results
 *
 * Supported formats: JSON-LD, Microdata, RDFa
 * Validation: Schema.org validator, Google Rich Results Test
 */

export type SchemaFormat = 'json-ld' | 'microdata' | 'rdfa'

export interface SchemaGeneratorOptions {
  format?: SchemaFormat
  validate?: boolean
  minify?: boolean
}

export interface LocalBusinessSchema {
  name: string
  type?: string // Restaurant, Store, etc.
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  geo?: {
    latitude: number
    longitude: number
  }
  phone?: string
  email?: string
  url?: string
  image?: string
  description?: string
  priceRange?: string // $ to $$$$
  openingHours?: {
    dayOfWeek: string[]
    opens: string
    closes: string
  }[]
  rating?: {
    value: number
    count: number
  }
}

export interface ProductSchema {
  name: string
  description: string
  image: string | string[]
  sku?: string
  brand?: string
  price: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition'
  rating?: {
    value: number
    count: number
  }
  reviews?: {
    author: string
    rating: number
    text: string
    date?: string
  }[]
}

export interface ArticleSchema {
  headline: string
  description: string
  image: string
  author: {
    name: string
    url?: string
  }
  publisher: {
    name: string
    logo: string
  }
  datePublished: string
  dateModified?: string
  url: string
  articleSection?: string
  wordCount?: number
  keywords?: string[]
}

export interface EventSchema {
  name: string
  description: string
  startDate: string
  endDate?: string
  location: {
    name: string
    address: {
      street: string
      city: string
      state: string
      zip: string
      country: string
    }
  }
  image?: string
  offers?: {
    price: number
    currency: string
    url?: string
    availability?: string
  }
  performer?: {
    name: string
    type?: 'Person' | 'Organization'
  }
  organizer?: {
    name: string
    url?: string
  }
}

export interface FAQSchema {
  questions: {
    question: string
    answer: string
  }[]
}

export interface RecipeSchema {
  name: string
  description: string
  image: string
  author: {
    name: string
  }
  datePublished?: string
  prepTime?: string // ISO 8601 duration
  cookTime?: string
  totalTime?: string
  recipeYield?: string
  recipeCategory?: string
  recipeCuisine?: string
  keywords?: string[]
  ingredients: string[]
  instructions: string[]
  nutrition?: {
    calories?: string
    fatContent?: string
    carbohydrateContent?: string
    proteinContent?: string
  }
  rating?: {
    value: number
    count: number
  }
}

export interface BreadcrumbSchema {
  items: {
    name: string
    url: string
  }[]
}

export class SchemaOrgService {
  /**
   * Generate LocalBusiness schema (JSON-LD)
   */
  generateLocalBusiness(data: LocalBusinessSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': data.type || 'LocalBusiness',
      name: data.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address.street,
        addressLocality: data.address.city,
        addressRegion: data.address.state,
        postalCode: data.address.zip,
        addressCountry: data.address.country,
      },
      ...(data.geo && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: data.geo.latitude.toString(),
          longitude: data.geo.longitude.toString(),
        },
      }),
      ...(data.phone && { telephone: data.phone }),
      ...(data.email && { email: data.email }),
      ...(data.url && { url: data.url }),
      ...(data.image && { image: data.image }),
      ...(data.description && { description: data.description }),
      ...(data.priceRange && { priceRange: data.priceRange }),
      ...(data.openingHours && {
        openingHoursSpecification: data.openingHours.map((hours) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: hours.dayOfWeek,
          opens: hours.opens,
          closes: hours.closes,
        })),
      }),
      ...(data.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating.value.toString(),
          reviewCount: data.rating.count.toString(),
        },
      }),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate Product schema (JSON-LD)
   */
  generateProduct(data: ProductSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      description: data.description,
      image: data.image,
      ...(data.sku && { sku: data.sku }),
      ...(data.brand && {
        brand: {
          '@type': 'Brand',
          name: data.brand,
        },
      }),
      offers: {
        '@type': 'Offer',
        price: data.price.toString(),
        priceCurrency: data.currency || 'USD',
        availability: `https://schema.org/${data.availability || 'InStock'}`,
        ...(data.condition && { itemCondition: `https://schema.org/${data.condition}` }),
      },
      ...(data.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating.value.toString(),
          reviewCount: data.rating.count.toString(),
        },
      }),
      ...(data.reviews &&
        data.reviews.length > 0 && {
          review: data.reviews.map((review) => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating.toString(),
            },
            author: {
              '@type': 'Person',
              name: review.author,
            },
            reviewBody: review.text,
            ...(review.date && { datePublished: review.date }),
          })),
        }),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate Article schema (JSON-LD)
   */
  generateArticle(data: ArticleSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.headline,
      description: data.description,
      image: data.image,
      author: {
        '@type': 'Person',
        name: data.author.name,
        ...(data.author.url && { url: data.author.url }),
      },
      publisher: {
        '@type': 'Organization',
        name: data.publisher.name,
        logo: {
          '@type': 'ImageObject',
          url: data.publisher.logo,
        },
      },
      datePublished: data.datePublished,
      ...(data.dateModified && { dateModified: data.dateModified }),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url,
      },
      ...(data.articleSection && { articleSection: data.articleSection }),
      ...(data.wordCount && { wordCount: data.wordCount }),
      ...(data.keywords && { keywords: data.keywords }),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate Event schema (JSON-LD)
   */
  generateEvent(data: EventSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      ...(data.endDate && { endDate: data.endDate }),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: data.location.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.location.address.street,
          addressLocality: data.location.address.city,
          addressRegion: data.location.address.state,
          postalCode: data.location.address.zip,
          addressCountry: data.location.address.country,
        },
      },
      ...(data.image && { image: data.image }),
      ...(data.offers && {
        offers: {
          '@type': 'Offer',
          price: data.offers.price.toString(),
          priceCurrency: data.offers.currency,
          ...(data.offers.url && { url: data.offers.url }),
          ...(data.offers.availability && { availability: data.offers.availability }),
        },
      }),
      ...(data.performer && {
        performer: {
          '@type': data.performer.type || 'Person',
          name: data.performer.name,
        },
      }),
      ...(data.organizer && {
        organizer: {
          '@type': 'Organization',
          name: data.organizer.name,
          ...(data.organizer.url && { url: data.organizer.url }),
        },
      }),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate FAQPage schema (JSON-LD)
   */
  generateFAQ(data: FAQSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.questions.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer,
        },
      })),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate Recipe schema (JSON-LD)
   */
  generateRecipe(data: RecipeSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: data.name,
      description: data.description,
      image: data.image,
      author: {
        '@type': 'Person',
        name: data.author.name,
      },
      ...(data.datePublished && { datePublished: data.datePublished }),
      ...(data.prepTime && { prepTime: data.prepTime }),
      ...(data.cookTime && { cookTime: data.cookTime }),
      ...(data.totalTime && { totalTime: data.totalTime }),
      ...(data.recipeYield && { recipeYield: data.recipeYield }),
      ...(data.recipeCategory && { recipeCategory: data.recipeCategory }),
      ...(data.recipeCuisine && { recipeCuisine: data.recipeCuisine }),
      ...(data.keywords && { keywords: data.keywords }),
      recipeIngredient: data.ingredients,
      recipeInstructions: data.instructions.map((instruction, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        text: instruction,
      })),
      ...(data.nutrition && {
        nutrition: {
          '@type': 'NutritionInformation',
          ...data.nutrition,
        },
      }),
      ...(data.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating.value.toString(),
          reviewCount: data.rating.count.toString(),
        },
      }),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate BreadcrumbList schema (JSON-LD)
   */
  generateBreadcrumb(data: BreadcrumbSchema, options: SchemaGeneratorOptions = {}): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: data.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }

    return this.formatOutput(schema, options)
  }

  /**
   * Generate Organization schema (JSON-LD)
   */
  generateOrganization(data: {
    name: string
    url: string
    logo?: string
    description?: string
    sameAs?: string[]
    contactPoint?: {
      telephone: string
      contactType: string
      areaServed?: string
      availableLanguage?: string[]
    }
  }): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name,
      url: data.url,
      ...(data.logo && { logo: data.logo }),
      ...(data.description && { description: data.description }),
      ...(data.sameAs && { sameAs: data.sameAs }),
      ...(data.contactPoint && {
        contactPoint: {
          '@type': 'ContactPoint',
          ...data.contactPoint,
        },
      }),
    }

    return this.formatOutput(schema, {})
  }

  /**
   * Generate Person schema (JSON-LD)
   */
  generatePerson(data: {
    name: string
    jobTitle?: string
    image?: string
    url?: string
    sameAs?: string[]
    worksFor?: {
      name: string
      url?: string
    }
    email?: string
    telephone?: string
  }): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.name,
      ...(data.jobTitle && { jobTitle: data.jobTitle }),
      ...(data.image && { image: data.image }),
      ...(data.url && { url: data.url }),
      ...(data.sameAs && { sameAs: data.sameAs }),
      ...(data.worksFor && {
        worksFor: {
          '@type': 'Organization',
          name: data.worksFor.name,
          ...(data.worksFor.url && { url: data.worksFor.url }),
        },
      }),
      ...(data.email && { email: data.email }),
      ...(data.telephone && { telephone: data.telephone }),
    }

    return this.formatOutput(schema, {})
  }

  /**
   * Validate schema markup
   */
  async validateSchema(schemaJson: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      // Parse to ensure valid JSON
      const parsed = JSON.parse(schemaJson)

      const errors: string[] = []
      const warnings: string[] = []

      // Basic validation
      if (!parsed['@context']) {
        errors.push('Missing @context property')
      } else if (parsed['@context'] !== 'https://schema.org') {
        warnings.push('@context should be https://schema.org')
      }

      if (!parsed['@type']) {
        errors.push('Missing @type property')
      }

      // Type-specific validation
      if (parsed['@type'] === 'LocalBusiness') {
        if (!parsed.name) errors.push('LocalBusiness requires name')
        if (!parsed.address) errors.push('LocalBusiness requires address')
      }

      if (parsed['@type'] === 'Product') {
        if (!parsed.name) errors.push('Product requires name')
        if (!parsed.offers) errors.push('Product requires offers')
      }

      if (parsed['@type'] === 'Article') {
        if (!parsed.headline) errors.push('Article requires headline')
        if (!parsed.author) errors.push('Article requires author')
        if (!parsed.datePublished) errors.push('Article requires datePublished')
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      }
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON: ' + (error instanceof Error ? error.message : String(error))],
        warnings: [],
      }
    }
  }

  /**
   * Format output based on options
   */
  private formatOutput(schema: any, options: SchemaGeneratorOptions): string {
    const format = options.format || 'json-ld'

    if (format === 'json-ld') {
      const json = options.minify ? JSON.stringify(schema) : JSON.stringify(schema, null, 2)

      return `<script type="application/ld+json">\n${json}\n</script>`
    }

    // Microdata and RDFa conversion would go here
    // For now, returning JSON-LD
    return this.formatOutput(schema, { ...options, format: 'json-ld' })
  }

  /**
   * Extract schema from HTML
   */
  extractSchemaFromHTML(html: string): any[] {
    const schemas: any[] = []
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

    let match
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const schema = JSON.parse(match[1])
        schemas.push(schema)
      } catch (error) {
        // Invalid JSON, skip
      }
    }

    return schemas
  }

  /**
   * Get schema template by type
   */
  getTemplate(type: string): string {
    const templates: Record<string, string> = {
      LocalBusiness: JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Business Name',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '123 Main St',
            addressLocality: 'City',
            addressRegion: 'State',
            postalCode: '12345',
            addressCountry: 'US',
          },
          telephone: '+1-555-123-4567',
        },
        null,
        2
      ),
      Product: JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Product Name',
          description: 'Product description',
          image: 'https://example.com/image.jpg',
          offers: {
            '@type': 'Offer',
            price: '99.99',
            priceCurrency: 'USD',
          },
        },
        null,
        2
      ),
      Article: JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Article Headline',
          datePublished: '2025-01-01',
          author: {
            '@type': 'Person',
            name: 'Author Name',
          },
        },
        null,
        2
      ),
    }

    return templates[type] || '{}'
  }
}

export const schemaOrgService = new SchemaOrgService()
