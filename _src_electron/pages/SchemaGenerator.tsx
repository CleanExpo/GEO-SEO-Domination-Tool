import { useState } from 'react'
import { schemaOrgService } from '../services/schema-org'
import type {
  LocalBusinessSchema,
  ProductSchema,
  ArticleSchema,
  EventSchema,
  FAQSchema,
  RecipeSchema,
  BreadcrumbSchema,
} from '../services/schema-org'

type SchemaType =
  | 'LocalBusiness'
  | 'Product'
  | 'Article'
  | 'Event'
  | 'FAQ'
  | 'Recipe'
  | 'Breadcrumb'
  | 'Organization'
  | 'Person'

export default function SchemaGenerator() {
  const [selectedType, setSelectedType] = useState<SchemaType>('LocalBusiness')
  const [generatedSchema, setGeneratedSchema] = useState<string>('')
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)

  const schemaTypes = [
    { id: 'LocalBusiness', name: 'Local Business', icon: '🏪', description: 'Restaurant, store, service business' },
    { id: 'Product', name: 'Product', icon: '📦', description: 'E-commerce products with pricing' },
    { id: 'Article', name: 'Article', icon: '📝', description: 'Blog posts, news articles' },
    { id: 'Event', name: 'Event', icon: '📅', description: 'Conferences, concerts, webinars' },
    { id: 'FAQ', name: 'FAQ Page', icon: '❓', description: 'Frequently asked questions' },
    { id: 'Recipe', name: 'Recipe', icon: '👨‍🍳', description: 'Cooking recipes with ingredients' },
    { id: 'Breadcrumb', name: 'Breadcrumb', icon: '🔗', description: 'Site navigation breadcrumbs' },
    { id: 'Organization', name: 'Organization', icon: '🏢', description: 'Company or organization' },
    { id: 'Person', name: 'Person', icon: '👤', description: 'Individual person profile' },
  ]

  const generateDemoSchema = () => {
    let schema = ''

    switch (selectedType) {
      case 'LocalBusiness':
        const businessData: LocalBusinessSchema = {
          name: "Mike's Coffee Shop",
          type: 'Restaurant',
          address: {
            street: '123 Main Street',
            city: 'Portland',
            state: 'OR',
            zip: '97205',
            country: 'US',
          },
          geo: {
            latitude: 45.5152,
            longitude: -122.6784,
          },
          phone: '+1-555-123-4567',
          email: 'contact@mikescoffee.com',
          url: 'https://mikescoffee.com',
          description: 'Artisan coffee shop with locally roasted beans',
          priceRange: '$$',
          openingHours: [
            {
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '08:00',
              closes: '17:00',
            },
          ],
          rating: {
            value: 4.7,
            count: 189,
          },
        }
        schema = schemaOrgService.generateLocalBusiness(businessData)
        break

      case 'Product':
        const productData: ProductSchema = {
          name: 'Wireless Headphones',
          description: 'Premium noise-canceling wireless headphones',
          image: 'https://example.com/headphones.jpg',
          sku: 'WH-1000XM5',
          brand: 'SoundPro',
          price: 299.99,
          currency: 'USD',
          availability: 'InStock',
          condition: 'NewCondition',
          rating: {
            value: 4.8,
            count: 452,
          },
          reviews: [
            {
              author: 'Sarah Johnson',
              rating: 5,
              text: 'Amazing sound quality and comfortable to wear all day!',
              date: '2025-01-15',
            },
          ],
        }
        schema = schemaOrgService.generateProduct(productData)
        break

      case 'Article':
        const articleData: ArticleSchema = {
          headline: '10 SEO Tips for 2025',
          description: 'Learn the latest SEO strategies to boost your rankings',
          image: 'https://example.com/seo-tips.jpg',
          author: {
            name: 'Jane Developer',
            url: 'https://example.com/author/jane',
          },
          publisher: {
            name: 'SEO Experts Blog',
            logo: 'https://example.com/logo.png',
          },
          datePublished: '2025-01-15',
          dateModified: '2025-01-20',
          url: 'https://example.com/seo-tips',
          articleSection: 'SEO',
          wordCount: 1500,
          keywords: ['SEO', 'search optimization', '2025'],
        }
        schema = schemaOrgService.generateArticle(articleData)
        break

      case 'Event':
        const eventData: EventSchema = {
          name: 'Web Development Conference 2025',
          description: 'Annual web development conference',
          startDate: '2025-03-15T09:00',
          endDate: '2025-03-17T18:00',
          location: {
            name: 'Convention Center',
            address: {
              street: '123 Conference Blvd',
              city: 'San Francisco',
              state: 'CA',
              zip: '94102',
              country: 'US',
            },
          },
          image: 'https://example.com/event.jpg',
          offers: {
            price: 299,
            currency: 'USD',
            url: 'https://example.com/tickets',
            availability: 'https://schema.org/InStock',
          },
          performer: {
            name: 'Jane Developer',
            type: 'Person',
          },
          organizer: {
            name: 'Web Dev Alliance',
            url: 'https://webdevalliance.org',
          },
        }
        schema = schemaOrgService.generateEvent(eventData)
        break

      case 'FAQ':
        const faqData: FAQSchema = {
          questions: [
            {
              question: 'What is Schema.org?',
              answer:
                'Schema.org is a collaborative project to create and promote structured data schemas for the web.',
            },
            {
              question: 'Why should I use Schema markup?',
              answer:
                'Schema markup helps search engines understand your content better, leading to rich snippets and better visibility.',
            },
            {
              question: 'Which format is recommended?',
              answer: 'JSON-LD is the recommended format by Google as it is easy to implement and maintain.',
            },
          ],
        }
        schema = schemaOrgService.generateFAQ(faqData)
        break

      case 'Recipe':
        const recipeData: RecipeSchema = {
          name: 'Chocolate Chip Cookies',
          description: 'Classic homemade chocolate chip cookies',
          image: 'https://example.com/cookies.jpg',
          author: {
            name: 'Chef Sarah',
          },
          datePublished: '2025-01-20',
          prepTime: 'PT15M',
          cookTime: 'PT10M',
          totalTime: 'PT25M',
          recipeYield: '24 cookies',
          recipeCategory: 'Dessert',
          recipeCuisine: 'American',
          keywords: ['chocolate chip', 'cookies', 'dessert'],
          ingredients: [
            '2 1/4 cups all-purpose flour',
            '1 cup butter, softened',
            '3/4 cup sugar',
            '2 eggs',
            '2 cups chocolate chips',
          ],
          instructions: [
            'Preheat oven to 375°F',
            'Mix butter and sugar until fluffy',
            'Add eggs and mix well',
            'Stir in flour and chocolate chips',
            'Drop spoonfuls onto baking sheet',
            'Bake for 10 minutes',
          ],
          nutrition: {
            calories: '150 calories',
            fatContent: '8g',
            carbohydrateContent: '20g',
          },
          rating: {
            value: 4.8,
            count: 342,
          },
        }
        schema = schemaOrgService.generateRecipe(recipeData)
        break

      case 'Breadcrumb':
        const breadcrumbData: BreadcrumbSchema = {
          items: [
            { name: 'Home', url: 'https://example.com' },
            { name: 'Products', url: 'https://example.com/products' },
            { name: 'Electronics', url: 'https://example.com/products/electronics' },
            { name: 'Headphones', url: 'https://example.com/products/electronics/headphones' },
          ],
        }
        schema = schemaOrgService.generateBreadcrumb(breadcrumbData)
        break

      case 'Organization':
        schema = schemaOrgService.generateOrganization({
          name: 'ACME Corporation',
          url: 'https://acme.com',
          logo: 'https://acme.com/logo.png',
          description: 'Leading provider of innovative solutions',
          sameAs: [
            'https://twitter.com/acmecorp',
            'https://linkedin.com/company/acme',
            'https://facebook.com/acme',
          ],
          contactPoint: {
            telephone: '+1-555-999-8888',
            contactType: 'Customer Service',
            areaServed: 'US',
            availableLanguage: ['English', 'Spanish'],
          },
        })
        break

      case 'Person':
        schema = schemaOrgService.generatePerson({
          name: 'Jane Doe',
          jobTitle: 'Senior Software Engineer',
          image: 'https://example.com/jane.jpg',
          url: 'https://janedoe.dev',
          sameAs: ['https://twitter.com/janedoe', 'https://linkedin.com/in/janedoe', 'https://github.com/janedoe'],
          worksFor: {
            name: 'Tech Corp',
            url: 'https://techcorp.com',
          },
          email: 'jane@example.com',
          telephone: '+1-555-987-6543',
        })
        break
    }

    setGeneratedSchema(schema)
    setValidationResult(null)
  }

  const validateGeneratedSchema = async () => {
    if (!generatedSchema) return

    // Extract JSON from script tag
    const match = generatedSchema.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    if (match) {
      const result = await schemaOrgService.validateSchema(match[1])
      setValidationResult(result)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSchema)
    alert('Schema copied to clipboard!')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Schema.org Generator</h1>
        <p className="text-muted-foreground">
          Generate structured data markup for enhanced SEO and rich search results
        </p>
      </div>

      {/* Schema Type Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Schema Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schemaTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id as SchemaType)
                setGeneratedSchema('')
                setValidationResult(null)
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedType === type.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-semibold mb-1">{type.name}</div>
              <div className="text-sm text-muted-foreground">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-8">
        <button
          onClick={generateDemoSchema}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90"
        >
          Generate Demo {selectedType} Schema
        </button>
        <p className="text-sm text-muted-foreground mt-2">
          This will generate example schema markup that you can customize for your needs
        </p>
      </div>

      {/* Generated Schema Output */}
      {generatedSchema && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Generated Schema</h2>
            <div className="flex gap-2">
              <button
                onClick={validateGeneratedSchema}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
              >
                Validate
              </button>
              <button
                onClick={copyToClipboard}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre>{generatedSchema}</pre>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className={`mt-4 p-4 rounded-lg ${validationResult.valid ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">
                {validationResult.valid ? '✅ Valid Schema' : '❌ Invalid Schema'}
              </h3>
              {validationResult.errors.length > 0 && (
                <div className="mb-2">
                  <div className="font-semibold text-red-600">Errors:</div>
                  <ul className="list-disc list-inside">
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx} className="text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {validationResult.warnings.length > 0 && (
                <div>
                  <div className="font-semibold text-yellow-600">Warnings:</div>
                  <ul className="list-disc list-inside">
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx} className="text-yellow-700">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Implementation Guide */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📚 Implementation Guide</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Copy the generated schema</h3>
            <p className="text-sm text-muted-foreground">
              Click "Copy to Clipboard" to copy the complete schema markup
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Add to your HTML</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Paste the schema in the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of your page:
            </p>
            <div className="bg-muted rounded p-3 text-sm font-mono">
              &lt;head&gt;
              <br />
              &nbsp;&nbsp;{/* Your schema here */}
              <br />
              &lt;/head&gt;
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Customize the data</h3>
            <p className="text-sm text-muted-foreground">
              Replace the example values with your actual business/product/content information
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. Validate your schema</h3>
            <p className="text-sm text-muted-foreground mb-2">Test your schema using:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>
                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Rich Results Test
                </a>
              </li>
              <li>
                <a
                  href="https://validator.schema.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Schema.org Validator
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. Monitor in Search Console</h3>
            <p className="text-sm text-muted-foreground">
              Track rich result performance in Google Search Console under "Enhancements"
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold mb-2">📖 Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <a
              href="/SCHEMA_ORG_REFERENCE.md"
              className="text-primary hover:underline"
            >
              → Schema.org Reference Guide
            </a>
            <a
              href="https://schema.org/docs/gs.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              → Schema.org Getting Started
            </a>
            <a
              href="https://developers.google.com/search/docs/appearance/structured-data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              → Google Structured Data Guide
            </a>
            <a
              href="https://schema.org/docs/full.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              → Full Schema List
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
