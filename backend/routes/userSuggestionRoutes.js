const express = require('express');
const router = express.Router();
const userSuggestionController = require('../controllers/userSuggestionController');

// Get personalized suggestions for a user
router.get('/user/:userId', userSuggestionController.getUserSuggestions);

// Get travel suggestions for a specific concert
router.get('/user/:userId/concert/:concertId', userSuggestionController.getConcertSuggestions);

// Get user's sustainability progress
router.get('/user/:userId/progress', userSuggestionController.getUserProgress);

// Get user sustainability leaderboard
router.get('/leaderboard', userSuggestionController.getUserLeaderboard);

// Get top users by category
router.get('/categories', userSuggestionController.getUserCategoryRankings);

module.exports = router; 