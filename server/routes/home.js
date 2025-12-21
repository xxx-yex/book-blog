const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Home = require('../models/Home');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/home');
console.log('上传目录路径:', uploadDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('已创建上传目录:', uploadDir);
} else {
  console.log('上传目录已存在:', uploadDir);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// 获取首页内容
router.get('/', async (req, res) => {
  try {
    const home = await Home.findOne();
    if (!home) {
      // 如果没有数据，返回空对象而不是创建默认数据
      return res.json({
        name: '',
        subtitle: '',
        introduction: '',
        avatarImage: null,
        bannerImage: null,
        socialLinks: [],
        education: [],
        work: [],
        stats: {},
        siteInfo: {}
      });
    }
    res.json(home);
  } catch (error) {
    console.error('获取首页内容错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新首页内容（需要认证）
const uploadMiddleware = upload.fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'avatarImage', maxCount: 1 }
]);

router.put('/', authMiddleware, (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('Multer上传错误:', err);
      return res.status(400).json({ message: err.message || '文件上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('收到上传请求');
    console.log('req.files:', JSON.stringify(req.files, null, 2));
    console.log('req.body keys:', Object.keys(req.body));
    
    let home = await Home.findOne();
    
    if (!home) {
      home = new Home();
    }

    const { name, subtitle, introduction, socialLinks, education, work, stats, siteInfo } = req.body;

    // 更新基本信息
    if (name !== undefined) home.name = name;
    if (subtitle !== undefined) home.subtitle = subtitle;
    if (introduction !== undefined) home.introduction = introduction;

    // 处理头像图片
    if (req.files && req.files['avatarImage'] && req.files['avatarImage'][0]) {
      const avatarFile = req.files['avatarImage'][0];
      console.log('处理头像图片:', avatarFile.filename);
      console.log('头像文件路径:', path.join(uploadDir, avatarFile.filename));
      
      // 检查文件是否真的存在
      const avatarFilePath = path.join(uploadDir, avatarFile.filename);
      if (fs.existsSync(avatarFilePath)) {
        console.log('头像文件已成功保存到磁盘');
      } else {
        console.error('警告: 头像文件不存在于磁盘:', avatarFilePath);
      }
      
      // 删除旧头像
      if (home.avatarImage) {
        const oldImagePath = path.join(__dirname, '..', home.avatarImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('已删除旧头像:', oldImagePath);
        }
      }
      home.avatarImage = `/uploads/home/${avatarFile.filename}`;
      console.log('设置头像路径:', home.avatarImage);
    }

    // 处理Banner图片
    if (req.files && req.files['bannerImage'] && req.files['bannerImage'][0]) {
      const bannerFile = req.files['bannerImage'][0];
      console.log('处理Banner图片:', bannerFile.filename);
      console.log('Banner文件路径:', path.join(uploadDir, bannerFile.filename));
      
      // 检查文件是否真的存在
      const bannerFilePath = path.join(uploadDir, bannerFile.filename);
      if (fs.existsSync(bannerFilePath)) {
        console.log('Banner文件已成功保存到磁盘');
      } else {
        console.error('警告: Banner文件不存在于磁盘:', bannerFilePath);
      }
      
      // 删除旧图片
      if (home.bannerImage) {
        const oldImagePath = path.join(__dirname, '..', home.bannerImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('已删除旧Banner:', oldImagePath);
        }
      }
      home.bannerImage = `/uploads/home/${bannerFile.filename}`;
      console.log('设置Banner路径:', home.bannerImage);
    }

    // 处理社交链接
    if (socialLinks) {
      try {
        home.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      } catch (e) {
        home.socialLinks = [];
      }
    }

    // 处理教育经历
    if (education) {
      try {
        home.education = typeof education === 'string' ? JSON.parse(education) : education;
      } catch (e) {
        home.education = [];
      }
    }

    // 处理工作经历
    if (work) {
      try {
        home.work = typeof work === 'string' ? JSON.parse(work) : work;
      } catch (e) {
        home.work = [];
      }
    }

    // 处理统计数据
    if (stats) {
      try {
        home.stats = typeof stats === 'string' ? JSON.parse(stats) : stats;
      } catch (e) {
        // 保持默认值
      }
    }

    // 处理网站信息
    if (siteInfo) {
      try {
        home.siteInfo = typeof siteInfo === 'string' ? JSON.parse(siteInfo) : siteInfo;
      } catch (e) {
        // 保持默认值
      }
    }

    await home.save();
    console.log('首页内容已保存到数据库');
    console.log('最终头像路径:', home.avatarImage);
    console.log('最终Banner路径:', home.bannerImage);
    res.json(home);
  } catch (error) {
    console.error('更新首页内容错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

module.exports = router;

