const mongoose = require('mongoose');

const travelProofSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  concertId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Concert', 
    required: true 
  },
  travelMode: { 
    type: String, 
    enum: ['car', 'train', 'flight', 'bus', 'walk', 'bike'], 
    required: true 
  },
  originLat: { type: Number, required: true },
  originLng: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  emissionsKgCO2: { type: Number, required: true },
  
  // Proof verification
  proofImage: { type: String, required: true }, // URL to uploaded image
  proofDescription: { type: String, required: true }, // User's description
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'auto_approved', 'rejected'], 
    default: 'pending' 
  },
  
  // AI Analysis Results
  aiAnalysis: {
    detectedTravelMode: { type: String },
    modeConfidence: { type: Number },
    isGreenTravel: { type: Boolean },
    greenConfidence: { type: Number },
    overallConfidence: { type: Number },
    reason: { type: String },
    autoApproved: { type: Boolean, default: false },
    analysis: {
      predictions: [{ 
        className: String, 
        probability: Number 
      }],
      modeScores: { type: Map, of: Number },
      greenIndicators: [String]
    },
    analyzedAt: { type: Date }
  },
  
  // Points calculation
  pointsEarned: { type: Number, default: 0 },
  isGreenTravel: { type: Boolean, default: false }, // Only true for walk, bike, train, bus
  
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('TravelProof', travelProofSchema); 