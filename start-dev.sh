#!/bin/bash

echo "🚀 启动1688客服聊天分析系统开发服务器..."

# 检查Node.js版本
echo "📦 检查Node.js版本..."
node_version=$(node --version)
echo "Node.js版本: $node_version"

# 检查npm版本
echo "📦 检查npm版本..."
npm_version=$(npm --version)
echo "npm版本: $npm_version"

# 检查依赖是否安装
echo "🔍 检查项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules目录不存在，正在安装依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

# 运行依赖检查
echo "🔍 运行依赖检查..."
node check-dependencies.js

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "应用将在 http://localhost:3000 打开"
echo "按 Ctrl+C 停止服务器"
echo ""

npm start
