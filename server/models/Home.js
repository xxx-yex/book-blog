const mongoose = require('mongoose');

const HomeSchema = new mongoose.Schema({
  name: { type: String, default: 'ObjectX-不知名程序员' },
  subtitle: { type: String, default: '前端 & AI & 编辑器' },
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
    runningTime: { type: String, default: '381天13时37分' },
    icp: { type: String, default: '京ICP备2023017462号' }
  },
  updatedAt: { type: Date, default: Date.now }
});

HomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Home', HomeSchema);

