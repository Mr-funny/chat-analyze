# 1688客服聊天分析系统

一个专业的客服聊天记录分析工具，支持多种AI模型，提供详细的分析报告和可视化展示。

## 🚀 功能特性

- **多AI模型支持**: 支持OpenAI、Anthropic、Azure等多种AI服务商
- **安全配置管理**: API密钥本地加密存储，确保数据安全
- **智能分析**: 自动分析客服响应时间、专业度、销售技巧等指标
- **可视化报告**: 生成美观的HTML报告和PDF文档
- **数据持久化**: 自动保存分析历史，支持配置管理

## 📦 技术栈

- **前端框架**: React 19 + TypeScript
- **UI组件库**: Ant Design 5
- **图表库**: Recharts
- **PDF生成**: jsPDF + html2canvas
- **HTTP客户端**: Axios
- **安全存储**: IndexedDB + 本地加密

## 🛠️ 安装和运行

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd customer-service-analyzer
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm start
```

4. **构建生产版本**
```bash
npm run build
```

## 🔧 配置说明

### AI模型配置

1. 打开应用后，在左侧配置面板中设置AI模型参数
2. 选择服务提供商（OpenAI、Anthropic、Azure等）
3. 输入API密钥和模型名称
4. 点击"测试连接"验证配置
5. 保存配置后即可开始使用

### 支持的AI服务商

- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude-3 Opus, Claude-3 Sonnet, Claude-3 Haiku
- **Azure OpenAI**: GPT-4, GPT-3.5 Turbo
- **自定义API**: 支持自定义API端点

## 📊 使用指南

### 1. 上传聊天记录

- 支持TXT格式的聊天记录文件
- 自动识别客户和客服消息
- 支持批量文件上传

### 2. 分析配置

- 选择分析维度（响应时间、专业度、销售技巧等）
- 设置分析参数
- 配置报告格式

### 3. 生成报告

- 自动生成HTML格式的分析报告
- 支持导出PDF文档
- 包含图表和详细分析

## 🔒 安全特性

- **本地加密存储**: API密钥使用AES-GCM加密
- **设备绑定**: 加密密钥基于设备特征生成
- **无服务器存储**: 所有敏感数据仅在本地处理
- **完整性验证**: 配置哈希验证防止篡改

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── APIConfigPanel.tsx
│   ├── FileUpload.tsx
│   ├── AnalysisReport.tsx
│   └── Charts/
├── pages/              # 页面组件
│   ├── Dashboard.tsx
│   └── History.tsx
├── services/           # 服务层
│   ├── aiAnalysis.ts
│   ├── configManager.ts
│   └── pdfExport.ts
├── types/              # TypeScript类型定义
│   └── index.ts
└── utils/              # 工具函数
    ├── encryption.ts
    └── validation.ts
```

## 🎯 分析指标

### 响应效率 (30%)
- 首次响应时间
- 平均响应时间
- 响应时间分布

### 专业能力 (30%)
- 产品知识掌握
- 技术参数准确性
- 专业术语使用

### 销售技巧 (25%)
- 需求挖掘能力
- 价值塑造效果
- 成交推进技巧

### 服务态度 (15%)
- 沟通语气
- 问题解决态度
- 客户关系维护

## 📈 报告内容

### 执行摘要
- 总体评分
- 关键指标对比
- 主要发现概述

### 详细分析
- 客户分析表格
- 问题诊断报告
- 改进建议清单

### 最佳实践
- 金牌话术案例
- SOP流程建议
- 培训材料

## 🔧 开发指南

### 添加新的AI服务商

1. 在`services/aiAnalysis.ts`中添加新的适配器
2. 在`types/index.ts`中定义相关类型
3. 在配置面板中添加服务商选项

### 自定义分析指标

1. 修改分析提示词模板
2. 更新评分算法
3. 调整报告模板

### 扩展报告功能

1. 添加新的图表类型
2. 自定义报告模板
3. 增加导出格式

## 🐛 故障排除

### 常见问题

1. **API连接失败**
   - 检查API密钥是否正确
   - 验证网络连接
   - 确认服务商状态

2. **配置保存失败**
   - 检查浏览器存储权限
   - 清除浏览器缓存
   - 重新配置参数

3. **PDF导出失败**
   - 检查文件大小限制
   - 确认浏览器兼容性
   - 尝试刷新页面

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱: [your-email@example.com]
- GitHub: [your-github-profile]

---

**注意**: 请确保您的API密钥安全，不要分享给他人。本应用不会将您的API密钥上传到任何服务器。
