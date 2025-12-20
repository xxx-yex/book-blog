const express = require('express');
const Category = require('../models/Category');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.json(categories);
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个分类
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }
    res.json(category);
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建分类（需要认证）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, icon, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ message: '分类名称不能为空' });
    }

    const category = new Category({ name, icon, sortOrder });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '分类名称已存在' });
    }
    console.error('创建分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新分类（需要认证）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, icon, sortOrder } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, icon, sortOrder },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }

    res.json(category);
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量删除分类（需要认证）
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供要删除的分类ID数组' });
    }

    const result = await Category.deleteMany({ _id: { $in: ids } });
    res.json({ 
      message: '批量删除成功',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('批量删除分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除分类（需要认证）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }
    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

