const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const sharp = require('sharp');

// Travel mode classification using Hugging Face pre-trained models
const TRAVEL_MODE_LABELS = {
  bike: [
    'bicycle', 'bike', 'cycling', 'cyclist', 'bike lane', 'bike rack', 
    'handlebar', 'saddle', 'pedal', 'wheel', 'mountain bike', 'road bike',
    'velocipede', 'two-wheeler', 'cycle'
  ],
  walk: [
    'walking', 'pedestrian', 'foot', 'sidewalk', 'path', 'trail', 
    'hiking', 'crossing', 'walking path', 'pedestrian crossing',
    'footpath', 'promenade', 'stroll'
  ],
  train: [
    'train', 'railway', 'subway', 'metro', 'rail', 'locomotive', 
    'station', 'platform', 'railway station', 'subway station',
    'commuter', 'transit', 'underground'
  ],
  bus: [
    'bus', 'coach', 'transit', 'public transport', 'bus stop', 
    'bus station', 'transit bus', 'city bus', 'shuttle',
    'omnibus', 'motorcoach'
  ],
  car: [
    'car', 'automobile', 'vehicle', 'sedan', 'suv', 'truck', 
    'driving', 'road', 'parking', 'garage', 'motorcar',
    'auto', 'wagon', 'coupe'
  ],
  flight: [
    'airplane', 'aircraft', 'plane', 'jet', 'airport', 'flying', 
    'aviation', 'airline', 'terminal', 'runway', 'aeroplane',
    'airliner', 'jetliner'
  ]
};

// Green travel indicators
const GREEN_INDICATORS = {
  bike: ['bicycle lane', 'bike rack', 'cycling infrastructure', 'green path', 'bike sharing'],
  walk: ['pedestrian crossing', 'walking path', 'green space', 'park', 'sidewalk'],
  train: ['electric train', 'solar panels', 'renewable energy', 'public transport', 'metro'],
  bus: ['electric bus', 'hybrid bus', 'public transport', 'bus lane', 'transit']
};

/**
 * Analyze image using Hugging Face pre-trained models
 */
async function analyzeImageWithHuggingFace(imagePath) {
  try {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'travel_proof.jpg',
      contentType: 'image/jpeg'
    });

    // Using Microsoft ResNet-50 for general image classification
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/resnet-50',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error('Failed to analyze image with Hugging Face');
  }
}

/**
 * Analyze image using Hugging Face specialized transport model (fallback)
 */
async function analyzeImageWithTransportModel(imagePath) {
  try {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'travel_proof.jpg',
      contentType: 'image/jpeg'
    });

    // Using a more specialized model for transport/vehicle classification
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/detr-resnet-50',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Hugging Face Transport Model error:', error);
    throw new Error('Failed to analyze image with transport model');
  }
}

/**
 * Classify travel mode using Hugging Face models
 */
async function classifyTravelMode(imagePath) {
  let results = {};
  let confidence = 0;
  let detectedMode = 'unknown';

  // Try primary Hugging Face model first
  try {
    const hfResult = await analyzeImageWithHuggingFace(imagePath);
    if (hfResult && hfResult.length > 0) {
      const topPredictions = hfResult.slice(0, 10); // Get top 10 predictions
      
      // Calculate scores for each travel mode
      const scores = {};
      Object.keys(TRAVEL_MODE_LABELS).forEach(mode => {
        scores[mode] = 0;
      });

      topPredictions.forEach(prediction => {
        const labelText = prediction.label.toLowerCase();
        Object.entries(TRAVEL_MODE_LABELS).forEach(([mode, keywords]) => {
          keywords.forEach(keyword => {
            if (labelText.includes(keyword.toLowerCase())) {
              scores[mode] += prediction.score || 0.5;
            }
          });
        });
      });

      // Find best match
      const bestMatch = Object.entries(scores).reduce((a, b) => 
        scores[a[0]] > scores[b[0]] ? a : b
      );

      if (bestMatch[1] > 0.2) {
        detectedMode = bestMatch[0];
        confidence = bestMatch[1];
        results.huggingFace = {
          detectedMode,
          confidence,
          predictions: topPredictions.slice(0, 5),
          allScores: scores
        };
      }
    }
  } catch (error) {
    console.error('Primary Hugging Face model failed:', error.message);
  }

  // Try transport-specific model if primary failed or confidence is low
  if (confidence < 0.4) {
    try {
      const transportResult = await analyzeImageWithTransportModel(imagePath);
      if (transportResult && transportResult.length > 0) {
        const topPredictions = transportResult.slice(0, 10);
        
        // Calculate scores for each travel mode
        const scores = {};
        Object.keys(TRAVEL_MODE_LABELS).forEach(mode => {
          scores[mode] = 0;
        });

        topPredictions.forEach(prediction => {
          const labelText = prediction.label.toLowerCase();
          Object.entries(TRAVEL_MODE_LABELS).forEach(([mode, keywords]) => {
            keywords.forEach(keyword => {
              if (labelText.includes(keyword.toLowerCase())) {
                scores[mode] += prediction.score || 0.5;
              }
            });
          });
        });

        const bestMatch = Object.entries(scores).reduce((a, b) => 
          scores[a[0]] > scores[b[0]] ? a : b
        );

        if (bestMatch[1] > confidence) {
          detectedMode = bestMatch[0];
          confidence = bestMatch[1];
          results.transportModel = {
            detectedMode,
            confidence,
            predictions: topPredictions.slice(0, 5),
            allScores: scores
          };
        }
      }
    } catch (error) {
      console.error('Transport model failed:', error.message);
    }
  }

  return {
    detectedMode,
    confidence,
    results,
    isReliable: confidence > 0.5
  };
}

