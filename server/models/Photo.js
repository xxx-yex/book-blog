const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  url: { type: String, required: true }, // 图片URL
  thumbnailUrl: { type: String }, // 缩略图URL
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PhotoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Photo', PhotoSchema);

