const express = require('express');
const router = express.Router();
const { analyzeContent, getScoreSummary } = require('../services/claudeAnalyzer');
const { screenContent, getPreliminaryScore, needsAIAnalysis } = require('../services/keywordScreener');
const { Analysis, RecommendationTracking } = require('../models');
const { getRedisClient } = require('../config/redis');
const crypto = require('crypto');

/**
 * POST /api/v1/analyze
 * Analyze content for brand suitability
 */
router.post('/analyze', async (req, res) => {
  try {
    const { title, content, excerpt = '', postId = null, postUrl = null } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // Check cache first
    const contentHash = crypto
      .createHash('sha256')
      .update(`${title}||${content}||${excerpt}`)
      .digest('hex');

    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const cachedResult = await redisClient.get(`analysis:${contentHash}`);
        if (cachedResult) {
          console.log('Returning cached analysis result');
          const parsed = JSON.parse(cachedResult);
          return res.json({
            success: true,
            cached: true,
            data: parsed
          });
        }
      } catch (cacheError) {
        console.error('Cache retrieval error:', cacheError);
        // Continue with analysis if cache fails
      }
    }

    // Step 1: Keyword-based pre-screening
    const keywordScreening = screenContent(title + ' ' + content + ' ' + excerpt);
    const userTier = req.user.tier;

    let analysisResult;
    let analysisMethod = 'hybrid';

    // Step 2: Determine analysis method based on tier
    if (userTier === 'free' && !keywordScreening.flagged) {
      // Free tier: keyword-only for clean content
      analysisMethod = 'keyword_only';
      analysisResult = {
        contentHash,
        overallScore: getPreliminaryScore(keywordScreening),
        garmRiskLevel: keywordScreening.riskLevel,
        garmCategories: keywordScreening.categories,
        iabCategories: [],
        sentimentScore: 0,
        toxicityFlags: {
          hateSpeech: keywordScreening.categories.hateSpeech?.detected || false,
          violence: keywordScreening.categories.crimeHarmfulActs?.detected || false,
          adultContent: keywordScreening.categories.adultContent?.detected || false,
          profanity: keywordScreening.categories.obscenityProfanity?.detected || false,
          controversial: keywordScreening.categories.debatedSocialIssues?.detected || false
        },
        riskFlags: [],
        flaggedEntities: [],
        recommendations: [],
        reasoning: 'Keyword-based analysis (upgrade for AI-powered insights)',
        processingTimeMs: 0,
        modelVersion: 'keyword-screener-v1'
      };
    } else if (needsAIAnalysis(keywordScreening, userTier)) {
      // Pro/Enterprise or flagged content: Full AI analysis
      analysisMethod = 'hybrid';
      analysisResult = await analyzeContent({ title, content, excerpt });

      // Merge keyword screening with AI results
      analysisResult.keywordFlags = keywordScreening;
    } else {
      // Keyword-only fallback
      analysisMethod = 'keyword_only';
      analysisResult = {
        contentHash,
        overallScore: getPreliminaryScore(keywordScreening),
        garmRiskLevel: keywordScreening.riskLevel,
        garmCategories: keywordScreening.categories,
        iabCategories: [],
        sentimentScore: 0,
        toxicityFlags: {
          hateSpeech: keywordScreening.categories.hateSpeech?.detected || false,
          violence: keywordScreening.categories.crimeHarmfulActs?.detected || false,
          adultContent: keywordScreening.categories.adultContent?.detected || false,
          profanity: keywordScreening.categories.obscenityProfanity?.detected || false,
          controversial: keywordScreening.categories.debatedSocialIssues?.detected || false
        },
        riskFlags: [],
        flaggedEntities: [],
        recommendations: [],
        reasoning: 'Keyword-based analysis',
        processingTimeMs: 0,
        modelVersion: 'keyword-screener-v1'
      };
    }

    // Save to database
    const savedAnalysis = await Analysis.create({
      userId: req.user.id,
      postId,
      postUrl,
      contentHash: analysisResult.contentHash,
      overallScore: analysisResult.overallScore,
      garmRiskLevel: analysisResult.garmRiskLevel,
      garmCategories: analysisResult.garmCategories || {},
      iabCategories: analysisResult.iabCategories,
      sentimentScore: analysisResult.sentimentScore,
      toxicityFlags: analysisResult.toxicityFlags,
      riskFlags: analysisResult.riskFlags,
      flaggedEntities: analysisResult.flaggedEntities,
      recommendations: analysisResult.recommendations || [],
      keywordFlags: analysisResult.keywordFlags || {},
      analysisMethod,
      modelVersion: analysisResult.modelVersion,
      processingTimeMs: analysisResult.processingTimeMs,
      rawResponse: analysisResult.rawResponse || analysisResult
    });

    // Cache the result (24 hours)
    if (redisClient) {
      try {
        await redisClient.setEx(
          `analysis:${contentHash}`,
          86400,
          JSON.stringify(analysisResult)
        );
      } catch (cacheError) {
        console.error('Cache storage error:', cacheError);
      }
    }

    // Add score summary
    const scoreSummary = getScoreSummary(analysisResult.overallScore);

    res.json({
      success: true,
      cached: false,
      data: {
        id: savedAnalysis.id,
        ...analysisResult,
        scoreSummary
      }
    });
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
});

/**
 * GET /api/v1/analyze/:id
 * Get a specific analysis by ID
 */
router.get('/analyze/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    const scoreSummary = getScoreSummary(analysis.overallScore);

    res.json({
      success: true,
      data: {
        ...analysis.toJSON(),
        scoreSummary
      }
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analysis'
    });
  }
});

/**
 * GET /api/v1/analyze
 * Get analysis history for the user
 */
router.get('/analyze', async (req, res) => {
  try {
    const { limit = 50, offset = 0, garmRiskLevel } = req.query;

    const whereClause = { userId: req.user.id };
    if (garmRiskLevel) {
      whereClause.garmRiskLevel = garmRiskLevel;
    }

    const analyses = await Analysis.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        analyses: analyses.rows.map(a => ({
          ...a.toJSON(),
          scoreSummary: getScoreSummary(a.overallScore)
        })),
        total: analyses.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analyses'
    });
  }
});

/**
 * GET /api/v1/analyze/stats
 * Get analysis statistics for the user
 */
router.get('/analyze/stats', async (req, res) => {
  try {
    const { Op } = require('sequelize');

    const totalAnalyses = await Analysis.count({
      where: { userId: req.user.id }
    });

    const avgScore = await Analysis.findOne({
      where: { userId: req.user.id },
      attributes: [
        [Analysis.sequelize.fn('AVG', Analysis.sequelize.col('overall_score')), 'avgScore']
      ],
      raw: true
    });

    const riskDistribution = await Analysis.findAll({
      where: { userId: req.user.id },
      attributes: [
        'garmRiskLevel',
        [Analysis.sequelize.fn('COUNT', Analysis.sequelize.col('id')), 'count']
      ],
      group: ['garmRiskLevel'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalAnalyses,
        averageScore: parseFloat(avgScore?.avgScore || 0).toFixed(2),
        riskDistribution: riskDistribution.reduce((acc, curr) => {
          acc[curr.garmRiskLevel] = parseInt(curr.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;
