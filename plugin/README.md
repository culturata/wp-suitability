# Culturata Brand Suitability WordPress Plugin

Real-time brand suitability analysis for WordPress content powered by Culturata Labs and Claude AI.

## Description

The Culturata Brand Suitability plugin helps publishers and content creators understand how safe their content is for brand advertising. Powered by advanced AI analysis, it provides:

- ✅ **Real-time Analysis**: Analyze content as you write in the Gutenberg editor
- 📊 **Brand Safety Scores**: 0-100 scoring with GARM risk level classification
- 🏷️ **IAB Category Tagging**: Automatic content categorization
- ⚠️ **Risk Detection**: Identify potential brand safety issues
- 📈 **Dashboard Overview**: Track site-wide content quality
- 🔄 **Bulk Analysis**: Analyze multiple posts at once

## Installation

### Requirements

- WordPress 6.0 or higher
- PHP 7.4 or higher
- Active Culturata API account and API key

### Step 1: Upload Plugin

1. Download the plugin files
2. Upload to `/wp-content/plugins/culturata-brand-suitability/`
3. Activate through the WordPress 'Plugins' menu

Or install directly from WordPress admin:

1. Go to Plugins → Add New
2. Search for "Culturata Brand Suitability"
3. Click "Install Now" and then "Activate"

### Step 2: Configure API Key

1. Navigate to **Brand Suitability → Settings**
2. Enter your Culturata API key
3. Click "Save Changes"
4. Verify connection status shows "✓ Connected"

**Don't have an API key?** [Get one here](https://culturata.com/api-keys)

## Features

### 1. Gutenberg Editor Integration

A sidebar panel appears in the Gutenberg editor showing:

- **Overall Score**: 0-100 brand safety score
- **GARM Risk Level**: Floor, Low, Medium, or High
- **Risk Flags**: Specific issues detected (hate speech, violence, adult content, etc.)
- **IAB Categories**: Content classification tags
- **Analysis Summary**: AI-generated explanation

**To use:**
1. Open any post in the Gutenberg editor
2. Click the shield icon in the top-right toolbar
3. Click "Analyze Content" in the sidebar
4. View results and adjust content as needed

### 2. Classic Editor Meta Box

For classic editor users, a meta box appears in the sidebar:

- Shows current analysis score and GARM level
- "Analyze Now" button for new analysis
- "Re-analyze" after content changes

### 3. Dashboard Widget

Track content quality at a glance:

- **Total Posts Analyzed**: Count of analyzed content
- **Average Score**: Site-wide brand safety average
- **GARM Distribution**: Breakdown by risk level
- **Posts Needing Attention**: High-risk content flagged for review

### 4. Bulk Analysis Tool

Analyze multiple posts at once:

1. Go to **Brand Suitability → Bulk Analysis**
2. Select post types and statuses
3. Set batch size (up to 100 posts)
4. Click "Start Bulk Analysis"
5. Monitor progress in real-time

**Note**: Bulk analysis consumes API quota based on number of posts analyzed.

### 5. Settings Page

Configure plugin behavior:

- **API Key**: Your Culturata API authentication key
- **API Endpoint**: Custom endpoint URL (advanced users)
- **Auto-analyze on Publish**: Automatically analyze when publishing posts

## Understanding Scores

### Overall Score (0-100)

- **90-100**: Excellent - Completely brand safe
- **75-89**: Good - Safe for most brands
- **60-74**: Moderate - Some caution advised
- **40-59**: Risky - May not be suitable for all brands
- **0-39**: High Risk - Not suitable for most brands

### GARM Risk Levels

