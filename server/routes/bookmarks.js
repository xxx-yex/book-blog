const express = require('express');
const Bookmark = require('../models/Bookmark');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有书签（按分类分组）
router.get('/', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find().sort({ category: 1, order: 1 });
    
    // 按分类分组
    const grouped = bookmarks.reduce((acc, bookmark) => {
      if (!acc[bookmark.category]) {
        acc[bookmark.category] = [];
      }
      acc[bookmark.category].push(bookmark);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    console.error('获取书签错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有分类
router.get('/categories', async (req, res) => {
  try {
    const categories = await Bookmark.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建书签（需要认证）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const bookmark = new Bookmark(req.body);
    await bookmark.save();
    res.json(bookmark);
  } catch (error) {
    console.error('创建书签错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 更新书签（需要认证）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const bookmark = await Bookmark.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!bookmark) {
      return res.status(404).json({ message: '书签不存在' });
    }
    res.json(bookmark);
  } catch (error) {
    console.error('更新书签错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
});

// 删除书签（需要认证）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bookmark = await Bookmark.findByIdAndDelete(req.params.id);
    if (!bookmark) {
      return res.status(404).json({ message: '书签不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除书签错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

