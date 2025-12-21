const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());

// 添加全局日志中间件来追踪所有请求
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    console.log('=== 捕获到 /uploads 请求 ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('Query:', req.query);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 提供上传的图片访问
const uploadsPath = path.join(__dirname, 'uploads');
console.log('静态文件服务路径:', uploadsPath);
console.log('uploads目录是否存在:', fs.existsSync(uploadsPath));

// 手动处理上传文件的请求（放在所有其他路由之前）
app.use('/uploads', (req, res, next) => {
  console.log('=== 进入 /uploads 路由处理 ===');
  console.log('req.method:', req.method);
  console.log('req.path:', req.path);
  console.log('req.originalUrl:', req.originalUrl);
  
  // 在 app.use 中，req.path 是相对于挂载点的路径
  // 例如：/uploads/home/file.jpg -> req.path 是 /home/file.jpg
  // 需要去掉开头的 /
  const requestedPath = req.path.startsWith('/') ? req.path.substring(1) : req.path;
  const filePath = path.join(uploadsPath, requestedPath);
  
  console.log('提取的路径:', requestedPath);
  console.log('查找文件路径:', filePath);
  console.log('uploadsPath:', uploadsPath);
  
  // 安全检查：确保路径在 uploads 目录内
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsPath = path.resolve(uploadsPath);
  console.log('resolvedPath:', resolvedPath);
  console.log('resolvedUploadsPath:', resolvedUploadsPath);
  
  if (!resolvedPath.startsWith(resolvedUploadsPath)) {
    console.log('安全错误: 路径不在 uploads 目录内');
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // 只处理 GET 请求
  if (req.method !== 'GET') {
    console.log('不是 GET 请求，跳过');
    return next();
  }
  
  console.log('检查文件是否存在...');
  if (fs.existsSync(filePath)) {
    console.log('文件存在！');
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      console.log('是文件，准备发送...');
      console.log('文件大小:', stats.size);
      res.sendFile(path.resolve(filePath), (err) => {
        if (err) {
          console.error('发送文件错误:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error sending file', message: err.message });
          }
        } else {
          console.log('文件发送成功');
        }
      });
    } else {
      console.log('路径不是文件');
      res.status(404).json({ error: 'Not a file' });
    }
  } else {
    console.log('文件不存在！');
    console.log('尝试列出目录内容...');
    const dirPath = path.dirname(filePath);
    if (fs.existsSync(dirPath)) {
      try {
        const files = fs.readdirSync(dirPath);
        console.log('目录存在，文件列表:', files);
      } catch (e) {
        console.log('无法读取目录:', e.message);
      }
    } else {
      console.log('目录也不存在:', dirPath);
    }
    res.status(404).json({ 
      error: 'File not found', 
      requestedPath: requestedPath,
      filePath: filePath,
      uploadsPath: uploadsPath,
      resolvedPath: resolvedPath,
      reqPath: req.path,
      originalUrl: req.originalUrl
    });
  }
});

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
app.use('/api/events', require('./routes/events'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 调试路由 - 检查上传目录
app.get('/debug/uploads', (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');
  const homePath = path.join(uploadsPath, 'home');
  try {
    const uploadsExists = fs.existsSync(uploadsPath);
    const homeExists = fs.existsSync(homePath);
    const files = homeExists ? fs.readdirSync(homePath) : [];
    
    res.json({
      uploadsPath,
      homePath,
      uploadsExists,
      homeExists,
      fileCount: files.length,
      files: files.slice(0, 10), // 只显示前10个文件
      __dirname
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 调试路由 - 检查特定文件是否存在
app.get('/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'home', filename);
  const fileExists = fs.existsSync(filePath);
  
  try {
    const stats = fileExists ? fs.statSync(filePath) : null;
    res.json({
      filename,
      filePath,
      exists: fileExists,
      size: stats ? stats.size : null,
      modified: stats ? stats.mtime : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

