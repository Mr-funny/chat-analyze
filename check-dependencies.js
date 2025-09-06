const fs = require('fs');
const path = require('path');

// 必需的依赖包列表
const requiredDependencies = {
  // 核心框架
  'react': 'React框架',
  'react-dom': 'React DOM',
  'typescript': 'TypeScript支持',
  
  // UI组件库
  'antd': 'Ant Design UI组件库',
  '@ant-design/icons': 'Ant Design图标库',
  
  // 图表库
  'recharts': '图表库',
  
  // PDF生成
  'jspdf': 'PDF生成库',
  'html2canvas': 'HTML转Canvas库',
  
  // HTTP请求
  'axios': 'HTTP客户端',
  
  // 开发依赖
  '@types/html2canvas': 'html2canvas类型定义'
};

// 检查package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('🔍 检查项目依赖...\n');

let allInstalled = true;
const missingDeps = [];
const installedDeps = [];

// 检查依赖
Object.keys(requiredDependencies).forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    installedDeps.push({
      name: dep,
      version: packageJson.dependencies[dep],
      description: requiredDependencies[dep],
      status: '✅ 已安装'
    });
  } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    installedDeps.push({
      name: dep,
      version: packageJson.devDependencies[dep],
      description: requiredDependencies[dep],
      status: '✅ 已安装(开发依赖)'
    });
  } else {
    missingDeps.push({
      name: dep,
      description: requiredDependencies[dep],
      status: '❌ 未安装'
    });
    allInstalled = false;
  }
});

// 输出结果
console.log('📦 已安装的依赖:');
installedDeps.forEach(dep => {
  console.log(`${dep.status} ${dep.name}@${dep.version} - ${dep.description}`);
});

if (missingDeps.length > 0) {
  console.log('\n❌ 缺失的依赖:');
  missingDeps.forEach(dep => {
    console.log(`${dep.status} ${dep.name} - ${dep.description}`);
  });
}

// 检查项目结构
console.log('\n📁 检查项目结构...');
const requiredDirs = ['src/components', 'src/pages', 'src/services', 'src/types', 'src/utils'];
const missingDirs = [];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir} - 目录存在`);
  } else {
    console.log(`❌ ${dir} - 目录缺失`);
    missingDirs.push(dir);
  }
});

// 总结
console.log('\n📊 检查总结:');
console.log(`依赖包: ${installedDeps.length}/${Object.keys(requiredDependencies).length} 已安装`);
console.log(`项目结构: ${requiredDirs.length - missingDirs.length}/${requiredDirs.length} 目录存在`);

if (allInstalled && missingDirs.length === 0) {
  console.log('\n🎉 所有依赖和项目结构都已正确安装！');
  console.log('可以开始开发了！');
} else {
  console.log('\n⚠️  请安装缺失的依赖或创建缺失的目录');
}

// 检查Node.js版本
const nodeVersion = process.version;
console.log(`\n🔧 Node.js版本: ${nodeVersion}`);

// 检查npm版本
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`📦 npm版本: ${npmVersion}`);
} catch (error) {
  console.log('❌ 无法获取npm版本');
}
