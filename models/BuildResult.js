const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const BuildResultSchema = new Schema({
  passed: {
    type: Boolean,
    required: true
  },
  runtime: {
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
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Create collection and add schema
mongoose.model('buildResults', BuildResultSchema);