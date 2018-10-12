const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const TestSchema = new Schema({
  rspecID: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  build: {
    type: Schema.Types.ObjectId,
    ref:'builds',
    required: true
  }
});

// Create collection and add schema
mongoose.model('tests', TestSchema);