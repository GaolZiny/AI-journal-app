#!/bin/sh
# 运行时配置注入脚本
# 将环境变量写入配置文件，供前端读取

CONFIG_FILE="/usr/share/nginx/html/config.js"

cat <<EOF > $CONFIG_FILE
window.__RUNTIME_CONFIG__ = {
  FIREBASE_API_KEY: "${VITE_FIREBASE_API_KEY:-}",
  FIREBASE_AUTH_DOMAIN: "${VITE_FIREBASE_AUTH_DOMAIN:-}",
  FIREBASE_PROJECT_ID: "${VITE_FIREBASE_PROJECT_ID:-}",
  FIREBASE_STORAGE_BUCKET: "${VITE_FIREBASE_STORAGE_BUCKET:-}",
  FIREBASE_MESSAGING_SENDER_ID: "${VITE_FIREBASE_MESSAGING_SENDER_ID:-}",
  FIREBASE_APP_ID: "${VITE_FIREBASE_APP_ID:-}",
  N8N_BASE_URL: "${VITE_N8N_BASE_URL:-}"
};
EOF

echo "Runtime config generated at $CONFIG_FILE"

# 启动 nginx
exec nginx -g 'daemon off;'