/**
 * Verify if detected travel mode is green
 */
function verifyGreenTravel(detectedMode, confidence) {
  const greenModes = ['bike', 'walk', 'train', 'bus'];
  const isGreenMode = greenModes.includes(detectedMode);
  
  return {
    isGreenTravel: isGreenMode,
    reason: isGreenMode 
      ? `Detected green travel mode: ${detectedMode} (confidence: ${(confidence * 100).toFixed(1)}%)`
      : `Detected non-green mode: ${detectedMode} (confidence: ${(confidence * 100).toFixed(1)}%)`,
    confidence
  };
}

/**
 * Comprehensive travel proof analysis
 */
async function analyzeTravelProof(imagePath) {
  try {
    console.log('Starting Hugging Face travel proof analysis...');
    
    // Classify travel mode using Hugging Face models
    const classification = await classifyTravelMode(imagePath);
    console.log('Travel mode classification:', classification);
    
    // Verify green travel
    const greenVerification = verifyGreenTravel(classification.detectedMode, classification.confidence);
    console.log('Green travel verification:', greenVerification);
    
    // Determine if proof should be auto-approved
    const autoApproval = shouldAutoApprove(classification, greenVerification);
    
    return {
      detectedTravelMode: classification.detectedMode,
      modeConfidence: classification.confidence,
      isGreenTravel: greenVerification.isGreenTravel,
      overallConfidence: classification.confidence,
      reason: greenVerification.reason,
      autoApproved: autoApproval.autoApprove,
      autoApprovalReason: autoApproval.reason,
      analysis: {
        results: classification.results,
        isReliable: classification.isReliable
      },
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error in travel proof analysis:', error);
    throw new Error('Failed to analyze travel proof image');
  }
}

/**
 * Determine if proof should be automatically approved
 */
function shouldAutoApprove(classification, greenVerification) {
  const { detectedMode, confidence, isReliable } = classification;
  const { isGreenTravel } = greenVerification;
  
  // Lower confidence threshold for Hugging Face models
  const confidenceThreshold = 0.6;
  
  const autoApprove = isGreenTravel && confidence >= confidenceThreshold && isReliable;
  
  return {
    autoApprove,
    reason: autoApprove 
      ? `High confidence (${(confidence * 100).toFixed(1)}%) in green travel detection`
      : `Insufficient confidence (${(confidence * 100).toFixed(1)}% < ${(confidenceThreshold * 100)}%) or non-green travel`,
    confidence,
    threshold: confidenceThreshold
  };
}

/**
 * Validate image quality
 */
async function validateImageQuality(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    // Check image dimensions
    if (metadata.width < 200 || metadata.height < 200) {
      return {
        isValid: false,
        reason: 'Image too small (minimum 200x200 pixels for AI analysis)'
      };
    }
    
    // Check file size
    const stats = await fs.promises.stat(imagePath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      return {
        isValid: false,
        reason: 'Image file too large (maximum 10MB)'
      };
    }
    
    return {
      isValid: true,
      dimensions: { width: metadata.width, height: metadata.height },
      fileSize: stats.size
    };
    
  } catch (error) {
    return {
      isValid: false,
      reason: 'Invalid image file'
    };
  }
}

module.exports = {
  analyzeTravelProof,
  validateImageQuality,
  classifyTravelMode,
  verifyGreenTravel
}; 