Based on [Global Alliance for Responsible Media](https://wfanet.org/leadership/garm) standards:

- **Floor**: No risk, completely brand safe
- **Low**: Minimal risk, safe for most brands
- **Medium**: Some risk, may not be suitable for all brands
- **High**: Significant risk, not suitable for most brands

### Risk Flags

The analysis identifies specific issues:

- **Hate Speech**: Discriminatory or offensive language
- **Violence**: Graphic or violent content
- **Adult Content**: Sexually explicit material
- **Profanity**: Strong language
- **Controversial**: Sensitive topics (politics, religion, etc.)

### IAB Categories

Content is automatically tagged using the [IAB Content Taxonomy](https://www.iab.com/guidelines/content-taxonomy/):

Examples: Business, Entertainment, Health & Fitness, News, Technology, Sports, etc.

## Usage

### Analyzing a Single Post

**In Gutenberg:**
1. Open post in editor
2. Click shield icon → "Brand Suitability" sidebar
3. Click "Analyze Content"
4. Review results and make adjustments
5. Re-analyze after changes if needed

**In Classic Editor:**
1. Scroll to "Brand Suitability Score" meta box
2. Click "Analyze Now"
3. Page refreshes with results

### Viewing Analysis Results

Analysis data is saved as post metadata and includes:

- Overall score and grade
- GARM risk level
- Risk flags and descriptions
- IAB category tags
- Sentiment analysis
- Flagged entities
- Analysis timestamp

### Re-analyzing Content

Content should be re-analyzed when:

- Significant edits are made
- Title or excerpt changes
- You want to verify improvements

**Note**: Re-analysis uses API quota. Cached results are returned for identical content.

## API Quota Management

### Free Tier

- 10 analyses per month
- Perfect for small blogs and testing

### Pro Tier

- 1,000 analyses per month
- Ideal for regular publishers

### Enterprise Tier

- 10,000+ analyses per month
- For large publishers and agencies

**View Usage:**
- Check Settings page for current usage
- Monitor in dashboard widget
- Quota resets monthly

**When Limit Reached:**
- Plugin will show error message
- Upgrade at [culturata.com/pricing](https://culturata.com/pricing)
- Contact sales for enterprise plans

## REST API

The plugin provides REST API endpoints for programmatic access:

### Analyze Content

```http
POST /wp-json/culturata-bs/v1/analyze
Headers: X-WP-Nonce: <nonce>
Body:
{
  "title": "Post Title",
  "content": "Post content...",
  "excerpt": "Optional excerpt",
  "post_id": 123
}
```

### Get Analysis

```http
GET /wp-json/culturata-bs/v1/analysis/{post_id}
Headers: X-WP-Nonce: <nonce>
```

## Filters & Hooks

### Filters

```php
// Modify API endpoint
add_filter('culturata_bs_api_endpoint', function($endpoint) {
    return 'https://custom-api.example.com/v1';
});

// Modify analysis parameters
add_filter('culturata_bs_analysis_params', function($params, $post_id) {
    // Customize analysis parameters
    return $params;
}, 10, 2);

// Customize score display
add_filter('culturata_bs_score_summary', function($summary, $score) {
    // Customize score summary
    return $summary;
}, 10, 2);
```

### Actions

```php
// After successful analysis
add_action('culturata_bs_analysis_complete', function($post_id, $analysis) {
    // Custom logic after analysis
}, 10, 2);

// Before analysis request
add_action('culturata_bs_before_analyze', function($post_id) {
    // Pre-analysis logic
});
```

## Troubleshooting

### Connection Failed

**Problem**: Settings page shows "✗ Connection Failed"

**Solutions**:
1. Verify API key is correct
2. Check internet connectivity
3. Ensure API endpoint URL is correct
4. Contact support if issue persists

### Rate Limit Exceeded

**Problem**: Error message "Monthly analysis limit exceeded"

**Solutions**:
1. Check current usage in Settings
2. Wait for monthly reset
3. Upgrade to higher tier
4. Use cached results when possible

### Analysis Not Appearing

**Problem**: Analysis button doesn't show results

**Solutions**:
1. Check browser console for JavaScript errors
2. Ensure API key is configured
3. Verify post has title and content
4. Try clearing browser cache

### Slow Analysis

**Problem**: Analysis takes a long time

**Explanations**:
- First-time analysis: 2-5 seconds (normal)
- Cached results: Instant
- Very long content: Up to 10 seconds
- API service issues: Check status page

## Privacy & Data

### What Data is Sent

When analyzing content, the following is sent to Culturata API:

- Post title
- Post content (body text)
- Post excerpt (if available)
- Post ID (for tracking)
- Site URL (for attribution)

### What Data is Stored

In your WordPress database:

- Analysis scores and results
- Timestamps
- Post associations

In Culturata's database:

- Analysis history
- Usage statistics
- Content hashes (for caching)

**Note**: Full content is NOT permanently stored. Only analysis results are retained.

### GDPR Compliance

The plugin is GDPR-compliant:

- No personal data is collected from site visitors
- Only admin users can trigger analysis
- Data processing agreement available
- Contact privacy@culturata.com for DPA

## FAQ

**Q: Does this slow down my website?**
A: No. Analysis happens on-demand via API and doesn't affect frontend performance.

**Q: Can I analyze custom post types?**
A: Yes. The plugin works with any public post type. Contact support for custom integration.

**Q: Is my content private?**
A: Yes. Content is transmitted over HTTPS and only used for analysis. It's not stored permanently or used for training AI models.

**Q: Can I export analysis data?**
A: Yes. Pro and Enterprise plans include CSV export. Coming soon to plugin.

**Q: Does this work with page builders?**
A: Yes. The plugin analyzes the final rendered content, compatible with Elementor, Divi, Beaver Builder, etc.

## Changelog

### 1.0.0 - 2024-01-15

- Initial release
- Gutenberg sidebar integration
- Classic editor meta box
- Dashboard widget
- Bulk analysis tool
- Settings page with API configuration
- REST API endpoints
- GARM risk level assessment
- IAB category tagging
- Claude AI integration

## Support

Need help?

- **Documentation**: [docs.culturata.com](https://docs.culturata.com)
- **Support Tickets**: [support.culturata.com](https://support.culturata.com)
- **Email**: support@culturata.com
- **Community**: [community.culturata.com](https://community.culturata.com)

## Credits

- Developed by [Culturata Labs](https://culturata.com)
- Powered by [Anthropic Claude AI](https://anthropic.com)
- GARM standards by [World Federation of Advertisers](https://wfanet.org/leadership/garm)

## License

This plugin is licensed under the GPL v2 or later.

```
Copyright (C) 2024 Culturata Labs

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
```
