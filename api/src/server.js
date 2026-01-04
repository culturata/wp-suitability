const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { syncDatabase } = require('./models');
const { initRedis } = require('./config/redis');
const { authenticateClerk, authenticateApiKey } = require('./middleware/auth');
const { checkRateLimit } = require('./middleware/rateLimiter');

// Import routes
const analysisRoutes = require('./routes/analysis');
const userRoutes = require('./routes/user');
const recommendationsRoutes = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter (prevent abuse)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Culturata Brand Suitability API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes with authentication
// Support both Clerk (for web dashboard) and API key (for WordPress plugin)
app.use(
  '/api/v1/analyze',
  (req, res, next) => {
    // Check if using API key or Clerk token
    if (req.headers['x-api-key']) {
      return authenticateApiKey(req, res, next);
    } else {
      return authenticateClerk(req, res, next);
    }
  },
  checkRateLimit,
  analysisRoutes
);

app.use(
  '/api/v1/user',
  (req, res, next) => {
    // Check if using API key or Clerk token
    if (req.headers['x-api-key']) {
      return authenticateApiKey(req, res, next);
    } else {
      return authenticateClerk(req, res, next);
    }
  },
  userRoutes
);

app.use(
  '/api/v1/recommendations',
  (req, res, next) => {
    // Check if using API key or Clerk token
    if (req.headers['x-api-key']) {
      return authenticateApiKey(req, res, next);
    } else {
      return authenticateClerk(req, res, next);
    }
  },
  recommendationsRoutes
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await syncDatabase();

    // Initialize Redis (optional)
    await initRedis();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
┌─────────────────────────────────────────────────────┐
│  Culturata Brand Suitability API                    │
│  Server running on port ${PORT}                      │
│  Environment: ${process.env.NODE_ENV || 'development'}                       │
│  Health check: http://localhost:${PORT}/health      │
└─────────────────────────────────────────────────────┘
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
