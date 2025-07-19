const express = require('express');
const router = express.Router();
const artistRankingController = require('../controllers/artistRankingController');

// Analyze and rank an artist's sustainability
router.post('/analyze', artistRankingController.analyzeArtist);

// Get sustainability leaderboard
router.get('/leaderboard', artistRankingController.getLeaderboard);

// Get top artists by category
router.get('/categories', artistRankingController.getCategoryRankings);

// Get artist ranking by name
router.get('/artist/:artistName', artistRankingController.getArtistRanking);

module.exports = router; 