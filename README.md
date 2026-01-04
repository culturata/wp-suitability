# Culturata Brand Suitability Platform

A comprehensive brand suitability analysis platform for WordPress publishers, powered by Claude AI and built by Culturata Labs.

## 🎯 Overview

This platform helps publishers and advertisers assess content brand safety before it enters the programmatic advertising pipeline. It combines a powerful Node.js/Express API with a seamless WordPress plugin integration, featuring dual analysis methods (keyword + AI), actionable recommendations, and tier-based feature access.

### Key Components

1. **API Service** (`/api`) - Node.js/Express backend with Claude AI integration and keyword screening
2. **WordPress Plugin** (`/plugin`) - Gutenberg-integrated content analysis tool with one-click fixes

## 🌟 Features

### Content Analysis

- **Dual Analysis Methods**: Hybrid keyword screening + AI analysis for optimal speed and accuracy
- **12 GARM Risk Categories**: Comprehensive assessment across all Global Alliance for Responsible Media categories:
  1. Adult & Explicit Sexual Content
  2. Arms & Ammunition
  3. Crime & Harmful Acts
  4. Death, Injury, or Military Conflict
  5. Online Piracy
  6. Hate Speech & Acts of Aggression
  7. Obscenity & Profanity
  8. Illegal Drugs/Tobacco/e-Cigarettes/Vaping/Alcohol
  9. Spam or Harmful Content
  10. Terrorism
  11. Debated Sensitive Social Issues
  12. Military Conflict
- **AI-Powered Scoring**: Claude 3.5 Sonnet analyzes content with structured JSON outputs
- **IAB Categorization**: Automatic content classification using IAB Content Taxonomy v3.0
- **Sentiment Analysis**: Positive/negative/neutral tone detection
- **Entity Recognition**: Flags potentially problematic people, organizations, and events
- **Actionable Recommendations**: 3-5 specific suggestions with original → suggested text replacements
- **One-Click Fixes**: Apply recommendations directly in Gutenberg editor

### WordPress Integration

- **Gutenberg Sidebar**: Real-time analysis in the block editor
- **Classic Editor Support**: Meta box for traditional editor users
- **Dashboard Widget**: Site-wide content health overview
- **Bulk Analysis**: Analyze multiple posts simultaneously
- **REST API**: Programmatic access for custom integrations

### Developer Features

- **Clerk Authentication**: Secure user management tied to Culturata accounts
- **Tier-Based Feature Gating**: Different analysis methods and features by subscription level
  - **Free**: Keyword analysis only (AI for flagged content), 10 analyses/month
  - **Pro**: Full AI + keyword hybrid analysis, recommendations, 1,000 analyses/month
  - **Enterprise**: All features + bulk analysis + API access, 10,000+ analyses/month
- **Redis Caching**: 24-hour result caching for identical content
- **Rate Limiting**: Tier-based monthly quotas with automatic resets
- **PostgreSQL Database**: Robust data persistence and querying
- **Recommendation Tracking**: Database-backed tracking of implementations and feedback

## 📋 Prerequisites

### For API Service

