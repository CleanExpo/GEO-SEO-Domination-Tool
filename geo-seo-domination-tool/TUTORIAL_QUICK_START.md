# Tutorial System - Quick Start Guide

## Setup (One-time)

### 1. Seed Sample Tutorials
```bash
cd D:\GEO_SEO_Domination-Tool\geo-seo-domination-tool
npm run db:seed:tutorials
```

This adds 5 sample tutorials to your database.

## How It Works

### For Users

1. **View Tutorials**
   - Navigate to `/resources/tutorials` in the web app
   - See all available tutorials with stats

2. **Start Learning**
   - Click "Start Tutorial" on any tutorial card
   - Modal opens with full content
   - Read content, watch videos (if available)
   - View additional resources

3. **Track Progress**
   - Click "Mark as Complete" when finished
   - Progress saved automatically in browser
   - Stats update immediately
   - Progress persists across page refreshes

4. **Navigate Tutorials**
   - Use "Previous" and "Next" buttons in modal
   - Jump between tutorials without closing modal
   - Filter by difficulty or search

### For Developers

#### Add New Tutorial (API)
```javascript
const response = await fetch('/api/resources/tutorials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Tutorial',
    description: 'Short description',
    content: '<h2>Tutorial content</h2><p>HTML formatted content...</p>',
    category: 'SEO',
    difficulty: 'beginner', // or 'intermediate', 'advanced'
    duration: 30, // minutes
    tags: ['seo', 'basics'],
    video_url: 'https://youtube.com/embed/...',
    resources: ['Resource 1', 'Resource 2']
  })
});
```

#### Get All Tutorials
```javascript
const response = await fetch('/api/resources/tutorials');
const { tutorials } = await response.json();
```

#### Update Tutorial
```javascript
const response = await fetch('/api/resources/tutorials/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    views: 100,
    favorite: true
  })
});
```

## Key Files

- **Page:** `web-app/app/resources/tutorials/page.tsx`
- **API:** `web-app/app/api/resources/tutorials/route.ts`
- **Seed:** `scripts/seed-tutorials.js`
- **Schema:** `database/resources-schema.sql`

## Features

- [x] Tutorial browsing and filtering
- [x] Full-screen tutorial viewer modal
- [x] Progress tracking (localStorage)
- [x] Next/Previous navigation
- [x] Video embedding support
- [x] Additional resources display
- [x] Tag-based organization
- [x] Search functionality
- [x] Difficulty filtering
- [x] Statistics dashboard
- [x] View count tracking

## Sample Tutorials Included

1. **SEO Fundamentals** (30 min, Beginner)
2. **Local SEO Strategy** (45 min, Intermediate)
3. **Advanced Technical SEO** (60 min, Advanced)
4. **Content Marketing & SEO** (50 min, Intermediate)
5. **Link Building Strategies** (55 min, Advanced)

## Troubleshooting

### Tutorials not showing?
```bash
# Verify database has data
npm run db:seed:tutorials
```

### Progress not saving?
- Check browser localStorage is enabled
- Try different browser
- Clear cache and reload

### Modal not opening?
- Check browser console for errors
- Verify JavaScript is enabled
- Check if onClick handler exists on button

## Documentation

- **Full Documentation:** `TUTORIAL_SYSTEM.md`
- **Fix Summary:** `TUTORIAL_FIX_SUMMARY.md`
- **Quick Start:** `TUTORIAL_QUICK_START.md` (this file)

## Support

Check the comprehensive documentation in `TUTORIAL_SYSTEM.md` for:
- API endpoint details
- Database schema
- Customization options
- Security considerations
- Future enhancements
