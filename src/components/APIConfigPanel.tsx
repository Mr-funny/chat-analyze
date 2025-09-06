import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, InputNumber, Slider, Button, Space, Alert, message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, ReloadOutlined } from '@ant-design/icons';
import { APIConfig, PRESET_CONFIGS, ValidationResult, TestResult } from '../types';
import { configManager, ConfigValidator } from '../services/configManager';
import { AIServiceAdapter } from '../services/aiAnalysis';

interface APIConfigPanelProps {
  onConfigChange: (config: APIConfig | null) => void;
  onConfigValid: (isValid: boolean) => void;
}

interface ModelOption {
  value: string;
  label: string;
}

const APIConfigPanel: React.FC<APIConfigPanelProps> = ({ onConfigChange, onConfigValid }) => {
  const [config, setConfig] = useState<APIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = async () => {
    try {
      const savedConfig = await configManager.loadConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        form.setFieldsValue(savedConfig);
        const validation = ConfigValidator.validateConfig(savedConfig);
        onConfigValid(validation.isValid);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleSaveConfig = async (values: any) => {
    console.log('=== APIConfigPanel handleSaveConfig called ===');
    console.log('Form values:', values);
    
    setIsLoading(true);
    try {
      const newConfig: APIConfig = {
        provider: values.provider,
        apiKey: values.apiKey,
        baseURL: values.baseURL,
        model: values.model,
        maxTokens: values.maxTokens || 4000,
        temperature: values.temperature || 0.3
      };

      console.log('Saving config:', newConfig);
      await configManager.saveConfig(newConfig);
      setConfig(newConfig);
      onConfigChange(newConfig);
      
      const validation = ConfigValidator.validateConfig(newConfig);
      onConfigValid(validation.isValid);
      
      console.log('Config saved successfully');
      message.success('配置保存成功！', 3);
      
      // 显示保存的配置信息
      message.info(`已保存配置：${newConfig.provider} - ${newConfig.model}`, 3);
    } catch (error) {
      console.error('Config save error:', error);
      message.error('配置保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;
    
    setIsLoading(true);
    try {
      const result = await ConfigValidator.testConnection(config);
      setTestResult(result);
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error('连接测试失败');
      }
    } catch (error) {
      message.error('测试连接时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConfig = async () => {
    try {
      await configManager.clearConfig();
      setConfig(null);
      onConfigChange(null);
      onConfigValid(false);
      form.resetFields();
      setTestResult(null);
      setAvailableModels([]);
      message.success('配置已清除');
    } catch (error) {
      message.error('清除配置失败');
    }
  };

  const handleProviderChange = (provider: string) => {
    console.log('Provider changed to:', provider);
    const preset = PRESET_CONFIGS[provider as keyof typeof PRESET_CONFIGS];
    if (preset && preset.models.length > 0) {
      // 只有预设提供商且有模型时才设置默认模型
      form.setFieldsValue({
        baseURL: preset.baseURL,
        model: preset.models[0]?.value || ''
      });
      setAvailableModels(preset.models || []);
    } else {
      // 对于自定义API，只清空baseURL，保留用户输入的模型名称
      form.setFieldsValue({
        baseURL: ''
      });
      setAvailableModels([]);
    }
  };

  const getModelOptions = (provider: string) => {
    const preset = PRESET_CONFIGS[provider as keyof typeof PRESET_CONFIGS];
    return preset?.models || [];
  };

  // 动态获取可用模型列表
  const fetchAvailableModels = async () => {
    const currentValues = form.getFieldsValue();
    const { provider, apiKey, baseURL } = currentValues;
    
    if (!apiKey) {
      message.warning('请先输入API密钥');
      return;
    }

    setIsLoadingModels(true);
    try {
      // 创建临时配置对象
      const tempConfig: APIConfig = {
        provider: provider as any,
        apiKey: apiKey,
        baseURL: baseURL,
        model: '',
        maxTokens: 4000,
        temperature: 0.3
      };

      // 调用AIServiceAdapter获取模型列表
      const models = await AIServiceAdapter.getAvailableModels(tempConfig);
      setAvailableModels(models);
      message.success(`成功获取到 ${models.length} 个可用模型`);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      message.error('获取模型列表失败，请检查API配置');
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <Card title="AI模型配置" className="api-config-panel">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveConfig}
        initialValues={{
          provider: 'openai',
          maxTokens: 4000,
          temperature: 0.3
        }}
      >
        {/* 服务提供商选择 */}
        <Form.Item 
          label="服务提供商" 
          name="provider"
          rules={[{ required: true, message: '请选择服务提供商' }]}
        >
          <Select onChange={handleProviderChange}>
            <Select.Option value="openai">OpenAI (GPT-4)</Select.Option>
            <Select.Option value="anthropic">Anthropic (Claude)</Select.Option>
            <Select.Option value="azure">Azure OpenAI</Select.Option>
            <Select.Option value="custom">自定义API</Select.Option>
          </Select>
        </Form.Item>

        {/* API密钥输入 */}
        <Form.Item 
          label="API密钥" 
          name="apiKey"
          rules={[{ required: true, message: '请输入API密钥' }]}
        >
          <Input.Password
            placeholder="请输入您的API密钥"
            addonAfter={
              <Button
                type="text"
                icon={showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowApiKey(!showApiKey)}
              />
            }
          />
        </Form.Item>

        {/* 基础URL */}
        <Form.Item 
          label="API地址" 
          name="baseURL"
          extra="留空使用默认地址"
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        {/* 模型选择 */}
        <Form.Item 
          label="模型选择" 
          name="model"
          rules={[{ required: true, message: '请选择或输入AI模型' }]}
        >
          <Input 
            placeholder="请选择或输入模型名称，如：gpt-4, claude-3, gemini-2.5-pro"
            allowClear
          />
        </Form.Item>
        
        {/* 模型选项列表 */}
        <datalist id="model-options">
          {availableModels.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </datalist>
        
        {/* 获取模型按钮 */}
        <Form.Item>
          <Space>
            <Button 
              type="link" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={fetchAvailableModels}
              loading={isLoadingModels}
            >
              获取可用模型
            </Button>
            <span style={{ color: '#666', fontSize: '12px' }}>
              支持手动输入或自动获取
            </span>
          </Space>
        </Form.Item>

        {/* 参数配置 */}
        <Form.Item label="最大Token数" name="maxTokens">
          <InputNumber
            min={1000}
            max={65536}
            style={{ width: '100%' }}
            placeholder="4000"
          />
        </Form.Item>

        <Form.Item label="温度参数" name="temperature">
          <Slider
            min={0}
            max={2}
            step={0.1}
            marks={{
              0: '0',
              0.5: '0.5',
              1: '1',
              1.5: '1.5',
              2: '2'
            }}
          />
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={isLoading}
            >
              保存配置
            </Button>
            <Button 
              onClick={handleTestConnection}
              loading={isLoading}
            >
              测试连接
            </Button>
            <Button 
              danger
              onClick={handleClearConfig}
            >
              清除配置
            </Button>
          </Space>
        </Form.Item>

        {/* 测试结果 */}
        {testResult && (
          <Alert
            message={testResult.message}
            type={testResult.success ? 'success' : 'error'}
            description={testResult.error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 安全提示 */}
        <Alert
          message="安全提示"
          description="您的API密钥已加密存储在本地设备中，不会上传到服务器。请确保您的设备安全。"
          type="info"
          showIcon
        />
      </Form>
    </Card>
  );
};

export default APIConfigPanel;
