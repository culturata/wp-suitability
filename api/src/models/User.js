const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clerkUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'clerk_user_id'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  organizationId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'organization_id'
  },
  tier: {
    type: DataTypes.ENUM('free', 'pro', 'enterprise'),
    defaultValue: 'free'
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'api_key'
  },
  monthlyAnalysisCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'monthly_analysis_count'
  },
  lastResetAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_reset_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
