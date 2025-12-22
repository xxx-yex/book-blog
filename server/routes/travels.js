const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Travel = require('../models/Travel');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/travels');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// 获取所有旅行日记（按日期倒序）
router.get('/', async (req, res) => {
  try {
    const travels = await Travel.find()
      .sort({ date: -1 });
    
    res.json(travels);
  } catch (error) {
    console.error('获取旅行日记错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个旅行日记
router.get('/:id', async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id);
    
    if (!travel) {
      return res.status(404).json({ message: '旅行日记不存在' });
    }
    
    res.json(travel);
  } catch (error) {
    console.error('获取旅行日记错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建旅行日记（需要认证，支持多张图片上传）
router.post('/', authMiddleware, upload.array('images', 20), async (req, res) => {
  try {
    const { title, location, rating, date, weather, transport, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: '标题和日期不能为空' });
    }

    // 处理上传的图片
    const imageUrls = req.files ? req.files.map(file => `/uploads/travels/${file.filename}`) : [];

    const travel = new Travel({
      title,
      location: location || '',
      rating: rating ? parseInt(rating) : 5,
      date: new Date(date),
      weather: weather || '',
      transport: transport || '',
      description: description || '',
      images: imageUrls,
    });

    await travel.save();
    
    res.status(201).json(travel);
  } catch (error) {
    console.error('创建旅行日记错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 更新旅行日记（需要认证，支持添加新图片）
router.put('/:id', authMiddleware, upload.array('images', 20), async (req, res) => {
  try {
    const { title, location, rating, date, weather, transport, description, existingImages } = req.body;
    
    const travel = await Travel.findById(req.params.id);
    
    if (!travel) {
      return res.status(404).json({ message: '旅行日记不存在' });
    }

    // 处理图片：保留现有图片 + 添加新上传的图片
    let imageUrls = [];
    if (existingImages) {
      // 如果传入了现有图片列表，使用它
      imageUrls = Array.isArray(existingImages) ? existingImages : JSON.parse(existingImages);
    } else {
      // 否则保留原有图片
      imageUrls = travel.images || [];
    }

    // 添加新上传的图片
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/uploads/travels/${file.filename}`);
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    const updateData = {
      title,
      location: location !== undefined ? location : travel.location,
      rating: rating ? parseInt(rating) : travel.rating,
      weather: weather !== undefined ? weather : travel.weather,
      transport: transport !== undefined ? transport : travel.transport,
      description: description !== undefined ? description : travel.description,
      images: imageUrls,
      updatedAt: Date.now()
    };

    if (date) {
      updateData.date = new Date(date);
    }

    const updatedTravel = await Travel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedTravel);
  } catch (error) {
    console.error('更新旅行日记错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除旅行日记（需要认证）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id);
    
    if (!travel) {
      return res.status(404).json({ message: '旅行日记不存在' });
    }

    // 删除关联的图片文件
    if (travel.images && travel.images.length > 0) {
      travel.images.forEach(imageUrl => {
        const filePath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Travel.findByIdAndDelete(req.params.id);
    
    res.json({ message: '旅行日记删除成功' });
  } catch (error) {
    console.error('删除旅行日记错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量删除旅行日记（需要认证）
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供要删除的旅行日记ID数组' });
    }

    const travels = await Travel.find({ _id: { $in: ids } });
    
    // 删除关联的图片文件
    travels.forEach(travel => {
      if (travel.images && travel.images.length > 0) {
        travel.images.forEach(imageUrl => {
          const filePath = path.join(__dirname, '..', imageUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });

    const result = await Travel.deleteMany({ _id: { $in: ids } });
    res.json({ 
      message: '批量删除成功',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('批量删除旅行日记错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

