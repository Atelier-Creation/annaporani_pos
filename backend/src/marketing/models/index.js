import AdPlatformConnection from './adPlatformConnection.models.js';
import Campaign from './campaign.models.js';
import PerformanceMetric from './performanceMetrics.models.js';

AdPlatformConnection.hasMany(Campaign, { foreignKey: 'connection_id' });
Campaign.belongsTo(AdPlatformConnection, { foreignKey: 'connection_id' });

AdPlatformConnection.hasMany(PerformanceMetric, { foreignKey: 'connection_id' });
PerformanceMetric.belongsTo(AdPlatformConnection, { foreignKey: 'connection_id' });

Campaign.hasMany(PerformanceMetric, { foreignKey: 'campaign_id' });
PerformanceMetric.belongsTo(Campaign, { foreignKey: 'campaign_id' });

// We could sync here if it was strictly safe, but that's typically done elsewhere 
// (or via migrations). Let's just export the associations to be loaded.

export {
    AdPlatformConnection,
    Campaign,
    PerformanceMetric
};
