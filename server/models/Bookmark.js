const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  icon: String, // 图标URL或图标名称
  category: { type: String, required: true }, // 分类名称
  order: { type: Number, default: 0 }, // 排序
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BookmarkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Bookmark', BookmarkSchema);

