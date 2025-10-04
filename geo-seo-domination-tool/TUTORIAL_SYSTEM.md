# Tutorial System Documentation

## Overview

The Tutorial System provides an interactive learning platform for SEO best practices, strategies, and techniques. Users can browse, view, and track their progress through various tutorials.

## Features

### 1. Tutorial Library
- Browse all available tutorials with filtering and search
- Filter by difficulty level (Beginner, Intermediate, Advanced)
- Search by title or description
- View tutorial metadata (duration, category, tags)

### 2. Interactive Tutorial Viewer
- Full-screen modal for immersive learning
- Rich content display with HTML formatting
- Video tutorial embedding support
- Additional resource links
- Tag-based organization

### 3. Progress Tracking
- LocalStorage-based progress tracking
- Track completion percentage per tutorial
- View in-progress and completed tutorials
- Statistics dashboard showing:
  - Total tutorials
  - In-progress tutorials
  - Completed tutorials
  - Available categories

### 4. Navigation
- Next/Previous tutorial navigation
- Quick access to related tutorials
- Mark tutorials as complete
- Review completed tutorials

## File Structure

```
web-app/
├── app/
│   ├── resources/
│   │   └── tutorials/
│   │       └── page.tsx          # Main tutorial page with viewer
│   └── api/
│       └── resources/
│           └── tutorials/
│               ├── route.ts       # GET all, POST new tutorial
│               └── [id]/
│                   └── route.ts   # GET, PUT, DELETE single tutorial
├── scripts/
│   └── seed-tutorials.js          # Sample tutorial seeding script
└── database/
    └── resources-schema.sql       # Database schema
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS crm_tutorials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,              -- HTML content
  category TEXT,                      -- 'seo', 'development', 'marketing', etc.
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  duration INTEGER,                   -- Duration in minutes
  tags TEXT,                          -- JSON array stored as text
  video_url TEXT,                     -- Optional video embed URL
  resources TEXT,                     -- JSON array of resource links
  favorite BOOLEAN DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /api/resources/tutorials
Fetch all tutorials with optional filtering.

**Query Parameters:**
- `category` - Filter by category
- `difficulty` - Filter by difficulty level
- `favorite` - Filter favorites (true/false)

**Response:**
```json
{
  "tutorials": [
    {
      "id": "1",
      "title": "SEO Fundamentals",
      "description": "Learn the basics...",
      "content": "<h2>Introduction</h2>...",
      "category": "SEO",
      "difficulty": "beginner",
      "duration": 30,
      "tags": ["seo", "basics"],
      "resources": ["link1", "link2"],
      "favorite": false,
      "views": 10,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/resources/tutorials/[id]
Fetch a single tutorial by ID.

**Response:**
```json
{
  "tutorial": {
    "id": "1",
    "title": "SEO Fundamentals",
    // ... full tutorial data
  }
}
```

### POST /api/resources/tutorials
Create a new tutorial.

**Request Body:**
```json
{
  "title": "My Tutorial",
  "description": "Tutorial description",
  "content": "<h2>Content</h2>",
  "category": "SEO",
  "difficulty": "beginner",
  "duration": 30,
  "tags": ["tag1", "tag2"],
  "video_url": "https://youtube.com/...",
  "resources": ["resource1", "resource2"]
}
```

### PUT /api/resources/tutorials/[id]
Update an existing tutorial.

**Request Body:** Same as POST (all fields optional)

### DELETE /api/resources/tutorials/[id]
Delete a tutorial.

## Usage

### Seeding Sample Tutorials

To populate the database with sample tutorials:

```bash
npm run db:seed:tutorials
```

This will add 5 comprehensive tutorials covering:
1. SEO Fundamentals for Beginners
2. Local SEO Strategy
3. Advanced Technical SEO
4. Content Marketing & SEO
5. Link Building Strategies

### Viewing Tutorials

1. Navigate to `/resources/tutorials` in the web app
2. Browse available tutorials
3. Click "Start Tutorial", "Continue", or "Review" on any tutorial card
4. The tutorial viewer modal will open

### Tutorial Viewer Features

**Header:**
- Tutorial title
- Difficulty badge
- Category
- Duration
- Close button

**Content Area:**
- Overview/Description
- Video (if available)
- Main tutorial content (formatted HTML)
- Additional resources list
- Tags

**Footer:**
- Progress bar showing completion percentage
- Previous tutorial button
- Mark as Complete button
- Next tutorial button

### Progress Tracking

Progress is stored in browser localStorage:

```javascript
{
  "tutorial-progress": {
    "1": {
      "completionRate": 100,
      "lastAccessed": "2025-01-15T10:30:00Z"
    },
    "2": {
      "completionRate": 50,
      "lastAccessed": "2025-01-16T14:20:00Z"
    }
  }
}
```

## Creating New Tutorials

### Via API

Use the POST endpoint to programmatically create tutorials:

```javascript
const response = await fetch('/api/resources/tutorials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Advanced Schema Markup',
    description: 'Master structured data for rich snippets',
    content: '<h2>Introduction to Schema</h2><p>Schema markup...</p>',
    category: 'Technical SEO',
    difficulty: 'advanced',
    duration: 45,
    tags: ['schema', 'structured-data', 'rich-snippets'],
    resources: [
      'Schema.org Documentation',
      'Google Rich Results Test'
    ]
  })
});
```

### Content Formatting

Tutorial content supports HTML formatting:

```html
<h2>Section Title</h2>
<p>Paragraph text</p>

<h3>Subsection</h3>
<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>

<ol>
  <li>Numbered step 1</li>
  <li>Numbered step 2</li>
</ol>

<strong>Bold text</strong>
<em>Italic text</em>
```

## Customization

### Adding New Categories

Categories are dynamic based on tutorial data. To add a new category, simply create tutorials with the new category name.

### Styling

The tutorial viewer uses Tailwind CSS classes. To customize:

1. Edit `web-app/app/resources/tutorials/page.tsx`
2. Modify the modal styles in the Tutorial Viewer section
3. Update color schemes using Tailwind utility classes

### Progress Tracking Logic

To modify how progress is tracked:

1. Update `saveProgress()` function in `page.tsx`
2. Modify localStorage structure if needed
3. Update stats calculation in the dashboard section

## Best Practices

### Content Creation

1. **Clear Structure:** Use headings (H2, H3) to organize content
2. **Actionable Steps:** Provide specific, actionable guidance
3. **Visual Aids:** Include video URLs when available
4. **Resources:** Link to additional learning materials
5. **Length:** Keep tutorials focused (30-60 minutes)

### SEO for Tutorials

1. **Descriptive Titles:** Clear, keyword-rich titles
2. **Meta Descriptions:** Compelling descriptions
3. **Tags:** Use relevant, searchable tags
4. **Categories:** Assign appropriate categories

### User Experience

1. **Progressive Difficulty:** Start with beginner content
2. **Related Tutorials:** Use tags to connect related content
3. **Update Regularly:** Keep content current
4. **Track Metrics:** Monitor view counts and completion rates

## Troubleshooting

### Tutorials Not Loading

1. Check API connection: `/api/resources/tutorials`
2. Verify database table exists: `crm_tutorials`
3. Check browser console for errors
4. Ensure Supabase credentials are correct

### Progress Not Saving

1. Check localStorage is enabled in browser
2. Verify localStorage key: `tutorial-progress`
3. Check browser privacy settings
4. Clear cache and reload

### Video Not Displaying

1. Verify video URL is embeddable
2. Check CORS settings for video host
3. Ensure URL format is correct (YouTube embed format)
4. Test URL in browser directly

## Future Enhancements

Potential improvements to consider:

1. **User Accounts:** Sync progress across devices
2. **Quizzes:** Add knowledge checks
3. **Certificates:** Award completion certificates
4. **Comments:** Allow user discussions
5. **Ratings:** Let users rate tutorials
6. **Bookmarks:** Save specific tutorial sections
7. **Notes:** Allow users to take notes
8. **Export:** Download tutorials as PDF
9. **Sharing:** Share progress on social media
10. **Recommendations:** AI-powered tutorial suggestions

## Support

For issues or questions:
1. Check this documentation
2. Review the API endpoint responses
3. Check browser console for errors
4. Verify database schema matches documentation
