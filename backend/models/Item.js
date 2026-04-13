const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Item type (lost/found) is required'],
  },
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Clothing', 'Accessories', 'Documents', 'Keys', 'Bags', 'Sports', 'Books', 'Jewellery', 'Other'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  imageUrl: { type: String, default: null },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contactName:  { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  views: { type: Number, default: 0 },
}, { timestamps: true });

// Text search index
itemSchema.index({ title: 'text', description: 'text', location: 'text' });
itemSchema.index({ type: 1, status: 1, category: 1 });

module.exports = mongoose.model('Item', itemSchema);
