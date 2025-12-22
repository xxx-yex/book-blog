const mongoose = require('mongoose');

const TravelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, default: '' },
  rating: { type: Number, default: 5, min: 1, max: 5 }, // 星级评分 1-5
  date: { type: Date, required: true },
  weather: { type: String, default: '' }, // 天气，如"晴天"
  transport: { type: String, default: '' }, // 交通工具，如"飞机0"
  description: { type: String, default: '' },
  images: [{ type: String }], // 图片URL数组
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TravelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Travel', TravelSchema);

