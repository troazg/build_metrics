const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const BuildResultSchema = new Schema({
  passed: {
    type: Boolean,
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  build: {
    type: Schema.Types.ObjectId,
    ref:'builds',
    required: true
  },
  link: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Create collection and add schema
mongoose.model('buildResults', BuildResultSchema);