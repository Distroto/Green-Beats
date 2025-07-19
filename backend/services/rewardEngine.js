const User = require('../models/userModel');
const Reward = require('../models/rewardModel');

/**
 * Assign eligible rewards to a user based on their current points.
 * Adds badges only if the user hasn’t earned them already.
 *
 * @param {string} userId - MongoDB User ObjectId
 * @returns {Promise<string[]>} - List of badges assigned (new)
 */
exports.assignRewardsToUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const rewards = await Reward.find();
  const eligible = rewards.filter(r =>
    user.rewardPoints >= r.pointsRequired &&
    !user.badges.includes(r.title)
  );

  if (eligible.length > 0) {
    const newBadges = eligible.map(r => r.title);
    user.badges.push(...newBadges);
    await user.save();
    return newBadges;
  }

  return [];
};

/**
 * Calculate points for travel based on mode and verification
 * Only green travel modes (walk, bike, train, bus) get points
 * 
 * @param {string} travelMode - Mode of travel
 * @param {number} emissions - CO2 emissions in kg
 * @param {boolean} isVerified - Whether the proof was verified
 * @returns {number} - Points earned
 */
exports.calculateTravelPoints = (travelMode, emissions, isVerified = false) => {
  if (!isVerified) return 0;
  
  const greenModes = ['walk', 'bike', 'train', 'bus'];
  if (!greenModes.includes(travelMode)) return 0;
  
  // Base points for green travel
  let points = Math.round(emissions * 2);
  
  // Bonus points for zero-emission travel
  if (travelMode === 'walk' || travelMode === 'bike') {
    points += 5; // Bonus for zero-emission
  }
  
  return points;
};
