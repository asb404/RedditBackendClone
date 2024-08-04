const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/user');
const Subreddit = require('../models/Subreddit');


// Get all posts (just for testing purposes)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new post(just for testing purposes)
router.post('/api/posts', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newPost = new Post({ title, content, author });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all posts from a specific subreddit, ordered by recency
router.get('/subreddit/:subredditId/posts', async (req, res) => {
  try {
    const subreddit = await Subreddit.findById(req.params.subredditId).populate({
      path: 'posts',
      options: { sort: { createdAt: -1 } }
    });

    if (!subreddit) return res.status(404).json({ message: 'Subreddit not found' });

    res.json(subreddit.posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new post in a specific subreddit and updates both the subreddit and user’s post lists in a single transaction.
router.post('/subreddit/:subredditId/posts', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const subreddit = await Subreddit.findById(req.params.subredditId).session(session);
    if (!subreddit) return res.status(404).json({ message: 'Subreddit not found' });

    const { title, content, author } = req.body;
    const post = new Post({ title, content, author, subreddit: req.params.subredditId });
    const newPost = await post.save({ session });
    
    subreddit.posts.push(newPost._id);
    await subreddit.save({ session });

    const user = await User.findById(author).session(session);
    if (user) {
      user.posts.push(newPost._id);
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json(newPost);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: err.message });
  }
});

//Directly retrieves posts from the database, ensuring efficient querying and populating relevant fields.
router.get('/subreddit/:subredditId/posts', async (req, res) => {
  try {
    const posts = await Post.find({ subreddit: req.params.subredditId }).sort({ createdAt: -1 }).populate('author', 'username');
    
    if (!posts) return res.status(404).json({ message: 'No posts found' });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Upvote a post
router.post('/posts/:postId/upvote', async (req, res) => {
  try {
    const { userId } = req.body;
    const postId = req.params.postId;

    // Check if the upvote already exists
    const existingUpvote = await Upvote.findOne({ user: userId, post: postId });
    if (existingUpvote) {
      return res.status(400).json({ message: 'Already upvoted this post' });
    }

    // Create a new upvote record
    const newUpvote = new Upvote({ user: userId, post: postId });
    await newUpvote.save();

    // Update the post's upvote count
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.upvotes += 1;
    await post.save();

    res.status(201).json({ message: 'Upvote recorded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a comment to a post
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.addComment({ user: req.body.user, content: req.body.content });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// To get a user's profile with subscribed subreddits and received upvotes
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('subscribedSubreddits', 'name')
      .populate({
        path: 'upvotes',
        select: 'title',
        populate: { path: 'author', select: 'username' }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      username: user.username,
      email: user.email,
      subscribedSubreddits: user.subscribedSubreddits,
      upvotesReceived: user.upvotes
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Subscribe or unsubscribe from a subreddit
router.post('/users/:userId/subscription', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const subredditId = req.body.subredditId;
    const isSubscribing = req.body.action === 'subscribe';

    if (isSubscribing) {
      if (!user.subscribedSubreddits.includes(subredditId)) {
        user.subscribedSubreddits.push(subredditId);
        await user.save();
        res.json({ message: 'Subscribed successfully' });
      } else {
        res.status(400).json({ message: 'Already subscribed to this subreddit' });
      }
    } else {
      if (user.subscribedSubreddits.includes(subredditId)) {
        user.subscribedSubreddits.pull(subredditId);
        await user.save();
        res.json({ message: 'Unsubscribed successfully' });
      } else {
        res.status(400).json({ message: 'Not subscribed to this subreddit' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all subreddits
router.get('/subreddits', async (req, res) => {
  try {
    const subreddits = await Subreddit.find().sort({ createdAt: -1 });
    res.json(subreddits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new subreddit
router.post('/subreddits', async (req, res) => {
  try {
    const { name, description, creator } = req.body;
    const subreddit = new Subreddit({ name, description, creator });

    const newSubreddit = await subreddit.save();
    res.status(201).json(newSubreddit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a specific subreddit by ID
router.get('/subreddits/:id', async (req, res) => {
  try {
    const subreddit = await Subreddit.findById(req.params.id)
      .populate('creator', 'username')
      .populate({
        path: 'posts',
        select: 'title content author createdAt',
        populate: { path: 'author', select: 'username' }
      });

    if (!subreddit) return res.status(404).json({ message: 'Subreddit not found' });

    res.json(subreddit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all posts upvoted by a user
router.get('/users/:userId/upvoted-posts', async (req, res) => {
  try {
    const userId = req.params.userId;
    const upvotes = await Upvote.find({ user: userId }).populate('post');
    
    const posts = upvotes.map(upvote => upvote.post);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
