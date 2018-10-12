const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const BuildSchema = new Schema({
  name:{
    type: String,
    required: true
  }
});

// Create collection and add schema
mongoose.model('builds', BuildSchema);