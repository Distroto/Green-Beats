const TravelProof = require('../models/travelProofModel');
const User = require('../models/userModel');
const Concert = require('../models/concertModel');
const { haversineDistance, getEmissionFactor } = require('../services/emissionCalculator');
const { assignRewardsToUser } = require('../services/rewardEngine');
const { 
  analyzeTravelProof, 
  validateImageQuality 
} = require('../services/travelClassificationService');

// Upload travel proof with image
exports.uploadTravelProof = async (req, res) => {
  try {
    const { 
      userId, 
      concertId, 
      travelMode, 
      originLat, 
      originLng, 
      proofDescription 
    } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Proof image is required' });
    }

    // Validate image quality
    const imageValidation = await validateImageQuality(req.file.path);
    if (!imageValidation.isValid) {
      return res.status(400).json({ error: imageValidation.reason });
    }

    // Validate concert exists
    const concert = await Concert.findById(concertId);
    if (!concert || !concert.geoCoordinates) {
      return res.status(404).json({ error: 'Concert not found or missing coordinates' });
    }

    // Calculate distance and emissions
    const destination = concert.geoCoordinates;
    const distance = haversineDistance(originLat, originLng, destination.lat, destination.lng);
    const factor = getEmissionFactor(travelMode);
    const emissions = +(distance * factor).toFixed(2);

    // AI Analysis of the image using pre-trained models
    let aiAnalysis = null;
    
    try {
      aiAnalysis = await analyzeTravelProof(req.file.path);
      
      console.log('AI Analysis completed:', {
        detectedMode: aiAnalysis.detectedTravelMode,
        userClaimedMode: travelMode,
        confidence: aiAnalysis.overallConfidence,
        autoApproved: aiAnalysis.autoApproved
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Continue without AI analysis - will require manual review
    }

    // Determine if this is green travel based on AI analysis or user input
    let isGreenTravel = ['walk', 'bike', 'train', 'bus'].includes(travelMode);
    let pointsEarned = 0;
    let verificationStatus = 'pending';
    
    if (aiAnalysis) {
      // Use AI analysis to verify green travel
      isGreenTravel = aiAnalysis.isGreenTravel;
      
      // Auto-approve if AI is confident and detects green travel
      if (aiAnalysis.autoApproved) {
        verificationStatus = 'auto_approved';
      }
    }
    
    if (isGreenTravel) {
      // Base points for green travel
      pointsEarned = Math.round(emissions * 2);
      
      // Bonus points for zero-emission travel
      if (travelMode === 'walk' || travelMode === 'bike') {
        pointsEarned = Math.max(5, pointsEarned + 5); // Minimum 5 points for zero-emission
      }
    }

    // Create travel proof with AI analysis
    const travelProof = await TravelProof.create({
      userId,
      concertId,
      travelMode,
      originLat,
      originLng,
      distanceKm: distance,
      emissionsKgCO2: emissions,
      proofImage: req.file.path,
      proofDescription,
      pointsEarned,
      isGreenTravel,
      verificationStatus,
      aiAnalysis: aiAnalysis ? {
        ...aiAnalysis,
        analyzedAt: new Date()
      } : undefined
    });

    res.status(201).json({
      message: 'Travel proof uploaded successfully',
      travelProof: {
        id: travelProof._id,
        travelMode,
        distanceKm: distance,
        emissionsKgCO2: emissions,
        isGreenTravel,
        pointsEarned,
        verificationStatus: travelProof.verificationStatus,
        aiAnalysis: aiAnalysis ? {
          detectedTravelMode: aiAnalysis.detectedTravelMode,
          modeConfidence: aiAnalysis.modeConfidence,
          overallConfidence: aiAnalysis.overallConfidence,
          autoApproved: aiAnalysis.autoApproved,
          reason: aiAnalysis.reason,
          autoApprovalReason: aiAnalysis.autoApprovalReason
        } : null
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to upload travel proof', details: err.message });
  }
};

// Get user's travel proofs
exports.getUserTravelProofs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = { userId };
    if (status) {
      query.verificationStatus = status;
    }

    const proofs = await TravelProof.find(query)
      .populate({
        path: 'concertId',
        select: 'name date location artist',
        populate: {
          path: 'artist',
          select: 'name'
        }
      })
      .sort({ timestamp: -1 });

    res.json(proofs);

  } catch (err) {
    res.status(500).json({ error: 'Failed to get travel proofs', details: err.message });
  }
};



// Get AI analysis statistics
exports.getAIAnalysisStats = async (req, res) => {
  try {
    const stats = await TravelProof.aggregate([
      {
        $match: {
          'aiAnalysis.detectedTravelMode': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalAnalyzed: { $sum: 1 },
          autoApproved: {
            $sum: {
              $cond: [{ $eq: ['$verificationStatus', 'auto_approved'] }, 1, 0]
            }
          },
          averageConfidence: { $avg: '$aiAnalysis.overallConfidence' },
          modeAccuracy: {
            $push: {
              userMode: '$travelMode',
              detectedMode: '$aiAnalysis.detectedTravelMode',
              confidence: '$aiAnalysis.overallConfidence'
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalAnalyzed: 0,
        autoApproved: 0,
        averageConfidence: 0,
        accuracyRate: 0
      });
    }

    const stat = stats[0];
    const modeAccuracy = stat.modeAccuracy.filter(item => 
      item.userMode === item.detectedMode
    ).length;
    const accuracyRate = (modeAccuracy / stat.totalAnalyzed) * 100;

    res.json({
      totalAnalyzed: stat.totalAnalyzed,
      autoApproved: stat.autoApproved,
      averageConfidence: +stat.averageConfidence.toFixed(2),
      accuracyRate: +accuracyRate.toFixed(1),
      autoApprovalRate: +((stat.autoApproved / stat.totalAnalyzed) * 100).toFixed(1)
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to get AI analysis stats', details: err.message });
  }
}; 