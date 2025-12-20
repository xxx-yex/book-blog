# 个人学习笔记网站

一个基于 React + Express + MongoDB 的个人学习笔记管理系统。

## 技术栈

### 前端
- React 18
- Ant Design (UI组件库)
- Tailwind CSS (样式)
- React Quill (富文本编辑器)
- React Router (路由)
- Axios (HTTP客户端)

### 后端
- Node.js
- Express
- MongoDB + Mongoose
- JWT (身份认证)
- bcryptjs (密码加密)

## 功能特性

- 📝 文章管理（增删查改）
- 📁 分类管理（增删查改）
- 🔐 用户登录认证
- 📊 文章浏览统计
- 🎨 富文本编辑器
- 📱 响应式设计

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行。如果没有安装 MongoDB，可以：

- 使用 MongoDB Atlas (云数据库)
- 本地安装 MongoDB

### 4. 初始化数据库

**重要：请在项目根目录（`D:\front-end\book`）运行以下命令：**

```bash
npm run init
```

或者：

```bash
node server/init.js
```

这将创建默认管理员用户：
- 用户名: `admin`
- 密码: `admin123`

**⚠️ 首次登录后请修改密码！**

### 5. 启动开发服务器

**前端开发服务器：**
```bash
npm run dev
```

**后端 API 服务器：**
```bash
npm run dev:server
```

或者分别启动：
- 前端: `npm run dev` (端口 3000)
- 后端: `npm run server` (端口 3001)

## 项目结构

```
book/
├── src/                    # 前端源码
│   ├── pages/             # 页面组件
│   │   ├── Home.jsx       # 首页
│   │   ├── ArticleDetail.jsx  # 文章详情页
│   │   └── Admin/         # 后台管理
│   ├── utils/             # 工具函数
│   │   ├── api.js         # API 调用
│   │   └── auth.js        # 认证工具
│   ├── App.jsx            # 路由配置
│   └── main.jsx          # 入口文件
├── components/            # 公共组件
│   └── Layout.jsx        # 布局组件
├── server/               # 后端代码
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   ├── middleware/     # 中间件
│   └── index.js        # 服务器入口
└── package.json
```

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户信息

### 分类
- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类
- `POST /api/categories` - 创建分类（需认证）
- `PUT /api/categories/:id` - 更新分类（需认证）
- `DELETE /api/categories/:id` - 删除分类（需认证）

### 文章
- `GET /api/articles` - 获取所有文章
- `GET /api/articles/:id` - 获取单个文章
- `POST /api/articles` - 创建文章（需认证）
- `PUT /api/articles/:id` - 更新文章（需认证）
- `DELETE /api/articles/:id` - 删除文章（需认证）
- `POST /api/articles/:id/views` - 增加浏览量

## 使用说明

1. 访问 `http://localhost:3000` 查看首页
2. 点击右上角头像图标登录
3. 登录后可以访问后台管理页面
4. 在后台可以管理分类和文章
5. 使用富文本编辑器编辑文章内容

## 注意事项

- 生产环境部署前请修改 `.env` 中的 `JWT_SECRET`
- 建议修改默认管理员密码
- MongoDB 连接字符串请根据实际情况配置

