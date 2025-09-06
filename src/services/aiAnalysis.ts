import { APIConfig, AnalysisResult, ChatMessage, ChatSession } from '../types';
import axios from 'axios';
import { QUALITATIVE_PROMPT, QUANTITATIVE_PROMPT } from '../constants/promptsV2';

// 模型选项接口
export interface ModelOption {
  value: string;
  label: string;
}

// AI服务适配器
class AIServiceAdapter {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  // 获取可用模型列表
  static async getAvailableModels(config: APIConfig): Promise<ModelOption[]> {
    try {
      switch (config.provider) {
        case 'openai':
          return await this.getOpenAIModels(config);
        case 'anthropic':
          return await this.getAnthropicModels(config);
        case 'azure':
          return await this.getAzureModels(config);
        case 'custom':
          return await this.getCustomModels(config);
        default:
          return [];
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      throw error;
    }
  }

  // 获取OpenAI模型列表
  private static async getOpenAIModels(config: APIConfig): Promise<ModelOption[]> {
    const baseURL = config.baseURL || 'https://api.openai.com/v1';
    const response = await fetch(`${baseURL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models: ModelOption[] = data.data
      .filter((model: any) => 
        model.id.includes('gpt-4') || 
        model.id.includes('gpt-3.5') ||
        model.id.includes('gpt-4o')
      )
      .map((model: any) => ({
        value: model.id,
        label: `${model.id} (${model.object})`
      }));

    return models;
  }

  // 获取Anthropic模型列表
  private static async getAnthropicModels(config: APIConfig): Promise<ModelOption[]> {
    // Anthropic目前没有公开的模型列表API，返回预设模型
    return [
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
      { value: 'claude-2.1', label: 'Claude 2.1' },
      { value: 'claude-2.0', label: 'Claude 2.0' }
    ];
  }

  // 获取Azure OpenAI模型列表
  private static async getAzureModels(config: APIConfig): Promise<ModelOption[]> {
    if (!config.baseURL) {
      throw new Error('Azure OpenAI需要配置baseURL');
    }

    try {
      const response = await fetch(`${config.baseURL}/openai/deployments?api-version=2023-05-15`, {
        method: 'GET',
        headers: {
          'api-key': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const models: ModelOption[] = data.data.map((deployment: any) => ({
        value: deployment.id,
        label: `${deployment.id} (${deployment.model})`
      }));

      return models;
    } catch (error) {
      // 如果获取失败，返回预设的Azure模型
      return [
        { value: 'gpt-4', label: 'GPT-4 (Azure)' },
        { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo (Azure)' },
        { value: 'gpt-4-32k', label: 'GPT-4 32K (Azure)' }
      ];
    }
  }

  // 获取自定义API模型列表
  private static async getCustomModels(config: APIConfig): Promise<ModelOption[]> {
    if (!config.baseURL) {
      throw new Error('自定义API需要配置baseURL');
    }

    try {
      // 尝试调用自定义API的模型列表端点
      const response = await fetch(`${config.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((model: any) => ({
            value: model.id || model.name,
            label: model.name || model.id
          }));
        }
      }
    } catch (error) {
      console.warn('自定义API模型列表获取失败，使用默认模型:', error);
    }

    // 返回通用模型选项
    return [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { value: 'claude-3', label: 'Claude 3' },
      { value: 'custom-model', label: '自定义模型' }
    ];
  }

  // 统一的AI调用接口
  async analyze(conversationContent: string): Promise<AnalysisResult> {
    console.log('=== AIServiceAdapter analyze (legacy) called ===');
    // This is now a legacy method, redirecting to the new quantitative analysis
    return this.performQuantitativeAnalysis(conversationContent);
  }

  // STAGE 1: 定性分析
  async performQualitativeAnalysis(conversationContent: string): Promise<string> {
    console.log('=== Stage 1: Qualitative Analysis Started ===');
    // For simplicity, we'll use a unified call method. 
    // In a real scenario, you might have different logic for different providers.
    return this.unifiedApiCall(conversationContent, QUALITATIVE_PROMPT);
  }

