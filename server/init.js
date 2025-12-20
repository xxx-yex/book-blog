// 初始化数据库，创建默认管理员用户
const path = require('path');
const mongoose = require('mongoose');
const User = require(path.join(__dirname, 'models/User'));
const Category = require(path.join(__dirname, 'models/Category'));
const dotenv = require('dotenv');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-notes');

    console.log('MongoDB 连接成功');

    // 检查是否已有用户
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // 创建默认管理员用户
      const defaultUser = new User({
        username: 'admin',
        password: 'admin123', // 默认密码，建议首次登录后修改
        role: 'admin',
      });
      await defaultUser.save();
      console.log('默认管理员用户已创建: username=admin, password=admin123');
    }

    // 检查是否已有分类
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      // 创建默认分类
      const defaultCategories = [
        { name: 'JS手写题', sortOrder: 1 },
        { name: '前端常见手写', sortOrder: 2 },
        { name: '回溯算法', sortOrder: 3 },
        { name: '常见算法刷题-哈希表', sortOrder: 4 },
        { name: '常见算法刷题-字符串', sortOrder: 5 },
        { name: '常见算法刷题-数组', sortOrder: 6 },
        { name: '常见算法刷题-栈&队列', sortOrder: 7 },
        { name: '常见算法刷题-树', sortOrder: 8 },
        { name: '常见算法刷题-链表', sortOrder: 9 },
        { name: 'CSS相关', sortOrder: 10 },
        { name: 'JS', sortOrder: 11 },
        { name: 'JS原理', sortOrder: 12 },
        { name: 'LLM', sortOrder: 13 },
        { name: 'React原理探究', sortOrder: 14 },
        { name: 'React基本概念&使用', sortOrder: 15 },
        { name: 'prompt工程', sortOrder: 16 },
        { name: 'prompt模板', sortOrder: 17 },
        { name: 'react组件设计', sortOrder: 18 },
      ];

      await Category.insertMany(defaultCategories);
      console.log('默认分类已创建');
    }

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化错误:', error);
    process.exit(1);
  }
};

initDatabase();

