const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-notes')
.then(() => console.log('MongoDB 连接成功'))
.catch(err => console.error('MongoDB 连接失败:', err));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/home', require('./routes/home'));
app.use('/api/bookmarks', require('./routes/bookmarks'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