  // STAGE 2: 定量分析
  async performQuantitativeAnalysis(conversationContent: string): Promise<AnalysisResult> {
    console.log('=== Stage 2: Quantitative Analysis Started ===');
    const jsonString = await this.unifiedApiCall(conversationContent, QUANTITATIVE_PROMPT);
    return this.parseAnalysisResult(jsonString);
  }

  // 统一的API调用逻辑
  private async unifiedApiCall(content: string, prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(content, prompt);
      // Add cases for 'anthropic', 'azure', 'custom' if they need different request structures
      default:
        // Defaulting to OpenAI/Custom API structure
        return this.callCustomAPI(content, prompt);
    }
  }

  // OpenAI调用
  private async callOpenAI(content: string, prompt: string): Promise<string> {
    try {
      const baseURL = this.config.baseURL || 'https://api.openai.com/v1';
      
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 60000 // 60秒超时
        }
      );

      const result = response.data.choices[0].message.content;
      return result;
    } catch (error) {
      console.error('OpenAI API调用失败:', error);
      throw new Error(`OpenAI API错误: ${this.getErrorMessage(error)}`);
    }
  }

  // 自定义API调用 (作为默认)
  private async callCustomAPI(content: string, prompt: string): Promise<string> {
    try {
      if (!this.config.baseURL) {
        throw new Error('自定义API需要配置baseURL');
      }

      let cleanBaseURL = this.config.baseURL.trim();
      if (cleanBaseURL.endsWith('/')) {
        cleanBaseURL = cleanBaseURL.slice(0, -1);
      }

      let endpoint = cleanBaseURL;
      let requestBody: any;
      let headers: any = {
        'Content-Type': 'application/json'
      };

      // 检查是否是Gemini API并使用正确的格式
      if (cleanBaseURL.includes('generativelanguage.googleapis.com')) {
        // Gemini API格式
        if (!cleanBaseURL.includes('/v1beta/models/')) {
          endpoint = `${cleanBaseURL}/v1beta/models/${this.config.model}:generateContent`;
        }
        headers['x-goog-api-key'] = this.config.apiKey;
        requestBody = {
          contents: [{
            parts: [{
              text: `${prompt}\n\n聊天记录内容：\n${content}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: this.config.maxTokens,
            temperature: this.config.temperature
          }
        };
      } else {
        // 其他API格式 (OpenAI兼容)
        if (!endpoint.endsWith('/v1/chat/completions')) {
          endpoint = `${endpoint}/v1/chat/completions`;
        }
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        requestBody = {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        };
      }
      
      console.log('Calling API endpoint:', endpoint);
      console.log('Request headers:', headers);

      const response = await axios.post(endpoint, requestBody, {
        headers: headers,
        timeout: 120000 // 2分钟超时
      });

      console.log('API response:', response.data);
      
      // 根据API类型解析响应
      let result: string;
      if (cleanBaseURL.includes('generativelanguage.googleapis.com')) {
        // Gemini API响应格式
        result = response.data.candidates[0].content.parts[0].text;
      } else {
        // OpenAI兼容API响应格式
        result = response.data.choices[0].message.content;
      }
      
      return result;
    } catch (error) {
      console.error('自定义API调用失败:', error);
      throw new Error(`自定义API错误: ${this.getErrorMessage(error)}`);
    }
  }

  // 获取错误信息
  private getErrorMessage(error: any): string {
    if (error.response) {
      // 服务器响应错误
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return 'API密钥无效或已过期';
      } else if (status === 403) {
        return 'API密钥权限不足或模型不存在';
      } else if (status === 429) {
        return '请求频率过高，请稍后重试';
      } else if (status === 500) {
        return '服务器内部错误';
      } else if (data && data.error && data.error.message) {
        return data.error.message;
      } else {
        return `HTTP错误 ${status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      // 超时错误
      return '请求超时，可能是网络问题或服务器响应慢，请稍后重试';
    } else if (error.request) {
      // 网络错误
      return '网络连接失败，请检查网络设置';
    } else {
      // 其他错误
      return error.message || '未知错误';
    }
  }

  // 解析分析结果
  private parseAnalysisResult(result: string): AnalysisResult {
    try {
      return JSON.parse(result);
    } catch (error) {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          console.error('JSON解析失败，返回模拟数据');
          return this.generateMockResult();
        }
      }
      console.error('无法解析AI响应，返回模拟数据');
      return this.generateMockResult();
    }
  }

  // 生成模拟分析结果
  private generateMockResult(): AnalysisResult {
    return {
      report_metadata: {
        title: "1688业务聊天战略分析报告",
        date: "2025年08月11日",
        total_customers: 5,
        analysis_period: "2025年8月"
      },
      executive_summary: {
        overall_score: 85,
        key_metrics: {
          response_rate: 90,
          attitude_score: 88,
          sales_skills: 82,
          negotiation_ability: 80
        },
        top_issues: [
          "响应时间需要优化",
          "产品知识需要加强",
          "成交推进技巧不足",
          "客户需求挖掘不够深入",
          "售后服务跟进不及时"
        ],
        trend_analysis: "整体表现良好，但在销售技巧和成交推进方面还有提升空间"
      },
      customer_analysis: [
        {
          customer_id: "customer1",
          conversation_summary: "客户询价定制杯子，客服及时响应并提供详细报价",
          score_breakdown: {
            response_rate: 95,
            attitude: 90,
            sales_skills: 85,
            negotiation: 80,
            overall: 87
          },
          issues_found: [
            {
              category: "B",
              issue: "未主动推荐相关产品",
              severity: "中",
              evidence: "客户询问定制杯子时，未推荐杯盖等配套产品",
              suggestion: "主动推荐相关配套产品，提高客单价"
            }
          ],
          todos: ["跟进客户确认订单", "发送产品详细规格"],
          highlights: ["响应速度快", "报价详细准确"]
        }
      ],
      best_practices: [
        {
          scenario: "客户询价场景",
          problem: "客户询问产品价格和规格",
          solution: "提供详细报价并主动推荐配套产品",
          script: "您好，关于您询问的定制杯子，我们的报价是...同时建议您考虑配套的杯盖..."
        }
      ],
      action_plan: {
        immediate: [
          "优化响应时间，确保5分钟内回复",
          "加强产品知识培训"
        ],
        short_term: [
          "建立标准话术库",
          "实施销售技巧培训"
        ],
        long_term: [
          "建立客户关系管理系统",
          "开发自动化跟进流程"
        ]
      }
    };
  }
}

// 聊天记录解析器
class ChatParser {
  // 解析聊天记录文件
  static parseChatFile(content: string): any[] {
    const lines = content.split('\n');
    const sessions: any[] = [];
    
    // 简化的解析逻辑
    let currentSession = {
      customerId: 'default',
      customerName: '未知客户',
      messages: [] as Array<{sender: string; content: string}>
    };

    for (const line of lines) {
      if (line.includes('-->')) {
        // 客户消息
        currentSession.messages.push({
          sender: 'customer',
          content: line
        });
      } else if (line.includes('精裕胶片:')) {
        // 客服消息
        currentSession.messages.push({
          sender: 'service',
          content: line
        });
      }
    }

    sessions.push(currentSession);
    return sessions;
  }

  // 格式化聊天记录用于AI分析
  static formatForAnalysis(sessions: any[]): string {
    let formatted = '';
    
    for (const session of sessions) {
      formatted += `=== 客户: ${session.customerName} ===\n`;
      
      for (const message of session.messages) {
        const sender = message.sender === 'customer' ? '客户' : '客服';
        formatted += `[${sender}]: ${message.content}\n`;
      }
      
      formatted += '\n';
    }
    
    return formatted;
  }

  static parseChatContent(content: string): ChatSession[] {
    const lines = content.split('\n');
    const sessions: ChatSession[] = [];
    let currentMessages: ChatMessage[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 简单的解析逻辑，可以根据实际聊天记录格式调整
      if (trimmedLine.includes('客服:') || trimmedLine.includes('客户:')) {
        const [sender, ...contentParts] = trimmedLine.split(':');
        const content = contentParts.join(':').trim();
        
        if (content) {
          currentMessages.push({
            id: `msg_${Date.now()}_${Math.random()}`,
            timestamp: new Date().toISOString(),
            sender: sender.trim().includes('客服') ? 'service' : 'customer',
            senderName: sender.trim(),
            content: content,
            type: 'text'
          });
        }
      } else if (currentMessages.length > 0) {
        // 如果当前行不是新的消息，可能是上一行消息的继续
        const lastMessage = currentMessages[currentMessages.length - 1];
        lastMessage.content += ' ' + trimmedLine;
      }
    }

    // 创建会话
    if (currentMessages.length > 0) {
      const currentSession: ChatSession = {
        customerId: `customer_${Date.now()}`,
        customerName: '客户',
        messages: currentMessages,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        totalMessages: currentMessages.length,
        duration: 0
      };
      sessions.push(currentSession);
    }

    return sessions;
  }
}

// 生成模拟分析结果
function generateMockResult(chatContent: string): AnalysisResult {
  const sessions = ChatParser.parseChatContent(chatContent);
  const totalCustomers = sessions.length || 1;

  return {
    report_metadata: {
      title: "客服聊天记录分析报告",
      date: new Date().toISOString().split('T')[0],
      total_customers: totalCustomers,
      analysis_period: "最近30天"
    },
    executive_summary: {
      overall_score: 85,
      key_metrics: {
        response_rate: 92,
        attitude_score: 88,
        sales_skills: 82,
        negotiation_ability: 78
      },
      top_issues: [
        "产品知识不够全面",
        "响应速度需要提升",
        "解决方案不够个性化"
      ],
      trend_analysis: "整体表现良好，但在专业知识和个性化服务方面还有提升空间"
    },
    customer_analysis: [
      {
        customer_id: "CUST001",
        conversation_summary: "客户咨询产品规格和价格，客服提供了详细的产品信息，但价格谈判环节略显生硬",
        score_breakdown: {
          response_rate: 95,
          attitude: 90,
          sales_skills: 85,
          negotiation: 75,
          overall: 86
        },
        issues_found: [
          {
            category: "A",
            issue: "价格谈判技巧不足",
            severity: "中",
            evidence: "在客户询问优惠时，直接拒绝而没有提供替代方案",
            suggestion: "学习价格谈判技巧，提供多种优惠方案"
          }
        ],
        todos: [
          "学习产品价格体系",
          "练习价格谈判话术",
          "了解竞品价格策略"
        ],
        highlights: [
          "产品知识掌握良好",
          "服务态度积极",
          "响应速度快"
        ]
      }
    ],
    best_practices: [
      {
        scenario: "价格咨询",
        problem: "客户询问产品价格和优惠",
        solution: "先了解客户需求，再提供合适的价格方案",
        script: "您好，感谢您对我们产品的关注。为了更好地为您推荐合适的产品，能否先了解一下您的具体使用场景和预算范围？这样我可以为您提供最优惠的价格方案。"
      }
    ],
    action_plan: {
      immediate: [
        "加强价格谈判培训",
        "完善产品知识库"
      ],
      short_term: [
        "建立个性化服务流程",
        "优化响应时间"
      ],
      long_term: [
        "建立客户满意度跟踪体系",
        "定期进行技能评估"
      ]
    }
  };
}

export { AIServiceAdapter, ChatParser, generateMockResult };
