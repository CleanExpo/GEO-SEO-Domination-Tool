-- Marketing Psychology Knowledge Base Schema
-- Stores high-value content frameworks, facts, statistics, and psychological triggers

CREATE TABLE IF NOT EXISTS content_frameworks (
  id TEXT PRIMARY KEY DEFAULT ('cf_' || lower(hex(randomblob(8)))),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK(category IN (
    'attention_capture', 'engagement', 'conversion', 'retention',
    'viral_sharing', 'trust_building', 'urgency_scarcity'
  )),
  description TEXT NOT NULL,
  template TEXT NOT NULL, -- Template with variables like {{topic}}, {{stat}}, {{benefit}}
  psychological_principle TEXT NOT NULL, -- FOMO, Social Proof, Authority, Scarcity, etc.
  optimal_platforms TEXT NOT NULL, -- JSON array: ["facebook", "linkedin", "blog"]
  engagement_multiplier REAL DEFAULT 1.0, -- Historical performance metric
  examples TEXT, -- JSON array of successful examples
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- High-Value Content Patterns
INSERT OR IGNORE INTO content_frameworks (name, category, description, template, psychological_principle, optimal_platforms) VALUES
('Top N List', 'attention_capture', 'Numbered lists create structure and set expectations', 'Top {{number}} {{topic}} That Will {{benefit}}', 'Curiosity Gap', '["blog", "linkedin", "twitter"]'),
('Did You Know', 'engagement', 'Surprising facts capture attention and encourage sharing', 'Did You Know: {{surprising_fact}} About {{topic}}? Here''s Why It Matters...', 'Novelty Bias', '["facebook", "instagram", "linkedin"]'),
('How-To Guide', 'conversion', 'Educational content builds authority and trust', 'How to {{achieve_goal}} in {{timeframe}} ({{benefit}})', 'Value Exchange', '["blog", "youtube", "linkedin"]'),
('Before/After', 'trust_building', 'Social proof through transformation stories', '{{client_type}} Went From {{problem}} to {{solution}} in {{timeframe}}', 'Social Proof', '["facebook", "instagram", "case_study"]'),
('Myth Busting', 'engagement', 'Correcting misconceptions positions you as expert', '{{number}} Myths About {{topic}} That Are Costing You {{loss}}', 'Cognitive Dissonance', '["linkedin", "blog", "youtube"]'),
('The Ultimate Guide', 'conversion', 'Comprehensive resources establish authority', 'The Ultimate {{year}} Guide to {{topic}}: Everything You Need to Know', 'Authority Positioning', '["blog", "linkedin", "email"]'),
('Common Mistakes', 'urgency_scarcity', 'Warning about pitfalls creates urgency', '{{number}} {{topic}} Mistakes That Could Cost You {{loss}} (And How to Avoid Them)', 'Loss Aversion', '["blog", "email", "facebook"]'),
('Quick Wins', 'engagement', 'Fast results reduce friction to action', '{{number}} Simple {{topic}} Hacks You Can Implement Today', 'Instant Gratification', '["twitter", "instagram", "tiktok"]'),
('Industry Secrets', 'viral_sharing', 'Exclusive insights trigger sharing behavior', 'What {{industry}} Professionals Don''t Want You to Know About {{topic}}', 'Insider Knowledge', '["linkedin", "blog", "twitter"]'),
('Question Hook', 'attention_capture', 'Questions create open loops that demand resolution', 'Are You Making These {{number}} {{topic}} Mistakes? (Most {{audience}} Are)', 'Open Loop', '["facebook", "linkedin", "email_subject"]');

CREATE TABLE IF NOT EXISTS industry_statistics (
  id TEXT PRIMARY KEY DEFAULT ('stat_' || lower(hex(randomblob(8)))),
  statistic TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  source_url TEXT,
  industry TEXT NOT NULL, -- 'building', 'legal', 'accounting', 'trade', 'general'
  category TEXT NOT NULL, -- 'seo', 'marketing', 'social_media', 'conversion', 'roi'
  impact_score INTEGER DEFAULT 5 CHECK(impact_score BETWEEN 1 AND 10), -- How compelling is this stat?
  year_published INTEGER,
  credibility_tier TEXT DEFAULT 'verified' CHECK(credibility_tier IN ('verified', 'reputable', 'general')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed with powerful statistics
INSERT OR IGNORE INTO industry_statistics (statistic, source, source_url, industry, category, impact_score, year_published, credibility_tier) VALUES
('93% of online experiences begin with a search engine', 'Search Engine Journal', 'https://www.searchenginejournal.com', 'general', 'seo', 9, 2023, 'verified'),
('75% of users never scroll past the first page of search results', 'HubSpot', 'https://www.hubspot.com', 'general', 'seo', 10, 2023, 'verified'),
('70% of marketers see SEO as more effective than PPC', 'DataBox', 'https://databox.com', 'general', 'seo', 8, 2023, 'verified'),
('Businesses earn $2 for every $1 spent on Google Ads', 'Google Economic Impact', 'https://economicimpact.google.com', 'general', 'marketing', 9, 2023, 'verified'),
('46% of all Google searches are looking for local information', 'GoGulf', 'https://www.gogulf.com', 'general', 'seo', 10, 2023, 'verified'),
('88% of consumers trust online reviews as much as personal recommendations', 'BrightLocal', 'https://www.brightlocal.com', 'general', 'trust', 9, 2023, 'verified'),
('Companies that blog get 55% more website visitors', 'HubSpot', 'https://www.hubspot.com', 'general', 'content', 8, 2023, 'verified'),
('Video content is 50x more likely to drive organic search results than plain text', 'Forrester Research', 'https://www.forrester.com', 'general', 'content', 9, 2022, 'verified'),
('72% of people who search for something nearby visit a store within 5 miles', 'Google', 'https://www.thinkwithgoogle.com', 'general', 'local_seo', 10, 2023, 'verified'),
('61% of marketers say improving SEO and growing organic presence is their top priority', 'HubSpot', 'https://www.hubspot.com', 'general', 'seo', 8, 2023, 'verified');

CREATE TABLE IF NOT EXISTS psychological_triggers (
  id TEXT PRIMARY KEY DEFAULT ('trigger_' || lower(hex(randomblob(8)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  application TEXT NOT NULL, -- How to apply this in content
  effectiveness_rating INTEGER DEFAULT 5 CHECK(effectiveness_rating BETWEEN 1 AND 10),
  best_contexts TEXT NOT NULL, -- JSON array of contexts: ["headlines", "cta", "email_subject"]
  examples TEXT, -- JSON array of examples
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Psychological Marketing Triggers
INSERT OR IGNORE INTO psychological_triggers (name, description, application, effectiveness_rating, best_contexts, examples) VALUES
('Scarcity', 'Limited availability increases perceived value', 'Use time-limited offers or limited quantity messaging', 9, '["cta", "headlines", "ads"]', '["Only 3 spots left", "Offer ends in 48 hours", "Limited to first 10 clients"]'),
('Social Proof', 'People follow the actions of others', 'Show testimonials, case studies, client count, reviews', 10, '["landing_pages", "testimonials", "ads"]', '["Join 10,000+ businesses", "Rated 4.9/5 by 500+ clients", "As featured on..."]'),
('Authority', 'Expert endorsement increases trust', 'Display credentials, certifications, awards, media mentions', 8, '["about_page", "bios", "case_studies"]', '["20 years experience", "Certified by...", "Featured in Forbes"]'),
('Reciprocity', 'People feel obligated to return favors', 'Offer free value first (guides, audits, consultations)', 9, '["lead_magnets", "content_upgrades", "free_tools"]', '["Free SEO audit", "Download our guide", "Complimentary consultation"]'),
('Loss Aversion', 'Fear of losing is stronger than desire to gain', 'Emphasize what clients lose by NOT taking action', 10, '["headlines", "email_subject", "cta"]', '["Don''t lose customers to competitors", "Stop leaving money on the table"]'),
('Curiosity Gap', 'Incomplete information demands resolution', 'Create open loops that must be closed', 9, '["headlines", "email_subject", "video_titles"]', '["The secret to...", "What nobody tells you about...", "The one thing that..."]'),
('Anchoring', 'First number sets reference point for value', 'Show original price before discounted price', 8, '["pricing_pages", "proposals", "ads"]', '["Was $5000, now $2999", "Typical agency fee: $10k/mo (Ours: $3k/mo)"]'),
('Consistency Principle', 'People stick with their stated commitments', 'Get small commitments first (micro-conversions)', 7, '["lead_forms", "onboarding", "email_sequences"]', '["Start with free trial", "Just answer 3 questions", "Take our 2-minute quiz"]'),
('Urgency', 'Time pressure accelerates decision-making', 'Add deadlines, countdowns, time-sensitive offers', 9, '["cta", "promotions", "email_campaigns"]', '["Expires midnight tonight", "24-hour flash sale", "Book this week to secure rate"]'),
('Belonging', 'Desire to be part of an exclusive group', 'Create insider communities, VIP programs', 8, '["membership_pages", "email_nurture", "social_media"]', '["Join our inner circle", "VIP client program", "Exclusive for members"]');

CREATE TABLE IF NOT EXISTS social_media_platform_specs (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE CHECK(platform IN (
    'facebook', 'instagram', 'linkedin', 'tiktok', 'twitter', 'reddit',
    'youtube', 'pinterest', 'snapchat', 'threads'
  )),
  primary_audience TEXT NOT NULL,
  content_formats TEXT NOT NULL, -- JSON array
  optimal_post_length TEXT,
  optimal_posting_times TEXT, -- JSON array
  hashtag_strategy TEXT,
  engagement_tactics TEXT NOT NULL, -- JSON array
  advertising_specs TEXT NOT NULL, -- JSON object with ad formats, sizes, targeting
  algo_ranking_factors TEXT NOT NULL, -- JSON array
  character_limits TEXT, -- JSON object
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Social Media Platform Specifications (2024 data)
INSERT OR REPLACE INTO social_media_platform_specs VALUES
('facebook', 'facebook', 'Ages 25-54, broad demographics, local communities',
 '["image_posts", "video", "carousel", "stories", "reels", "live_video"]',
 '40-80 characters for posts, 125 characters for link headlines',
 '["Weekdays 9am-3pm", "Wednesday 11am-1pm", "Thursday-Friday 1pm-3pm"]',
 '2-3 hashtags max, not as important as other platforms',
 '["respond_to_comments_fast", "use_facebook_groups", "go_live_regularly", "share_user_generated_content"]',
 '{"formats": ["image_ads", "video_ads", "carousel_ads", "collection_ads", "lead_ads"], "image_size": "1200x628px", "video_length": "15-30s optimal", "targeting": ["detailed_demographics", "interests", "behaviors", "lookalike_audiences", "retargeting"]}',
 '["meaningful_interactions", "engagement_bait_penalized", "video_completion_rate", "shares_over_likes", "time_spent_on_content", "recency"]',
 '{"post": 63206, "link_description": 30, "image_text": "20% rule deprecated", "ad_headline": 27}',
 datetime('now')),

('instagram', 'instagram', 'Ages 18-34, visual content consumers, lifestyle & brand-focused',
 '["feed_posts", "stories", "reels", "igtv", "carousel", "guides"]',
 '138-150 characters for captions (above "more" button)',
 '["Weekdays 11am-2pm", "Monday-Thursday 11am-1pm", "Sunday 10am-1pm"]',
 '3-5 hashtags (not 30), mix of popular and niche, use in first comment',
 '["post_reels_consistently", "use_trending_audio", "engage_with_stories", "carousel_posts_perform_well", "ask_questions_in_captions"]',
 '{"formats": ["image_ads", "video_ads", "carousel_ads", "stories_ads", "reels_ads", "shopping_ads"], "image_size": "1080x1080px square", "stories_size": "1080x1920px", "video_length": "15-60s reels optimal", "targeting": ["interests", "behaviors", "demographics", "lookalikes"]}',
 '["engagement_rate", "saves_highly_valued", "shares_top_signal", "watch_time_for_reels", "story_replies", "profile_visits", "follows"]',
 '{"caption": 2200, "bio": 150, "hashtags": 30, "username": 30, "story_text": "readable_limit"}',
 datetime('now')),

('linkedin', 'linkedin', 'Professionals, B2B, decision-makers, ages 25-54',
 '["text_posts", "articles", "images", "videos", "documents", "polls", "newsletters"]',
 '150-300 characters (sweet spot for engagement)',
 '["Tuesday-Thursday 8am-10am", "Wednesday 12pm", "Tuesday 10am-12pm"]',
 'Use 3-5 relevant hashtags, professional industry terms',
 '["comment_on_others_posts", "share_insights_not_promotions", "use_native_video", "post_consistently_3-5x_week", "engage_in_first_hour"]',
 '{"formats": ["sponsored_content", "message_ads", "dynamic_ads", "text_ads", "video_ads", "carousel_ads", "conversation_ads"], "image_size": "1200x627px", "video_length": "30-90s optimal", "targeting": ["job_title", "company", "industry", "skills", "groups", "seniority", "education"]}',
 '["personal_connections", "engagement_in_first_hour", "dwell_time", "shares_and_comments", "profile_views", "relevant_content", "avoid_external_links"]',
 '{"post": 3000, "article": 110000, "headline": 200, "summary": 2000, "company_description": 2000}',
 datetime('now')),

('tiktok', 'tiktok', 'Ages 16-34 (Gen Z & young millennials), entertainment-focused',
 '["short_videos", "live_streams", "duets", "stitches"]',
 'N/A (video platform), captions 150 characters optimal',
 '["Weekdays 6am-10am", "7pm-11pm", "Tuesday-Thursday 7pm-9pm"]',
 'Use 3-5 hashtags, trending hashtags crucial, niche + broad mix',
 '["use_trending_sounds", "participate_in_challenges", "hook_in_first_3_seconds", "post_1-3x_daily", "engage_with_comments", "duet_popular_videos"]',
 '{"formats": ["in_feed_ads", "topview_ads", "branded_hashtag_challenge", "branded_effects", "spark_ads"], "video_size": "1080x1920px", "video_length": "21-34s optimal", "targeting": ["interests", "behaviors", "demographics", "custom_audiences", "lookalikes"]}',
 '["watch_time", "completion_rate", "shares", "comments", "profile_visits", "following_rate", "rewatch_rate", "use_of_sounds", "trending_participation"]',
 '{"caption": 2200, "bio": 80, "hashtags": 150, "video_length": "10_minutes_max"}',
 datetime('now')),

('twitter', 'twitter', 'News consumers, real-time conversations, ages 25-49',
 '["text_tweets", "images", "videos", "polls", "threads", "spaces"]',
 '71-100 characters (highest engagement)',
 '["Weekdays 8am-10am", "6pm-9pm", "Monday-Friday 9am"]',
 '1-2 hashtags optimal, more reduces engagement',
 '["reply_to_mentions_fast", "use_threads_for_depth", "quote_tweet_with_insight", "polls_boost_engagement", "tweet_3-5x_daily", "join_twitter_chats"]',
 '{"formats": ["promoted_tweets", "promoted_accounts", "promoted_trends", "twitter_amplify", "twitter_takeover"], "image_size": "1200x675px", "video_length": "15-45s optimal", "targeting": ["interests", "keywords", "followers", "demographics", "behaviors", "events", "conversation_topics"]}',
 '["recency_critical", "engagement_rate", "clicks", "retweets_weighted_high", "media_boosts_reach", "verified_accounts_advantage", "thread_depth"]',
 '{"tweet": 280, "bio": 160, "dm": 10000, "display_name": 50}',
 datetime('now')),

('youtube', 'youtube', 'All demographics, video consumers, ages 18-49',
 '["long_videos", "shorts", "live_streams", "community_posts"]',
 'Titles: 60 characters, Descriptions: first 157 characters critical',
 '["Weekdays 2pm-4pm", "Saturday-Sunday 9am-11am", "Thursday-Friday evenings"]',
 'Use 3-5 tags in description, not as critical as title/thumbnail',
 '["optimize_thumbnails", "hook_in_first_15_seconds", "pattern_interrupts_every_30s", "cta_to_subscribe", "use_cards_and_end_screens", "engage_with_comments"]',
 '{"formats": ["skippable_video_ads", "non_skippable_ads", "bumper_ads", "overlay_ads", "display_ads", "sponsored_cards"], "video_length": "6-15_minutes optimal", "shorts_length": "under_60s", "targeting": ["demographics", "interests", "placements", "keywords", "topics", "remarketing"]}',
 '["watch_time_critical", "ctr_on_thumbnail", "audience_retention", "engagement_signals", "session_starts", "upload_frequency", "video_metadata_optimization"]',
 '{"title": 100, "description": 5000, "tags": 500, "comment": 10000}',
 datetime('now'));

CREATE INDEX idx_frameworks_category ON content_frameworks(category);
CREATE INDEX idx_statistics_industry ON industry_statistics(industry);
CREATE INDEX idx_statistics_category ON industry_statistics(category);
CREATE INDEX idx_triggers_effectiveness ON psychological_triggers(effectiveness_rating DESC);
