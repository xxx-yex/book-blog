// 创建默认管理员账号
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-notes');
    console.log('MongoDB 连接成功');

    const username = 'admin';
    const password = 'admin123';

    // 检查是否已存在管理员账号
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`管理员账号 "${username}" 已存在，跳过创建`);
      process.exit(0);
    }

    // 创建管理员账号
    const admin = new User({
      username,
      password,
      role: 'admin'
    });

    await admin.save();
    console.log('默认管理员账号创建成功！');
    console.log(`用户名: ${username}`);
    console.log(`密码: ${password}`);
    console.log('⚠️  首次登录后请立即修改密码！');
    
    process.exit(0);
  } catch (error) {
    console.error('创建管理员账号错误:', error);
    process.exit(1);
  }
};

createAdmin();

