const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecommendationTracking = sequelize.define('RecommendationTracking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  analysisId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'analysis_id',
    references: {
      model: 'analyses',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'post_id'
  },
  recommendationIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'recommendation_index'
  },
  originalText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'original_text'
  },
  suggestedText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'suggested_text'
  },
  implemented: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  implementedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'implemented_at'
  },
  feedbackRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'feedback_rating',
    validate: {
      min: 1,
      max: 5
    }
  },
  feedbackComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'feedback_comment'
  }
}, {
  tableName: 'recommendation_tracking',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['analysis_id'] },
    { fields: ['user_id'] },
    { fields: ['implemented'] }
  ]
});

module.exports = RecommendationTracking;
