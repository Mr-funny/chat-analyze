# Google Gemini API 使用指南

## 简介

本指南将帮助您使用我们的简易大模型调用界面来调用Google Gemini API。Gemini是Google推出的一系列大型语言模型，包括Gemini Pro、Gemini 1.5 Pro和Gemini 1.5 Flash等不同版本。

## 获取API密钥

在使用Gemini API之前，您需要获取Google API密钥：

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的Google账户
3. 创建一个API密钥
4. 复制生成的API密钥

## 使用步骤

### 1. 基本设置

1. 打开`index.html`文件
2. 在"API端点URL"字段中输入：`https://generativelanguage.googleapis.com/v1beta`
3. 在"API密钥"字段中粘贴您的Google API密钥
4. 从"模型选择"下拉菜单中选择以下选项之一：
   - Google - Gemini Pro
   - Google - Gemini 1.5 Pro
   - Google - Gemini 1.5 Flash
   - 或选择"自定义"并输入其他Gemini模型名称

### 2. 发送请求

1. 在"输入内容"文本框中输入您想发送给AI的内容
2. 点击"发送请求"按钮
3. 等待响应显示在页面底部

## 常见问题解决

### 错误: Failed to fetch

如果您看到"错误: Failed to fetch"，请检查以下几点：

1. **API端点格式**：确保您输入的是正确的API端点URL
   - 正确格式：`https://generativelanguage.googleapis.com/v1beta`
   - 不需要在URL末尾添加额外路径，系统会自动添加

2. **API密钥**：确保您的API密钥是有效的
   - 检查API密钥是否正确复制（没有多余的空格）
   - 确认API密钥未过期或被禁用

3. **网络连接**：确保您的网络连接正常
   - 尝试访问其他网站以验证网络连接

4. **CORS问题**：如果在浏览器控制台中看到CORS错误
   - 考虑使用浏览器扩展来解决CORS问题
   - 或使用本地代理服务器

### 模型名称错误

如果收到模型名称相关的错误，请确保使用以下正确的模型名称：

- `gemini-pro`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## Gemini API特性

### 支持的功能

- 文本生成
- 问答对话
- 内容摘要
- 创意写作
- 代码生成和解释

### 限制

- 每分钟请求数有限制
- 输入和输出的令牌数有限制
- 某些内容可能被过滤或拒绝回答

## 高级配置

如果您需要调整API请求的高级参数，可以修改`index.html`文件中的以下部分：

```javascript
// Gemini API请求格式
requestBody = {
    contents: [
        {
            parts: [
                {
                    text: prompt
                }
            ]
        }
    ],
    generationConfig: {
        temperature: 0.7,        // 调整创造性（0-1）
        maxOutputTokens: 1000,   // 最大输出令牌数
        topP: 0.95               // 调整多样性
    }
};
```

您可以根据需要调整这些参数。

## 更多资源

- [Google Gemini API 官方文档](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 参考](https://ai.google.dev/api/rest)
