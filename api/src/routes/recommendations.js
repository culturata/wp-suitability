const express = require('express');
const router = express.Router();
const { RecommendationTracking } = require('../models');

/**
 * POST /api/v1/recommendations/track
 * Track a recommendation implementation
 */
router.post('/track', async (req, res) => {
  try {
    const {
      analysisId,
      postId,
      recommendationIndex,
      originalText,
      suggestedText,
      implemented = true
    } = req.body;

    if (!analysisId || recommendationIndex === undefined || !originalText || !suggestedText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const tracking = await RecommendationTracking.create({
      analysisId,
      userId: req.user.id,
      postId,
      recommendationIndex,
      originalText,
      suggestedText,
      implemented,
      implementedAt: implemented ? new Date() : null
    });

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Track recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track recommendation'
    });
  }
});

/**
 * POST /api/v1/recommendations/:id/feedback
 * Provide feedback on a recommendation
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const tracking = await RecommendationTracking.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }

    await tracking.update({
      feedbackRating: rating,
      feedbackComment: comment
    });

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback'
    });
  }
});

/**
 * GET /api/v1/recommendations/stats
 * Get recommendation implementation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalRecommendations = await RecommendationTracking.count({
      where: { userId: req.user.id }
    });

    const implementedCount = await RecommendationTracking.count({
      where: {
        userId: req.user.id,
        implemented: true
      }
    });

    const avgRating = await RecommendationTracking.findOne({
      where: { userId: req.user.id },
      attributes: [
        [RecommendationTracking.sequelize.fn('AVG', RecommendationTracking.sequelize.col('feedback_rating')), 'avgRating']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total: totalRecommendations,
        implemented: implementedCount,
        implementationRate: totalRecommendations > 0 ? ((implementedCount / totalRecommendations) * 100).toFixed(1) : 0,
        averageRating: avgRating?.avgRating ? parseFloat(avgRating.avgRating).toFixed(1) : null
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats'
    });
  }
});

/**
 * GET /api/v1/recommendations/analysis/:analysisId
 * Get tracked recommendations for a specific analysis
 */
router.get('/analysis/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;

    const recommendations = await RecommendationTracking.findAll({
      where: {
        analysisId,
        userId: req.user.id
      },
      order: [['recommendationIndex', 'ASC']]
    });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recommendations'
    });
  }
});

module.exports = router;
