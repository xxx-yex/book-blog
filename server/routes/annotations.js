const express = require('express');
const Annotation = require('../models/Annotation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有注释（用于导出，需要认证）
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const annotations = await Annotation.find()
      .populate('article', 'title')
      .sort({ createdAt: 1 });
    res.json(annotations);
  } catch (error) {
    console.error('获取所有注释错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取文章的所有注释（公开，不需要认证）
router.get('/article/:articleId', async (req, res) => {
  try {
    const annotations = await Annotation.find({ article: req.params.articleId })
      .sort({ createdAt: 1 });
    res.json(annotations);
  } catch (error) {
    console.error('获取注释错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建注释（需要认证，仅管理员）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { article, selectedText, startOffset, endOffset, comment } = req.body;

    if (!article || !selectedText || startOffset === undefined || endOffset === undefined || !comment) {
      return res.status(400).json({ message: '缺少必要字段' });
    }

    const annotation = new Annotation({
      article,
      selectedText,
      startOffset,
      endOffset,
      comment,
    });

    await annotation.save();
    res.status(201).json(annotation);
  } catch (error) {
    console.error('创建注释错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新注释（需要认证，仅管理员）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    
    const annotation = await Annotation.findById(req.params.id);
    if (!annotation) {
      return res.status(404).json({ message: '注释不存在' });
    }

    annotation.comment = comment;
    annotation.updatedAt = Date.now();
    await annotation.save();

    res.json(annotation);
  } catch (error) {
    console.error('更新注释错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除注释（需要认证，仅管理员）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const annotation = await Annotation.findById(req.params.id);
    if (!annotation) {
      return res.status(404).json({ message: '注释不存在' });
    }

    await Annotation.findByIdAndDelete(req.params.id);
    res.json({ message: '注释删除成功' });
  } catch (error) {
    console.error('删除注释错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

