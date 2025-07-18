const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
connectDB();

//Import Routes
const userRoutes = require('./routes/userRoutes');
const artistRoutes = require('./routes/artistRoutes');
const concertRoutes = require('./routes/concertRoutes');
const travelLogRoutes = require('./routes/travelLogRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const emissionRoutes = require('./routes/emissionRoutes');

//Import Swagger 
const swaggerDocs = require('./services/swagger/index');
const { connect } = require('mongoose');

const app = express();
app.use(express.json());


//API-Routes
app.use('/users', userRoutes);
app.use('/artists', artistRoutes);
app.use('/concerts', concertRoutes);
app.use('/travel-logs', travelLogRoutes);
app.use('/rewards', rewardRoutes);

//API-Docs
app.use('/api-docs', swaggerDocs);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
