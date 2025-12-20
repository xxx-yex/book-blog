const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Article = require('../models/Article');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 确保文章图片上传目录存在
const articleImageDir = path.join(__dirname, '../uploads/articles');
if (!fs.existsSync(articleImageDir)) {
  fs.mkdirSync(articleImageDir, { recursive: true });
}

// 配置 multer 用于文章图片上传
const articleImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, articleImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const articleImageUpload = multer({
  storage: articleImageStorage,
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

// 获取所有文章
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const articles = await Article.find(query)
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });
    
    res.json(articles);
  } catch (error) {
    console.error('获取文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有文章图片列表（需要认证）- 必须在 /:id 之前
router.get('/images/list', authMiddleware, async (req, res) => {
  try {
    const imageFiles = [];
    
    if (fs.existsSync(articleImageDir)) {
      const files = fs.readdirSync(articleImageDir);
      
      for (const file of files) {
        const filePath = path.join(articleImageDir, file);
        const stat = fs.statSync(filePath);
        
        // 只返回图片文件
        if (stat.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
          imageFiles.push({
            filename: file,
            url: `/uploads/articles/${file}`,
            size: stat.size,
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime,
          });
        }
      }
    }
    
    // 按修改时间倒序排列（最新的在前）
    imageFiles.sort((a, b) => b.modifiedAt - a.modifiedAt);
    
    res.json(imageFiles);
  } catch (error) {
    console.error('获取文章图片列表错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 获取单个文章
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('category', 'name icon');
    
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('获取文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建文章（需要认证）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '标题和内容不能为空' });
    }

    const article = new Article({
      title,
      content,
      category,
      tags: tags || [],
    });

    await article.save();
    await article.populate('category', 'name icon');
    
    res.status(201).json(article);
  } catch (error) {
    console.error('创建文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新文章（需要认证）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { title, content, category, tags, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('category', 'name icon');

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    res.json(article);
  } catch (error) {
    console.error('更新文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除文章（需要认证）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }
    res.json({ message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量删除文章（需要认证）
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供要删除的文章ID数组' });
    }

    const result = await Article.deleteMany({ _id: { $in: ids } });
    res.json({ 
      message: '批量删除成功',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('批量删除文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量导入文章（需要认证）
router.post('/batch-import', authMiddleware, async (req, res) => {
  try {
    const { articles } = req.body;
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: '请提供要导入的文章数组' });
    }

    const importedArticles = [];
    const errors = [];

    for (const articleData of articles) {
      try {
        if (!articleData.title || !articleData.content) {
          errors.push({ article: articleData.title || '未知', error: '标题和内容不能为空' });
          continue;
        }

        const article = new Article({
          title: articleData.title,
          content: articleData.content,
          category: articleData.category || null,
          tags: articleData.tags || [],
          views: articleData.views || 0,
          likes: articleData.likes || 0,
          createdAt: articleData.createdAt ? new Date(articleData.createdAt) : new Date(),
          updatedAt: articleData.updatedAt ? new Date(articleData.updatedAt) : new Date(),
        });

        await article.save();
        await article.populate('category', 'name icon');
        importedArticles.push(article);
      } catch (error) {
        errors.push({ article: articleData.title || '未知', error: error.message });
      }
    }

    res.json({
      message: '批量导入完成',
      importedCount: importedArticles.length,
      errorCount: errors.length,
      importedArticles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('批量导入文章错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 增加浏览量
router.post('/:id/views', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    res.json({ views: article.views });
  } catch (error) {
    console.error('增加浏览量错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传文章图片（需要认证）
router.post('/upload-image', authMiddleware, articleImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const fileUrl = `/uploads/articles/${req.file.filename}`;
    
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('上传文章图片错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 获取所有文章图片列表（需要认证）
router.get('/images/list', authMiddleware, async (req, res) => {
  try {
    const imageFiles = [];
    
    if (fs.existsSync(articleImageDir)) {
      const files = fs.readdirSync(articleImageDir);
      
      for (const file of files) {
        const filePath = path.join(articleImageDir, file);
        const stat = fs.statSync(filePath);
        
        // 只返回图片文件
        if (stat.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
          imageFiles.push({
            filename: file,
            url: `/uploads/articles/${file}`,
            size: stat.size,
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime,
          });
        }
      }
    }
    
    // 按修改时间倒序排列（最新的在前）
    imageFiles.sort((a, b) => b.modifiedAt - a.modifiedAt);
    
    res.json(imageFiles);
  } catch (error) {
    console.error('获取文章图片列表错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 删除文章图片（需要认证）
router.delete('/images/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: '非法的文件名' });
    }
    
    const filePath = path.join(articleImageDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '图片不存在' });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    res.json({ message: '图片删除成功' });
  } catch (error) {
    console.error('删除文章图片错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 将文章中的base64图片转换为文件（需要认证）
router.post('/images/convert-base64', authMiddleware, async (req, res) => {
  try {
    const articles = await Article.find({});
    let totalConverted = 0;
    let totalImages = 0;
    const errors = [];

    for (const article of articles) {
      try {
        let content = article.content;
        if (!content || typeof content !== 'string') continue;

        // 匹配base64图片的正则表达式
        const base64Regex = /<img[^>]+src=["'](data:image\/([^;]+);base64,([^"']+))["'][^>]*>/gi;
        let match;
        let hasChanges = false;

        // 使用数组存储所有匹配项和替换内容，从后往前处理
        const matches = [];
        
        // 先收集所有匹配项
        while ((match = base64Regex.exec(content)) !== null) {
          totalImages++;
          matches.push({
            index: match.index,
            fullMatch: match[0],
            base64Data: match[3],
            imageType: match[2]
          });
        }

        // 从后往前处理，避免索引变化的问题
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];
          
          try {
            // 将base64转换为Buffer
            const imageBuffer = Buffer.from(match.base64Data, 'base64');
            
            // 生成文件名
            const extension = match.imageType === 'jpeg' ? 'jpg' : match.imageType;
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${i}.${extension}`;
            const filePath = path.join(articleImageDir, filename);
            
            // 保存文件
            fs.writeFileSync(filePath, imageBuffer);
            
            // 生成新的图片URL
            const newUrl = `/uploads/articles/${filename}`;
            
            // 构建新的img标签，保持其他属性不变
            const newImgTag = match.fullMatch.replace(
              /src=["']data:image\/[^"']+["']/i,
              `src="${newUrl}"`
            );
            
            // 直接替换
            content = content.substring(0, match.index) + 
                     newImgTag + 
                     content.substring(match.index + match.fullMatch.length);
            
            totalConverted++;
            hasChanges = true;
          } catch (imgError) {
            errors.push({
              articleId: article._id,
              articleTitle: article.title,
              error: `处理图片失败: ${imgError.message}`
            });
          }
        }

        // 更新文章内容
        if (hasChanges) {
          article.content = content;
          await article.save();
        }
      } catch (articleError) {
        errors.push({
          articleId: article._id,
          articleTitle: article.title,
          error: `处理文章失败: ${articleError.message}`
        });
      }
    }

    res.json({
      message: '转换完成',
      totalImages,
      converted: totalConverted,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('转换base64图片错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

module.exports = router;

