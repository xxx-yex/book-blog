const express = require('express');
const Event = require('../models/Event');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有时间事件
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: -1 }); // 按日期倒序排列
    
    res.json(events);
  } catch (error) {
    console.error('获取时间事件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个时间事件
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: '时间事件不存在' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('获取时间事件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建时间事件（需要认证）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, location, mood, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: '标题和日期不能为空' });
    }

    const event = new Event({
      title,
      description: description || '',
      location: location || '',
      mood: mood || '',
      date: new Date(date),
    });

    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    console.error('创建时间事件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新时间事件（需要认证）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, location, mood, date } = req.body;
    
    const updateData = {
      title, 
      description: description !== undefined ? description : undefined,
      location: location !== undefined ? location : undefined,
      mood: mood !== undefined ? mood : undefined,
      updatedAt: Date.now() 
    };
    
    if (date) {
      updateData.date = new Date(date);
    }
    
    // 移除undefined字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: '时间事件不存在' });
    }

    res.json(event);
  } catch (error) {
    console.error('更新时间事件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除时间事件（需要认证）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: '时间事件不存在' });
    }
    res.json({ message: '时间事件删除成功' });
  } catch (error) {
    console.error('删除时间事件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量删除时间事件（需要认证）
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供要删除的时间事件ID数组' });
    }

    const result = await Event.deleteMany({ _id: { $in: ids } });
    res.json({ 
      message: '批量删除成功',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('批量删除时间事件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

