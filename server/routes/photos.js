const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/photos');
const thumbnailDir = path.join(__dirname, '../uploads/photos/thumbnails');

[uploadDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（jpeg, jpg, png, gif, webp）'));
    }
  }
});

// 获取所有照片
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 });
    
    // 过滤掉文件不存在的照片
    const validPhotos = [];
    for (const photo of photos) {
      const filePath = path.join(__dirname, '..', photo.url);
      if (fs.existsSync(filePath)) {
        validPhotos.push(photo);
      } else {
        console.log(`照片文件不存在，已跳过: ${photo.url}`);
      }
    }
    
    res.json(validPhotos);
  } catch (error) {
    console.error('获取照片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个照片
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }
    
    res.json(photo);
  } catch (error) {
    console.error('获取照片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传照片（需要认证）
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const { title, description, tags } = req.body;
    const fileUrl = `/uploads/photos/${req.file.filename}`;
    
    // 这里可以添加生成缩略图的逻辑
    // 暂时使用原图作为缩略图
    const thumbnailUrl = fileUrl;

    const photo = new Photo({
      title: title || req.file.originalname,
      description: description || '',
      url: fileUrl,
      thumbnailUrl: thumbnailUrl,
      tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : [],
    });

    await photo.save();
    
    res.status(201).json(photo);
  } catch (error) {
    console.error('上传照片错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 更新照片信息（需要认证）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { title, description, tags, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }

    res.json(photo);
  } catch (error) {
    console.error('更新照片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除照片（需要认证）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }

    // 删除文件
    const filePath = path.join(__dirname, '..', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除缩略图
    if (photo.thumbnailUrl) {
      const thumbnailPath = path.join(__dirname, '..', photo.thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    await Photo.findByIdAndDelete(req.params.id);
    
    res.json({ message: '照片删除成功' });
  } catch (error) {
    console.error('删除照片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量删除照片（需要认证）
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供要删除的照片ID数组' });
    }

    const photos = await Photo.find({ _id: { $in: ids } });
    
    // 删除文件
    photos.forEach(photo => {
      const filePath = path.join(__dirname, '..', photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (photo.thumbnailUrl) {
        const thumbnailPath = path.join(__dirname, '..', photo.thumbnailUrl);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
    });

    const result = await Photo.deleteMany({ _id: { $in: ids } });
    res.json({ 
      message: '批量删除成功',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('批量删除照片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

