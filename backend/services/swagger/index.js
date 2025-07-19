const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const router = express.Router();

// Load each route's Swagger file
const path = require('path');

const loadYamlSafely = (filename) => {
  try {
    return YAML.load(path.join(__dirname, filename));
  } catch (error) {
    console.warn(`Warning: Could not load ${filename}:`, error.message);
    return { paths: {}, components: { schemas: {} } };
  }
};

const userDoc = loadYamlSafely('user.yaml');
const artistDoc = loadYamlSafely('artist.yaml');
const concertDoc = loadYamlSafely('concert.yaml');
const emissionDoc = loadYamlSafely('emission.yaml');
const rewardDoc = loadYamlSafely('reward.yaml');
const travelProofDoc = loadYamlSafely('travelProof.yaml');


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
    ...emissionDoc.paths,
    ...rewardDoc.paths,
    ...travelProofDoc.paths
  },
  components: {
    schemas: {
      ...userDoc.components?.schemas,
      ...artistDoc.components?.schemas,
      ...concertDoc.components?.schemas,
      ...emissionDoc.components?.schemas,
      ...rewardDoc.components?.schemas,
      ...travelProofDoc.components?.schemas
    }
  }
};

router.use('/', swaggerUi.serve, swaggerUi.setup(mergedDoc));

module.exports = router;
