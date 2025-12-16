# AI仕訳 | Journal Entry App

一个基于 React + TypeScript 的账目管理应用，支持 AI 智能仕訳处理。

## 功能特点

-  账目录入与管理
- 🤖 AI 智能仕訳处理
- 🔍 多条件搜索（发生日期、创建日期、更新日期、状态）
- � 导出 CSV
- 🔐 Firebase 身份验证（邮箱/Google）
- 📱 响应式设计，支持移动端

## 技术栈

- **前端**: React 18, TypeScript, Tailwind CSS
- **认证**: Firebase Authentication
- **后端**: n8n Workflow (Webhook)
- **部署**: Docker, Nginx

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 填入实际配置

# 启动开发服务器
npm run dev
```

## Docker 部署

### 使用预构建镜像

```bash
# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/journal-entry-app:latest

# 或使用 docker-compose
docker-compose up -d
```

### 本地构建

```bash
# 构建镜像
docker build -t journal-entry-app .

# 运行
docker run -p 3000:80 \
  -e VITE_FIREBASE_API_KEY=your_key \
  -e VITE_FIREBASE_AUTH_DOMAIN=your_domain \
  -e VITE_FIREBASE_PROJECT_ID=your_project \
  -e VITE_FIREBASE_STORAGE_BUCKET=your_bucket \
  -e VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id \
  -e VITE_FIREBASE_APP_ID=your_app_id \
  -e VITE_N8N_BASE_URL=http://your-n8n:5678 \
  journal-entry-app
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_N8N_BASE_URL` | n8n Webhook Base URL |

## 反向代理配置

应用监听容器内的 80 端口，可以使用任何反向代理（Nginx Proxy Manager, Traefik 等）转发请求。

**注意**: 需要在 Firebase Console 的 **Authentication > Settings > Authorized domains** 中添加你的域名。

## License

MIT
