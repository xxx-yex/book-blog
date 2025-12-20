const express = require('express');
const Article = require('../models/Article');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;