- Node.js 18+ and npm
- PostgreSQL 13+
- Redis (optional but recommended)
- Clerk account ([clerk.com](https://clerk.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### For WordPress Plugin

- WordPress 6.0+
- PHP 7.4+
- Culturata API account and API key

## 🚀 Quick Start

### 1. Set Up API Service

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Create PostgreSQL database
createdb culturata_brand_suitability

# Start development server
npm run dev
```

API will be available at `http://localhost:3000`

### 2. Install WordPress Plugin

```bash
# Copy plugin to WordPress installation
cp -r plugin /path/to/wordpress/wp-content/plugins/culturata-brand-suitability

# Or create a symlink for development
ln -s $(pwd)/plugin /path/to/wordpress/wp-content/plugins/culturata-brand-suitability
```

Then in WordPress admin:
1. Go to Plugins → Installed Plugins
2. Activate "Culturata Brand Suitability"
3. Navigate to Brand Suitability → Settings
4. Enter your API key
5. Save and verify connection

## 📖 Documentation

Comprehensive documentation is available in each component:

- **[API Documentation](./api/README.md)** - Backend API setup, endpoints, authentication
- **[Plugin Documentation](./plugin/README.md)** - WordPress installation, features, usage

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WordPress Site                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Culturata Brand Suitability Plugin                 │   │
│  │  - Gutenberg Sidebar                                │   │
│  │  - Classic Editor Meta Box                          │   │
│  │  - Dashboard Widget                                 │   │
│  │  - REST API Client                                  │   │
│  └─────────────────────┬───────────────────────────────┘   │
└────────────────────────┼───────────────────────────────────┘
                         │ HTTPS (API Key Auth)
                         ▼
         ┌───────────────────────────────────┐
         │   Culturata API Service           │
         │   (Node.js/Express)               │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │ Authentication              │ │
         │  │ - Clerk SDK                 │ │
         │  │ - API Key Validation        │ │
         │  └─────────────────────────────┘ │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │ Rate Limiting               │ │
         │  │ - Tier-based quotas         │ │
         │  │ - Monthly resets            │ │
         │  └─────────────────────────────┘ │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │ Analysis Engine             │ │
         │  │ - Claude API Integration    │ │
         │  │ - Content hashing           │ │
         │  │ - Result caching            │ │
         │  └─────────────────────────────┘ │
         └───────────────┬───────────────────┘
                         │
         ┌───────────────┼───────────────────┐
         │               │                   │
         ▼               ▼                   ▼
   ┌──────────┐   ┌──────────┐       ┌──────────┐
   │PostgreSQL│   │  Redis   │       │ Claude   │
   │ Database │   │  Cache   │       │   API    │
   └──────────┘   └──────────┘       └──────────┘
```

## 🔑 Configuration

### Environment Variables (API)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=culturata_brand_suitability
DB_USER=postgres
DB_PASSWORD=xxxxx

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limits
FREE_TIER_LIMIT=10
PRO_TIER_LIMIT=1000
ENTERPRISE_TIER_LIMIT=10000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### WordPress Settings

Configure in **Brand Suitability → Settings**:

- **API Key**: Your Culturata authentication key
- **API Endpoint**: Default `https://api.culturata.com/v1`
- **Auto-analyze**: Automatically analyze on publish (optional)

## 💰 Pricing Tiers

| Tier | Analyses/Month | Analysis Method | Recommendations | Price | Best For |
|------|----------------|----------------|-----------------|-------|----------|
| **Free** | 10 | Keyword (AI for flagged) | ❌ No | $0 | Testing & small blogs |
| **Pro** | 1,000 | Hybrid (Keyword + AI) | ✅ Yes | $99/mo | Regular publishers |
| **Enterprise** | 10,000+ | Full AI + Bulk | ✅ Yes + Tracking | Custom | Large publishers & agencies |

## 📊 Scoring System

### Overall Score (0-100)

- **90-100** → Grade A: Excellent, completely brand safe
- **75-89** → Grade B: Good, safe for most brands
- **60-74** → Grade C: Moderate, some caution advised
- **40-59** → Grade D: Risky, may not suit all brands
- **0-39** → Grade F: High risk, unsuitable for most brands

### GARM Risk Levels

- **Floor**: No risk
- **Low**: Minimal risk
- **Medium**: Some risk
- **High**: Significant risk

### Analysis Output Example

```json
{
  "overallScore": 85.5,
  "garmRiskLevel": "low",
  "analysisMethod": "hybrid",
  "scoreSummary": {
    "grade": "B",
    "label": "Good",
    "color": "blue"
  },
  "garmCategories": {
    "adultContent": {"detected": false, "confidence": 0.02},
    "armsAmmunition": {"detected": false, "confidence": 0.01},
    "crimeHarmfulActs": {"detected": false, "confidence": 0.03},
    "deathInjuryConflict": {"detected": false, "confidence": 0.05},
    "onlinePiracy": {"detected": false, "confidence": 0.0},
    "hateSpeech": {"detected": false, "confidence": 0.01},
    "obscenityProfanity": {"detected": false, "confidence": 0.08},
    "drugsAlcoholTobacco": {"detected": false, "confidence": 0.02},
    "spamHarmful": {"detected": false, "confidence": 0.01},
    "terrorism": {"detected": false, "confidence": 0.0},
    "debatedSocialIssues": {"detected": true, "confidence": 0.45, "details": "Political content detected"},
    "militaryConflict": {"detected": false, "confidence": 0.03}
  },
  "iabCategories": [
    {"id": "IAB3", "name": "Business", "confidence": 0.92}
  ],
  "sentimentScore": 0.65,
  "toxicityFlags": {
    "hateSpeech": false,
    "violence": false,
    "adultContent": false,
    "profanity": false,
    "controversial": true
  },
  "riskFlags": [],
  "recommendations": [
    {
      "issue": "Political language may not be suitable for all brands",
      "location": "Paragraph 2",
      "original": "the controversial new policy",
      "suggested": "the recently announced policy",
      "priority": "medium",
      "reasoning": "Removing political connotation makes content more brand-safe"
    }
  ],
  "reasoning": "Professional business content with minor political references..."
}
```

## 🛠️ Development

### Project Structure

```
wp-suitability/
├── api/                                      # Node.js/Express API
│   ├── src/
│   │   ├── config/                          # Database & Redis config
│   │   ├── models/                          # Sequelize models
│   │   │   ├── User.js                      # User accounts and tiers
│   │   │   ├── Analysis.js                  # Analysis results
│   │   │   └── RecommendationTracking.js    # Recommendation implementations
│   │   ├── services/
│   │   │   ├── claudeAnalyzer.js            # AI analysis with recommendations
│   │   │   └── keywordScreener.js           # Fast keyword-based pre-screening
│   │   ├── middleware/
│   │   │   ├── auth.js                      # Clerk & API key auth
│   │   │   └── rateLimiter.js               # Tier-based rate limiting
│   │   ├── routes/
│   │   │   ├── analysis.js                  # Analysis endpoints
│   │   │   ├── user.js                      # User management
│   │   │   └── recommendations.js           # Recommendation tracking
│   │   └── server.js                        # Express app
│   ├── package.json
│   └── README.md
│
├── plugin/                                   # WordPress plugin
│   ├── includes/
│   │   ├── class-api-client.php             # API communication
│   │   ├── class-post-meta.php              # Meta data management
│   │   ├── class-admin.php                  # Settings & meta boxes
│   │   ├── class-gutenberg.php              # Block editor integration
│   │   └── class-dashboard.php              # Dashboard widgets
│   ├── assets/
│   │   ├── js/
│   │   │   ├── gutenberg.js                 # Enhanced Gutenberg UI with recommendations
│   │   │   └── admin.js                     # Admin interface
│   │   └── css/                             # Stylesheets
│   ├── culturata-brand-suitability.php
│   └── README.md
│
└── README.md                                 # This file
```

### Running Tests

**API:**
```bash
cd api
npm test
```

**Plugin:**
```bash
cd plugin
composer install
vendor/bin/phpunit
```

### Code Quality

The project follows these standards:

- **JavaScript**: ESLint with WordPress coding standards
- **PHP**: WordPress PHP Coding Standards (WPCS)
- **API**: Express.js best practices
- **Security**: OWASP Top 10 compliance

## 🚢 Deployment

### API Deployment

Recommended platforms:
- Railway
- Render
- AWS ECS
- DigitalOcean App Platform

### WordPress Plugin Distribution

Options:
- WordPress.org repository (after review)
- Direct distribution to customers
- GitHub releases
- Private plugin repository

## 🔒 Security

- ✅ HTTPS-only communication
- ✅ API key authentication
- ✅ Clerk session verification
- ✅ Input sanitization and validation
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection
- ✅ Rate limiting and abuse prevention
- ✅ Content hashing for deduplication

## 📝 License

This project is licensed under the MIT License (API) and GPL v2 or later (WordPress plugin).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📞 Support

- **Documentation**: [docs.culturata.com](https://docs.culturata.com)
- **Email**: support@culturata.com
- **Issues**: [GitHub Issues](https://github.com/culturata/wp-suitability/issues)
- **Community**: [community.culturata.com](https://community.culturata.com)

## 🙏 Credits

Built with:
- [Anthropic Claude](https://anthropic.com) - AI analysis engine
- [Clerk](https://clerk.com) - Authentication platform
- [Express.js](https://expressjs.com) - Web framework
- [Sequelize](https://sequelize.org) - ORM
- [WordPress](https://wordpress.org) - CMS platform

Standards:
- [GARM](https://wfanet.org/leadership/garm) - Brand safety standards
- [IAB](https://www.iab.com/guidelines/content-taxonomy/) - Content taxonomy

---

**Made with ❤️ by [Culturata Labs](https://culturata.com)**
