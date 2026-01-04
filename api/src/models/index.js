const sequelize = require('../config/database');
const User = require('./User');
const Analysis = require('./Analysis');
const RecommendationTracking = require('./RecommendationTracking');

// Define associations
User.hasMany(Analysis, { foreignKey: 'userId', as: 'analyses' });
Analysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RecommendationTracking, { foreignKey: 'userId', as: 'recommendationTracking' });
RecommendationTracking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Analysis.hasMany(RecommendationTracking, { foreignKey: 'analysisId', as: 'recommendationTracking' });
RecommendationTracking.belongsTo(Analysis, { foreignKey: 'analysisId', as: 'analysis' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Analysis,
  RecommendationTracking,
  syncDatabase
};
