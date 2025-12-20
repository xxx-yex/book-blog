const mongoose = require('mongoose');

const HomeSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  introduction: { type: String, default: '' },
  avatarImage: { type: String }, // 头像URL
  bannerImage: { type: String }, // Banner背景图URL
  socialLinks: [{
    name: String,
    url: String,
    icon: String
  }],
  education: [{
    title: String,
    period: String
  }],
  work: [{
    title: String,
    period: String
  }],
  stats: {
    likes: { type: Number, default: 166 },
    views: { type: Number, default: 4057 },
    online: { type: Number, default: 1 },
    followers: { type: Number, default: 3 }
  },
  siteInfo: {
    runningTime: { type: String, default: '' },
    icp: { type: String, default: '' }
  },
  updatedAt: { type: Date, default: Date.now }
});

HomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Home', HomeSchema);

