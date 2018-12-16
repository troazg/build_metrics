const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const TestResultSchema = new Schema({
  passed: {
    type: Boolean,
    required: true
  },
  runtime: {
    type: Number,
    required: true
  },
  test: {
    type: Schema.Types.ObjectId,
    ref:'tests',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  expections: [{
    errorText: {
      type: String
    }
  }]
});

// Create collection and add schema
mongoose.model('testResults', TestResultSchema, 'testResults');