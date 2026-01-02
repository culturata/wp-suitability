# Culturata Brand Suitability API

Node.js/Express backend API for analyzing content brand suitability using Claude AI with structured outputs.

## Features

- 🤖 **Claude AI Integration**: Uses Anthropic's Claude 3.5 Sonnet with structured JSON outputs
- 🔐 **Clerk Authentication**: Secure authentication with Clerk SDK
- 📊 **Usage Tracking**: Freemium tier system with monthly analysis limits
- 💾 **PostgreSQL Database**: Stores analysis results and user data
- ⚡ **Redis Caching**: Optional caching for improved performance
- 🎯 **GARM Compliance**: Risk level assessment following GARM standards
- 🏷️ **IAB Categorization**: Automatic content categorization using IAB taxonomy

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Redis (optional but recommended)
- Clerk account
- Anthropic API key

## Installation

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=culturata_brand_suitability
DB_USER=postgres
DB_PASSWORD=your_password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
FREE_TIER_LIMIT=10
PRO_TIER_LIMIT=1000
ENTERPRISE_TIER_LIMIT=10000
```

### 3. Set Up Database

Create a PostgreSQL database:

```bash
createdb culturata_brand_suitability
```

The application will automatically create tables on first run using Sequelize migrations.

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and version information.

### Analysis

#### Analyze Content

```
POST /api/v1/analyze
Headers:
  Content-Type: application/json
  X-API-Key: your-api-key

Body:
{
  "title": "Article Title",
  "content": "Full article content...",
  "excerpt": "Optional excerpt",
  "postId": "optional-post-id",
  "postUrl": "https://example.com/post"
}
```

**Response:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "id": "uuid",
    "overallScore": 85.5,
    "garmRiskLevel": "low",
    "iabCategories": [
      {
        "id": "IAB3",
        "name": "Business",
        "confidence": 0.92
      }
    ],
    "sentimentScore": 0.65,
    "toxicityFlags": {
      "hateSpeech": false,
      "violence": false,
      "adultContent": false,
      "profanity": false,
      "controversial": false
    },
    "riskFlags": [],
    "flaggedEntities": [],
    "reasoning": "Content is professional and appropriate for most brands...",
    "scoreSummary": {
      "grade": "B",
      "label": "Good",
      "color": "blue"
    },
    "processingTimeMs": 1523,
    "modelVersion": "claude-3-5-sonnet-20241022"
  }
}
```

#### Get Analysis by ID

```
GET /api/v1/analyze/:id
Headers:
  X-API-Key: your-api-key
```

#### Get Analysis History

```
GET /api/v1/analyze?limit=50&offset=0&garmRiskLevel=high
Headers:
  X-API-Key: your-api-key
```

#### Get Analysis Statistics

```
GET /api/v1/analyze/stats
Headers:
  X-API-Key: your-api-key
```

### User Management

#### Get User Profile

```
GET /api/v1/user/profile
Headers:
  X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "tier": "free",
    "apiKey": "xxxxx",
    "usage": {
      "current": 5,
      "limit": 10,
      "remaining": 5,
      "resetDate": "2024-02-01T00:00:00.000Z",
      "daysUntilReset": 15
    }
  }
}
```

#### Regenerate API Key

```
POST /api/v1/user/regenerate-key
Headers:
  X-API-Key: your-current-api-key
```

#### Get Usage Information

```
GET /api/v1/user/usage
Headers:
  X-API-Key: your-api-key
```

## Authentication

The API supports two authentication methods:

### 1. Clerk Session Token (for web dashboard)

```
Authorization: Bearer <clerk-session-token>
```

### 2. API Key (for WordPress plugin and integrations)

```
X-API-Key: <your-api-key>
```

## Rate Limiting

The API implements tier-based monthly rate limits:

- **Free Tier**: 10 analyses/month
- **Pro Tier**: 1,000 analyses/month
- **Enterprise Tier**: 10,000 analyses/month

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 2024-02-01T00:00:00.000Z
```

When the limit is exceeded, the API returns a `429 Too Many Requests` status with upgrade information.

## Caching

Analysis results are cached in Redis (if configured) for 24 hours based on content hash. Identical content will return cached results instantly without consuming API quota.

## Database Schema

### Users Table

```sql
- id (UUID, primary key)
- clerk_user_id (string, unique)
- email (string, unique)
- organization_id (string, nullable)
- tier (enum: free, pro, enterprise)
- api_key (string, unique)
- monthly_analysis_count (integer)
- last_reset_at (timestamp)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Analyses Table

```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- post_id (string, nullable)
- post_url (text, nullable)
- content_hash (string)
- overall_score (float)
- garm_risk_level (enum: floor, low, medium, high)
- iab_categories (jsonb)
- sentiment_score (float)
- toxicity_flags (jsonb)
- flagged_entities (jsonb)
- risk_flags (jsonb)
- model_version (string)
- processing_time_ms (integer)
- raw_response (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

## Error Handling

All errors return JSON with the following structure:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid API key or session)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Development

### Running Tests

```bash
npm test
```

### Code Structure

```
api/
├── src/
│   ├── config/
│   │   ├── database.js      # Sequelize configuration
│   │   └── redis.js         # Redis client setup
│   ├── models/
│   │   ├── User.js          # User model
│   │   ├── Analysis.js      # Analysis model
│   │   └── index.js         # Model associations
│   ├── services/
│   │   └── claudeAnalyzer.js # Claude API integration
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   └── rateLimiter.js   # Rate limiting middleware
│   ├── routes/
│   │   ├── analysis.js      # Analysis endpoints
│   │   └── user.js          # User endpoints
│   └── server.js            # Express app entry point
├── package.json
└── .env.example
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production database
- [ ] Configure Redis for caching
- [ ] Set up SSL/TLS
- [ ] Configure CORS allowed origins
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Configure rate limiting appropriately

### Recommended Hosting

- **Platform**: Railway, Render, AWS ECS, or DigitalOcean App Platform
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean Managed Databases)
- **Cache**: Managed Redis (AWS ElastiCache, Redis Labs)

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/culturata/wp-suitability/issues
- Email: support@culturata.com
- Documentation: https://docs.culturata.com
