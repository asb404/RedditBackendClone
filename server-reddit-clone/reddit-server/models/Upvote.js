const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define Upvote Schema
const UpvoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Upvote', UpvoteSchema);
