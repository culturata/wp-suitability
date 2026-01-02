const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  postUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'post_url'
  },
  contentHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'content_hash'
  },
  overallScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'overall_score',
    validate: {
      min: 0,
      max: 100
    }
  },
  garmRiskLevel: {
    type: DataTypes.ENUM('floor', 'low', 'medium', 'high'),
    allowNull: false,
    field: 'garm_risk_level'
  },
  iabCategories: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'iab_categories'
  },
  sentimentScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'sentiment_score',
    validate: {
      min: -1,
      max: 1
    }
  },
  toxicityFlags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'toxicity_flags'
  },
  flaggedEntities: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'flagged_entities'
  },
  riskFlags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'risk_flags'
  },
  modelVersion: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'claude-3-5-sonnet-20241022',
    field: 'model_version'
  },
  processingTimeMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'processing_time_ms'
  },
  rawResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'raw_response'
  }
}, {
  tableName: 'analyses',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['content_hash'] },
    { fields: ['created_at'] },
    { fields: ['garm_risk_level'] }
  ]
});

module.exports = Analysis;
