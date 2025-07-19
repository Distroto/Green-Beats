const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
connectDB();

// Import Routes
const userRoutes = require('./routes/userRoutes');
const artistRoutes = require('./routes/artistRoutes');
const concertRoutes = require('./routes/concertRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const emissionRoutes = require('./routes/emissionRoutes');
const travelProofRoutes = require('./routes/travelProofRoutes');
const artistRankingRoutes = require('./routes/artistRankingRoutes');
const userSuggestionRoutes = require('./routes/userSuggestionRoutes');

// Import Swagger
const swaggerDocs = require('./services/swagger/index');

const app = express();
app.use(express.json());

// API-Routes
app.use('/users', userRoutes);
app.use('/artists', artistRoutes);
app.use('/concerts', concertRoutes);
app.use('/rewards', rewardRoutes);
app.use('/emissions', emissionRoutes);
app.use('/travel-proofs', travelProofRoutes);
app.use('/artist-rankings', artistRankingRoutes);
app.use('/suggestions', userSuggestionRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// API-Docs
app.use('/api-docs', swaggerDocs);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} and docs available at /api-docs`));