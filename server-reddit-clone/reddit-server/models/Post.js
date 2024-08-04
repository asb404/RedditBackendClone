const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define Comment Schema
const CommentSchema = require('./Comment');

// Define Post Schema
const PostSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subreddit: {
    type: Schema.Types.ObjectId,
    ref: 'Subreddit'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, { timestamps: true });

// Middleware to update the updatedAt field
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add an upvote
PostSchema.methods.upvote = function() {
  this.upvotes += 1;
  return this.save();
};

// Method to add a comment
PostSchema.methods.addComment = function(comment) {
  this.comments.push(comment);
  return this.save();
};

module.exports = mongoose.model('Post', PostSchema);
