// AI服务商类型
export type AIProvider = 'openai' | 'anthropic' | 'azure' | 'custom';

// API配置接口
export interface APIConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  lastUpdated?: string;
}

// 分析结果接口
export interface AnalysisResult {
  report_metadata: ReportMetadata;
  executive_summary: ExecutiveSummary;
  customer_analysis: CustomerAnalysis[];
  best_practices: BestPractice[];
  action_plan: ActionPlan;
}

// 报告元数据
export interface ReportMetadata {
  title: string;
  date: string;
  total_customers: number;
  analysis_period: string;
}

// 执行摘要
export interface ExecutiveSummary {
  overall_score: number;
  key_metrics: KeyMetrics;
  top_issues: string[];
  trend_analysis: string;
}

// 关键指标
export interface KeyMetrics {
  response_rate: number;
  attitude_score: number;
  sales_skills: number;
  negotiation_ability: number;
}

// 客户分析
export interface CustomerAnalysis {
  customer_id: string;
  conversation_summary: string;
  score_breakdown: ScoreBreakdown;
  issues_found: Issue[];
  todos: string[];
  highlights: string[];
}

// 评分明细
export interface ScoreBreakdown {
  response_rate: number;
  attitude: number;
  sales_skills: number;
  negotiation: number;
  overall: number;
}

// 问题详情
export interface Issue {
  category: 'A' | 'B' | 'C';
  issue: string;
  severity: '高' | '中' | '低';
  evidence: string;
  suggestion: string;
}

// 最佳实践
export interface BestPractice {
  scenario: string;
  problem: string;
  solution: string;
  script: string;
}

// 行动方案
export interface ActionPlan {
  immediate: string[];
  short_term: string[];
  long_term: string[];
}

// 文件上传相关
export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// 分析状态
export interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  result: AnalysisResult | null;
  error: string | null;
  chatContent?: string;
}

// 配置验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 连接测试结果
export interface TestResult {
  success: boolean;
  responseTime?: number;
  error?: string;
  message: string;
}

// 安全事件
export interface SecurityEvent {
  type: 'config_change' | 'api_call' | 'error' | 'login_attempt';
  details: string;
  timestamp: string;
  userAgent: string;
  ip: string;
}

// 安全警报
export interface SecurityAlert {
  level: 'info' | 'warning' | 'error';
  message: string;
  details: string;
}

// 安全报告
export interface SecurityReport {
  totalEvents: number;
  recentEvents: SecurityEvent[];
  anomalies: SecurityAlert[];
  lastUpdated: string;
}

// 聊天记录解析结果
export interface ChatMessage {
  id: string;
  timestamp: string;
  sender: 'customer' | 'service';
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
}

export interface ChatSession {
  customerId: string;
  customerName: string;
  startTime: string;
  endTime: string;
  messages: ChatMessage[];
  totalMessages: number;
  duration: number; // 分钟
}

// 预设配置
export interface PresetConfig {
  provider: AIProvider;
  baseURL: string;
  models: ModelOption[];
}

export interface ModelOption {
  label: string;
  value: string;
  description?: string;
}

// 预设配置映射
export const PRESET_CONFIGS: Record<AIProvider, PresetConfig> = {
  openai: {
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    models: [
      { label: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview', description: '最新版本，支持128K上下文' },
      { label: 'GPT-4', value: 'gpt-4', description: '标准GPT-4模型' },
      { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', description: '快速且经济的选择' }
    ]
  },
  anthropic: {
    provider: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    models: [
      { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229', description: '最强大的模型' },
      { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229', description: '平衡性能和速度' },
      { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307', description: '快速且经济' }
    ]
  },
  azure: {
    provider: 'azure',
    baseURL: '',
    models: [
      { label: 'GPT-4', value: 'gpt-4', description: 'Azure OpenAI GPT-4' },
      { label: 'GPT-3.5 Turbo', value: 'gpt-35-turbo', description: 'Azure OpenAI GPT-3.5' }
    ]
  },
  custom: {
    provider: 'custom',
    baseURL: '',
    models: []
  }
};

// 应用状态
export interface AppState {
  config: APIConfig | null;
  isConfigValid: boolean;
  fileUpload: FileUploadState;
  analysis: AnalysisState;
  security: SecurityReport;
}


