const axios = require('axios');
const Concert = require('../models/concertModel');
const Artist = require('../models/artistModel');

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

// Refactored to properly link Artists and Concerts
const mapConcertData = async (event) => {
  const venue = event._embedded?.venues?.[0];
  const attraction = event._embedded?.attractions?.[0];

  if (!venue || !venue.city || !venue.location || !attraction) {
    return null; // Skip events without necessary data
  }

  // Find or create the artist in our database
  let artist = await Artist.findOne({ name: attraction.name });
  if (!artist) {
    artist = await Artist.create({
      name: attraction.name,
      genre: event.classifications?.[0]?.genre?.name || 'N/A',
      profileImage: attraction.images?.find(img => img.ratio === '16_9')?.url,
    });
  }

  return {
    externalId: event.id,
    name: event.name,
    artist: artist._id, // Use the MongoDB ObjectId reference
    date: event.dates.start.dateTime || event.dates.start.localDate,
    location: venue.name,
    venue: venue.name,
    city: venue.city.name,
    country: venue.country.countryCode,
    geoCoordinates: {
      lat: parseFloat(venue.location.latitude),
      lng: parseFloat(venue.location.longitude)
    }
  };
};

exports.fetchAndSaveConcerts = async (city = 'London', size = 20) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        city,
        size,
        classificationName: 'music',
        sort: 'date,asc'
      }
    });

    const events = response.data._embedded?.events || [];
    if (events.length === 0) {
      return { insertedCount: 0, skippedCount: 0, concerts: [] };
    }

    // Use Promise.all to handle async mapping
    const mappedConcerts = (await Promise.all(events.map(mapConcertData))).filter(Boolean);

    // Use insertMany with ordered:false to insert all valid documents and ignore duplicates
    let insertedResult;
    try {
      insertedResult = await Concert.insertMany(mappedConcerts, { ordered: false });
    } catch (err) {
      // This catch block handles the specific case where insertMany fails due to duplicate key errors.
      // The 'writeErrors' property contains details about which documents failed.
      if (err.code === 11000 && err.writeErrors) {
        const successfulInsertions = err.insertedDocs || [];
        return {
          insertedCount: successfulInsertions.length,
          skippedCount: mappedConcerts.length - successfulInsertions.length,
          concerts: successfulInsertions
        };
      }
      // Re-throw other errors
      throw err;
    }
    
    return { 
      insertedCount: insertedResult.length,
      skippedCount: mappedConcerts.length - insertedResult.length,
      concerts: insertedResult 
    };

  } catch (err) {
    console.error('Concert fetch/save failed:', err.message);
    throw new Error('Concert fetch/save failed: ' + err.message);
  }
};