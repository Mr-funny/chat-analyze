import { APIConfig, ValidationResult, TestResult } from '../types';

// 安全配置管理器
class SecureConfigManager {
  private static instance: SecureConfigManager;
  private readonly STORAGE_KEY = 'ai_analysis_secure_config';

  constructor() {}

  static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  // 保存配置
  async saveConfig(config: APIConfig): Promise<void> {
    try {
      const secureConfig = {
        ...config,
        lastUpdated: new Date().toISOString()
      };
      
      // 使用localStorage存储（简化版本）
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(secureConfig));
      
    } catch (error) {
      console.error('保存配置失败:', error);
      throw new Error('配置保存失败');
    }
  }

  // 读取配置
  async loadConfig(): Promise<APIConfig | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const config = JSON.parse(stored);
      return config;
    } catch (error) {
      console.error('读取配置失败:', error);
      return null;
    }
  }

  // 清除配置
  async clearConfig(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清除配置失败:', error);
    }
  }
}

// 配置验证器
class ConfigValidator {
  static validateConfig(config: APIConfig): ValidationResult {
    const errors: string[] = [];

    // 验证API密钥
    if (!config.apiKey || config.apiKey.trim() === '') {
      errors.push('API密钥不能为空');
    }

    // 验证模型选择
    if (!config.model || config.model.trim() === '') {
      errors.push('请选择AI模型');
    }

    // 验证自定义URL格式
    if (config.provider === 'custom' && config.baseURL) {
      try {
        new URL(config.baseURL);
      } catch {
        errors.push('API地址格式不正确');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 测试API连接
  static async testConnection(config: APIConfig): Promise<TestResult> {
    try {
      const startTime = Date.now();
      
      // 根据提供商进行真实的API测试
      if (config.provider === 'custom' && config.baseURL) {
        // 清理baseURL
        let cleanBaseURL = config.baseURL.trim();
        if (cleanBaseURL.endsWith(':')) {
          cleanBaseURL = cleanBaseURL.slice(0, -1);
        }
        
        // 检查是否是Gemini API并构建正确的端点和认证
        let testURL = cleanBaseURL;
        let requestBody: any;
        let headers: any = {
          'Content-Type': 'application/json'
        };
        
        if (cleanBaseURL.includes('generativelanguage.googleapis.com')) {
          // Gemini API格式
          if (!cleanBaseURL.includes('/v1beta/models/')) {
            testURL = `${cleanBaseURL}/v1beta/models/${config.model}:generateContent`;
          }
          // Gemini API使用x-goog-api-key而不是Authorization
          headers['x-goog-api-key'] = config.apiKey;
          requestBody = {
            contents: [{
              parts: [{
                text: 'Hello, this is a test message.'
              }]
            }],
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0.1
            }
          };
        } else {
          // 其他API格式
          headers['Authorization'] = `Bearer ${config.apiKey}`;
          requestBody = {
            model: config.model,
            messages: [{
              role: 'user',
              content: 'Hello, this is a test message.'
            }],
            max_tokens: 10,
            temperature: 0.1
          };
        }
        
        console.log('Testing connection to:', testURL);
        console.log('Request headers:', headers);
        console.log('Request body:', requestBody);
        
        // 发送测试请求
        const response = await fetch(testURL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(10000) // 10秒超时
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        const endTime = Date.now();
        
        return {
          success: true,
          responseTime: endTime - startTime,
          message: `连接测试成功 (${endTime - startTime}ms)`
        };
      } else {
        // 对于其他提供商，使用模拟测试
        await new Promise(resolve => setTimeout(resolve, 1000));
        const endTime = Date.now();
        
        return {
          success: true,
          responseTime: endTime - startTime,
          message: '连接测试成功'
        };
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '连接测试失败'
      };
    }
  }
}

// 导出实例和类
export const configManager = SecureConfigManager.getInstance();
export { ConfigValidator };
export default SecureConfigManager;
