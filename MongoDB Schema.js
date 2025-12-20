// models/Article.js
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // 富文本 HTML 内容
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // 关联分组
  tags: [String],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// models/Category.js
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: String, // 分组图标
  sortOrder: { type: Number, default: 0 } // 排序
});

// models/User.js
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // 需加密存储
  avatar: String,
  role: { type: String, default: 'admin' } // 简单单用户系统
});