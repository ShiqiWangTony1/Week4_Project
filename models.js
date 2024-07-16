const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = new Schema({
  track_id: { type: String, unique: true },
  title: String,
  artist: [String],
  album: String,
  album_id: String,
  genre: [String],
  length: Number,
  track_number: Number,
  quality: String,
  file: String
});

const Track = mongoose.model('Track', trackSchema);

module.exports = { Track };
