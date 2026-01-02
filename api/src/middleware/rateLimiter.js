const { User } = require('../models');

/**
 * Rate limiting middleware based on user tier
 */
async function checkRateLimit(req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Define tier limits
    const tierLimits = {
      free: parseInt(process.env.FREE_TIER_LIMIT) || 10,
      pro: parseInt(process.env.PRO_TIER_LIMIT) || 1000,
      enterprise: parseInt(process.env.ENTERPRISE_TIER_LIMIT) || 10000
    };

    const monthlyLimit = tierLimits[user.tier];

    // Check if we need to reset the counter (monthly reset)
    const now = new Date();
    const lastReset = new Date(user.lastResetAt);
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 30) {
      // Reset counter
      await user.update({
        monthlyAnalysisCount: 0,
        lastResetAt: now
      });
    }

    // Check if user has exceeded limit
    if (user.monthlyAnalysisCount >= monthlyLimit) {
      return res.status(429).json({
        success: false,
        error: 'Monthly analysis limit exceeded',
        limit: monthlyLimit,
        used: user.monthlyAnalysisCount,
        resetDate: new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        upgradeUrl: 'https://culturata.com/pricing'
      });
    }

    // Increment counter
    await user.increment('monthlyAnalysisCount');

    // Add usage info to response headers
    res.setHeader('X-RateLimit-Limit', monthlyLimit);
    res.setHeader('X-RateLimit-Remaining', monthlyLimit - user.monthlyAnalysisCount - 1);
    res.setHeader('X-RateLimit-Reset', new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    return res.status(500).json({
      success: false,
      error: 'Rate limiting check failed'
    });
  }
}

module.exports = {
  checkRateLimit
};
