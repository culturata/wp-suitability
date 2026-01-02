const { clerkClient } = require('@clerk/clerk-sdk-node');
const { User } = require('../models');
const crypto = require('crypto');

/**
 * Middleware to authenticate requests using Clerk
 */
async function authenticateClerk(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify the session token with Clerk
      const session = await clerkClient.sessions.verifySession(token, token);

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session token'
        });
      }

      // Get user from Clerk
      const clerkUser = await clerkClient.users.getUser(session.userId);

      // Find or create user in our database
      let user = await User.findOne({
        where: { clerkUserId: session.userId }
      });

      if (!user) {
        // Create new user
        const apiKey = crypto.randomBytes(32).toString('hex');
        user = await User.create({
          clerkUserId: session.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          organizationId: clerkUser.organizationMemberships[0]?.organization?.id,
          tier: 'free',
          apiKey: apiKey
        });
      }

      // Attach user to request
      req.user = user;
      req.clerkUser = clerkUser;

      next();
    } catch (clerkError) {
      console.error('Clerk verification error:', clerkError);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error'
    });
  }
}

/**
 * Middleware to authenticate using API key (for WordPress plugin)
 */
async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Missing API key'
      });
    }

    const user = await User.findOne({
      where: { apiKey, isActive: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error'
    });
  }
}

module.exports = {
  authenticateClerk,
  authenticateApiKey
};
