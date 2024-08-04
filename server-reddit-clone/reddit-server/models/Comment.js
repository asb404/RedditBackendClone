const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define Comment Schema
const CommentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

module.exports = CommentSchema;
