// 初始化数据库，仅测试连接
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-notes');

    console.log('MongoDB 连接成功');
    console.log('数据库初始化完成（仅测试连接，不创建默认数据）');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化错误:', error);
    process.exit(1);
  }
};

initDatabase();

