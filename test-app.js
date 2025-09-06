const fs = require('fs');
const path = require('path');

console.log('🧪 开始模拟测试客服聊天分析系统...\n');

// 模拟测试配置
const testConfig = {
  provider: 'custom',
  apiKey: 'sk-kNtKFAVxVMXBE6qK15FdE9Cf72544f1c8f95F40677D7B5Ce',
  baseURL: 'https://api.vveai.com/v1/chat/completions',
  model: 'gemini-2.5-pro',
  maxTokens: 32000,
  temperature: 0.5
};

// 检查merged.txt文件
const testFile = path.join(__dirname, 'merged.txt');
console.log('📁 检查测试文件...');
if (fs.existsSync(testFile)) {
  const stats = fs.statSync(testFile);
  const fileSize = (stats.size / 1024).toFixed(2);
  console.log(`✅ 找到测试文件: merged.txt (${fileSize} KB)`);
  
  // 读取文件内容
  const content = fs.readFileSync(testFile, 'utf-8');
  console.log(`📄 文件内容长度: ${content.length} 字符`);
  console.log(`📄 文件预览: ${content.substring(0, 200)}...`);
  
  // 检查文件格式
  const hasCustomerMessage = content.includes('客户:') || content.includes('-->');
  const hasServiceMessage = content.includes('客服:') || content.includes('精裕胶片:');
  const hasColon = content.includes(':');
  
  console.log('\n🔍 文件格式检查:');
  console.log(`  包含客户消息: ${hasCustomerMessage ? '✅' : '❌'}`);
  console.log(`  包含客服消息: ${hasServiceMessage ? '✅' : '❌'}`);
  console.log(`  包含冒号: ${hasColon ? '✅' : '❌'}`);
  
  if (hasColon || hasCustomerMessage || hasServiceMessage) {
    console.log('✅ 文件格式验证通过');
  } else {
    console.log('❌ 文件格式验证失败');
  }
  
} else {
  console.log('❌ 未找到测试文件: merged.txt');
  console.log('💡 请将merged.txt文件放在项目根目录下');
}

console.log('\n⚙️ 测试配置:');
console.log(`  服务提供商: ${testConfig.provider}`);
console.log(`  API地址: ${testConfig.baseURL}`);
console.log(`  模型: ${testConfig.model}`);
console.log(`  最大Token: ${testConfig.maxTokens}`);
console.log(`  温度: ${testConfig.temperature}`);

console.log('\n🌐 应用访问测试:');
console.log('  尝试访问 http://localhost:3000...');

// 模拟API调用测试
console.log('\n🔌 API调用模拟测试:');
console.log('  请求URL: ' + testConfig.baseURL);
console.log('  请求方法: POST');
console.log('  请求头:');
console.log('    Content-Type: application/json');
console.log('    Authorization: Bearer ' + testConfig.apiKey.substring(0, 10) + '...');
console.log('  请求体:');
console.log('    {');
console.log('      "model": "' + testConfig.model + '",');
console.log('      "messages": [');
console.log('        {');
console.log('          "role": "user",');
console.log('          "content": "分析提示词 + 聊天记录内容"');
console.log('        }');
console.log('      ],');
console.log('      "max_tokens": ' + testConfig.maxTokens + ',');
console.log('      "temperature": ' + testConfig.temperature + ',');
console.log('      "stream": false');
console.log('    }');

console.log('\n📋 常见问题诊断:');
console.log('1. 应用无法启动:');
console.log('   - 检查是否在正确的目录 (customer-service-analyzer)');
console.log('   - 运行 npm install 安装依赖');
console.log('   - 检查端口3000是否被占用');
console.log('   - 尝试使用不同端口: PORT=3001 npm start');

console.log('\n2. 配置保存问题:');
console.log('   - 确保填写了所有必填字段');
console.log('   - 检查API密钥格式是否正确');
console.log('   - 确保API地址格式正确');

console.log('\n3. 文件上传问题:');
console.log('   - 确保文件是TXT格式');
console.log('   - 文件大小不超过10MB');
console.log('   - 文件包含聊天记录内容');

console.log('\n4. API调用问题:');
console.log('   - 检查API密钥是否有效');
console.log('   - 确认模型名称正确');
console.log('   - 检查网络连接');

console.log('\n🎯 测试完成！');
console.log('💡 如果应用无法访问，请检查:');
console.log('   - 开发服务器是否正在运行');
console.log('   - 浏览器控制台是否有错误');
console.log('   - 网络连接是否正常');
