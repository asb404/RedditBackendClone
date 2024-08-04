const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
require('dotenv').config();
const postRoutes = require('./routes/RedditRoutes');

const app = express();
const port = process.env.PORT || 3000;
const dbURI = process.env.MONGODB_URI;
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
};

app.use(cors(corsOptions));

// Connect to MongoDB
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.use(postRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
