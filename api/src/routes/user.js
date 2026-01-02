const express = require('express');
const router = express.Router();
const { User } = require('../models');

/**
 * GET /api/v1/user/profile
 * Get current user profile and API key
 */
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;

    // Calculate days until reset
    const now = new Date();
    const lastReset = new Date(user.lastResetAt);
    const nextReset = new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysUntilReset = Math.ceil((nextReset - now) / (1000 * 60 * 60 * 24));

    // Get tier limits
    const tierLimits = {
      free: parseInt(process.env.FREE_TIER_LIMIT) || 10,
      pro: parseInt(process.env.PRO_TIER_LIMIT) || 1000,
      enterprise: parseInt(process.env.ENTERPRISE_TIER_LIMIT) || 10000
    };

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        apiKey: user.apiKey,
        usage: {
          current: user.monthlyAnalysisCount,
          limit: tierLimits[user.tier],
          remaining: tierLimits[user.tier] - user.monthlyAnalysisCount,
          resetDate: nextReset.toISOString(),
          daysUntilReset
        },
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

/**
 * POST /api/v1/user/regenerate-key
 * Regenerate API key
 */
router.post('/regenerate-key', async (req, res) => {
  try {
    const crypto = require('crypto');
    const newApiKey = crypto.randomBytes(32).toString('hex');

    await req.user.update({
      apiKey: newApiKey
    });

    res.json({
      success: true,
      data: {
        apiKey: newApiKey
      }
    });
  } catch (error) {
    console.error('Regenerate key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key'
    });
  }
});

/**
 * GET /api/v1/user/usage
 * Get detailed usage information
 */
router.get('/usage', async (req, res) => {
  try {
    const user = req.user;

    // Calculate reset date
    const lastReset = new Date(user.lastResetAt);
    const nextReset = new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get tier limits
    const tierLimits = {
      free: parseInt(process.env.FREE_TIER_LIMIT) || 10,
      pro: parseInt(process.env.PRO_TIER_LIMIT) || 1000,
      enterprise: parseInt(process.env.ENTERPRISE_TIER_LIMIT) || 10000
    };

    const limit = tierLimits[user.tier];
    const percentageUsed = (user.monthlyAnalysisCount / limit) * 100;

    res.json({
      success: true,
      data: {
        tier: user.tier,
        current: user.monthlyAnalysisCount,
        limit,
        remaining: limit - user.monthlyAnalysisCount,
        percentageUsed: parseFloat(percentageUsed.toFixed(2)),
        resetDate: nextReset.toISOString(),
        lastResetDate: lastReset.toISOString()
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage information'
    });
  }
});

module.exports = router;
