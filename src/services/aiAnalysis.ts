import { APIConfig, AnalysisResult, ChatMessage, ChatSession } from '../types';
import axios from 'axios';

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
    console.log('=== AIServiceAdapter analyze called ===');
    console.log('Config used for analysis:', this.config);
    console.log('Provider:', this.config.provider);
    console.log('Model:', this.config.model);
    
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(conversationContent);
      case 'anthropic':
        return this.callAnthropic(conversationContent);
      case 'azure':
        return this.callAzureOpenAI(conversationContent);
      case 'custom':
        return this.callCustomAPI(conversationContent);
      default:
        // 如果没有配置或配置无效，返回模拟数据
        console.log('Using mock result due to invalid config');
        return this.generateMockResult(conversationContent);
    }
  }

  // OpenAI调用
  private async callOpenAI(content: string): Promise<AnalysisResult> {
    try {
      const baseURL = this.config.baseURL || 'https://api.openai.com/v1';
      
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getAnalysisPrompt()
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
      return this.parseAnalysisResult(result);
    } catch (error) {
      console.error('OpenAI API调用失败:', error);
      throw new Error(`OpenAI API错误: ${this.getErrorMessage(error)}`);
    }
  }

  // Anthropic调用
  private async callAnthropic(content: string): Promise<AnalysisResult> {
    try {
      const baseURL = this.config.baseURL || 'https://api.anthropic.com/v1';
      
      const response = await axios.post(
        `${baseURL}/messages`,
        {
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [
            {
              role: 'user',
              content: `${this.getAnalysisPrompt()}\n\n聊天记录内容：\n${content}`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000
        }
      );

      const result = response.data.content[0].text;
      return this.parseAnalysisResult(result);
    } catch (error) {
      console.error('Anthropic API调用失败:', error);
      throw new Error(`Anthropic API错误: ${this.getErrorMessage(error)}`);
    }
  }

  // Azure OpenAI调用
  private async callAzureOpenAI(content: string): Promise<AnalysisResult> {
    try {
      if (!this.config.baseURL) {
        throw new Error('Azure OpenAI需要配置baseURL');
      }

      const response = await axios.post(
        `${this.config.baseURL}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-05-15`,
        {
          messages: [
            {
              role: 'system',
              content: this.getAnalysisPrompt()
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
            'api-key': this.config.apiKey
          },
          timeout: 60000
        }
      );

      const result = response.data.choices[0].message.content;
      return this.parseAnalysisResult(result);
    } catch (error) {
      console.error('Azure OpenAI API调用失败:', error);
      throw new Error(`Azure OpenAI API错误: ${this.getErrorMessage(error)}`);
    }
  }

  // 自定义API调用
  private async callCustomAPI(content: string): Promise<AnalysisResult> {
    try {
      if (!this.config.baseURL) {
        throw new Error('自定义API需要配置baseURL');
      }

      // 清理baseURL，移除末尾的冒号
      let cleanBaseURL = this.config.baseURL.trim();
      if (cleanBaseURL.endsWith(':')) {
        cleanBaseURL = cleanBaseURL.slice(0, -1);
      }

      console.log('Calling custom API with config:', {
        originalBaseURL: this.config.baseURL,
        cleanBaseURL: cleanBaseURL,
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      // 检查内容长度，如果太长则截断
      const prompt = this.getAnalysisPrompt();
      const fullContent = `${prompt}\n\n聊天记录内容：\n${content}`;
      
      console.log('Request content length:', fullContent.length);
      
      // 如果内容超过100KB，截断聊天记录
      let finalContent = fullContent;
      if (fullContent.length > 100000) {
        const maxChatLength = 100000 - prompt.length - 100; // 保留一些空间
        finalContent = `${prompt}\n\n聊天记录内容：\n${content.substring(0, maxChatLength)}...\n(内容已截断，仅分析前${Math.floor(maxChatLength/1000)}KB)`;
        console.log('Content truncated to:', finalContent.length);
      }

      const response = await axios.post(
        cleanBaseURL,
        {
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: finalContent
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 120000 // 增加到2分钟
        }
      );

      console.log('Custom API response:', response.data);
      const result = response.data.choices[0].message.content;
      return this.parseAnalysisResult(result);
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

  // 获取分析提示词
  private getAnalysisPrompt(): string {
    return `你是1688 B端店铺业务分析师。请分析以下客服聊天记录，输出JSON格式：

{
  "report_metadata": {
    "title": "1688业务聊天分析报告",
    "date": "2025年08月11日",
    "total_customers": 1,
    "analysis_period": "单次对话"
  },
  "executive_summary": {
    "overall_score": 85,
    "key_metrics": {
      "response_rate": 90,
      "attitude_score": 85,
      "sales_skills": 80,
      "negotiation_ability": 85
    },
    "top_issues": ["响应速度", "产品知识", "价格谈判", "客户需求理解", "跟进服务"],
    "trend_analysis": "客服表现良好，需要加强产品知识"
  },
  "customer_analysis": [
    {
      "customer_id": "客户ID",
      "conversation_summary": "对话摘要",
      "score_breakdown": {
        "response_rate": 数字,
        "attitude": 数字,
        "sales_skills": 数字,
        "negotiation": 数字,
        "overall": 数字
      },
      "issues_found": [
        {
          "category": "A/B/C",
          "issue": "具体问题",
          "severity": "高/中/低",
          "evidence": "引用原文",
          "suggestion": "改进建议"
        }
      ],
      "todos": ["待办1", "待办2"],
      "highlights": ["亮点1", "亮点2"]
    }
  ],
  "best_practices": [
    {
      "scenario": "场景描述",
      "problem": "面临问题",
      "solution": "解决方案",
      "script": "推荐话术"
    }
  ],
  "action_plan": {
    "immediate": ["立即行动1", "立即行动2"],
    "short_term": ["短期计划1", "短期计划2"],
    "long_term": ["长期计划1", "长期计划2"]
  }
}

## 分析要求
1. 从专业性、响应效率、问题解决、沟通技巧、业务转化等维度评估
2. 识别关键问题和改进机会
3. 提供具体的改进建议
4. 生成结构化的分析报告

## 评分标准
- 回复响应率 (30%): 根据首次响应和平均响应时间计算
- 回复态度 (20%): 主要依据服务态度和语气
- 销售技巧 (30%): 主要依据需求挖掘和成交推进
- 谈判能力 (20%): 重点评估价值塑造和主动推进成交

请确保输出的是有效的JSON格式，可以直接解析。`;
  }

  // 解析分析结果
  private parseAnalysisResult(result: string): AnalysisResult {
    try {
      // 尝试直接解析JSON
      return JSON.parse(result);
    } catch (error) {
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          console.error('JSON解析失败，返回模拟数据');
          return this.generateMockResult('');
        }
      }
      console.error('无法解析AI响应，返回模拟数据');
      return this.generateMockResult('');
    }
  }

  // 生成模拟分析结果
  private generateMockResult(content: string): AnalysisResult {
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
