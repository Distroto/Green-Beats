const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const router = express.Router();

// Load each route's Swagger file
const path = require('path');
const userDoc = YAML.load(path.join(__dirname, 'user.yaml'));
const artistDoc = YAML.load(path.join(__dirname, 'artist.yaml'));
const concertDoc = YAML.load(path.join(__dirname, 'concert.yaml'));
const travelLogDoc = YAML.load(path.join(__dirname, 'travelLog.yaml'));
const rewardDoc = YAML.load(path.join(__dirname, 'reward.yaml'));


// Merge all into one Swagger spec (basic merge strategy)
const mergedDoc = {
  openapi: '3.0.0',
  info: {
    title: 'Green Beats API',
    version: '1.0.0',
    description: 'Sustainability-focused concert platform backend'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://green-beats.onrender.com:3000',
      description: 'Production server'
    }
  ],
  paths: {
    ...userDoc.paths,
    ...artistDoc.paths,
    ...concertDoc.paths,
    ...travelLogDoc.paths,
    ...rewardDoc.paths
  },
  components: {
    schemas: {
      ...userDoc.components?.schemas,
      ...artistDoc.components?.schemas,
      ...concertDoc.components?.schemas,
      ...travelLogDoc.components?.schemas,
      ...rewardDoc.components?.schemas
    }
  }
};

router.use('/', swaggerUi.serve, swaggerUi.setup(mergedDoc));

module.exports = router;
