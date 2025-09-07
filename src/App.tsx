import React, { useState, useEffect } from 'react';
import { Layout, Typography, Spin, Empty, message, Button, Menu, Card, Progress } from 'antd';
import { CustomerServiceOutlined, PlayCircleOutlined, HistoryOutlined, FileTextOutlined, AppstoreOutlined } from '@ant-design/icons';
import APIConfigPanel from './components/APIConfigPanel';
import FileUpload from './components/FileUpload';
import AnalysisReport from './components/AnalysisReport';
import ReportHistory from './components/ReportHistory';
import BatchUpload from './components/BatchUpload';
import { APIConfig, FileUploadState, AnalysisResult, FullAnalysisResult } from './types';
import { configManager } from './services/configManager';
import { AIServiceAdapter } from './services/aiAnalysis';
import PDFExportService from './services/pdfExport';
import { reportManager } from './services/reportManager';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const [config, setConfig] = useState<APIConfig | null>(null);
  const [isConfigValid, setIsConfigValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    error: null
  });
  
  const [chatContent, setChatContent] = useState<string>('');

  const [analysisState, setAnalysisState] = useState<{
    isAnalyzing: boolean;
    progress: number;
    currentStep: string;
    result: FullAnalysisResult | null; 
    error: string | null;
  }>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    result: null,
    error: null,
  });

  const [currentView, setCurrentView] = useState<'analysis' | 'history' | 'batch'>('analysis');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const savedConfig = await configManager.loadConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setIsConfigValid(true);
      }
    } catch (error) {
      console.error('初始化应用失败:', error);
      message.error('加载配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (newConfig: APIConfig | null) => {
    setConfig(newConfig);
  };

  const handleConfigValid = (isValid: boolean) => {
    setIsConfigValid(isValid);
  };

  const handleFileUploaded = (content: string) => {
    message.success('文件上传成功，可以开始分析了！');
    setChatContent(content);
    setAnalysisState({
      isAnalyzing: false,
      progress: 0,
      currentStep: '',
      result: null,
      error: null,
    });
  };

  const handleUploadStateChange = (state: FileUploadState) => {
    setFileUploadState(state);
  };
  
  const handleStartAnalysis = async () => {
    if (!config) {
      message.error('请先配置AI模型参数');
      return;
    }
    if (!chatContent) {
      message.error('请先上传聊天记录文件');
      return;
    }

    setAnalysisState({
      isAnalyzing: true,
      progress: 0,
      currentStep: '正在初始化...',
      result: null,
      error: null
    });

    try {
      const adapter = new AIServiceAdapter(config);
      
      const onProgress = (progress: number, currentStep: string) => {
        setAnalysisState(prev => ({ ...prev, progress, currentStep }));
      };

      const fullResult = await adapter.performFullAnalysis(chatContent, onProgress);

      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
        currentStep: '分析完成！',
        result: fullResult,
        error: null
      }));
      
      message.success('分析完成！');

      if (fileUploadState.file && fullResult.quantitative) {
        try {
          await reportManager.saveReport(fullResult.quantitative, fileUploadState.file.name, config);
          message.info('报告已保存到历史记录');
        } catch (error) {
           message.warning('保存报告到历史记录失败');
        }
      }

    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : '分析失败'
      }));
      message.error('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleExportPDF = async () => {
    if (!analysisState.result) {
      message.error('没有可导出的分析结果');
      return;
    }
    try {
      await PDFExportService.exportFullReport('full-report-container');
      message.success('PDF导出成功！');
    } catch (error) {
      message.error('PDF导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Title level={4}>正在加载应用...</Title>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <CustomerServiceOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            1688客服聊天分析系统
          </Title>
        </Header>
        
        <Layout>
          <Sider 
            width={350} 
            theme="light"
            style={{ 
              borderRight: '1px solid #f0f0f0',
              padding: '16px'
            }}
          >
            <APIConfigPanel 
              onConfigChange={handleConfigChange}
              onConfigValid={handleConfigValid}
            />
            
            {/* 导航菜单 */}
            <div style={{ marginTop: 24 }}>
              <Menu
                mode="inline"
                selectedKeys={[currentView]}
                onSelect={({ key }) => setCurrentView(key as 'analysis' | 'history')}
                items={[
                  {
                    key: 'analysis',
                    icon: <FileTextOutlined />,
                    label: '分析功能'
                  },
                  {
                    key: 'batch',
                    icon: <AppstoreOutlined />,
                    label: '批量处理'
                  },
                  {
                    key: 'history',
                    icon: <HistoryOutlined />,
                    label: '报告历史'
                  }
                ]}
              />
            </div>
          </Sider>
          
          <Content style={{ 
            padding: '24px',
            background: '#f5f5f5'
          }}>
            {!isConfigValid ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '60vh',
                flexDirection: 'column'
              }}>
                <Empty 
                  description="请先配置AI模型参数"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <p>在左侧配置面板中设置您的AI模型参数后，即可开始分析聊天记录</p>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: currentView === 'history' || currentView === 'batch' ? '1200px' : '800px', margin: '0 auto' }}>
                {currentView === 'analysis' ? (
                  <>
                    <FileUpload 
                      onFileUploaded={handleFileUploaded}
                      onUploadStateChange={handleUploadStateChange}
                    />
                    
                    {fileUploadState.file && !fileUploadState.isUploading && !fileUploadState.error && (
                      <Card style={{ marginTop: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <Button 
                            type="primary" 
                            size="large"
                            icon={<PlayCircleOutlined />}
                            onClick={handleStartAnalysis}
                            loading={analysisState.isAnalyzing}
                            disabled={!config}
                          >
                            开始分析聊天记录
                          </Button>
                          <div style={{ marginTop: 8 }}>
                            <Typography.Text type="secondary">
                              点击开始分析，系统将使用AI模型分析您的聊天记录
                            </Typography.Text>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analysisState.isAnalyzing && (
                      <Card style={{ marginTop: 16 }}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          <Title level={4}>正在分析聊天记录...</Title>
                          <p>{analysisState.currentStep}</p>
                        </div>
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                          <Progress percent={analysisState.progress} status="active" />
                        </div>
                      </Card>
                    )}

                    {analysisState.result && (
                       <div style={{ marginTop: 24 }} id="full-report-container">
                         <AnalysisReport 
                           result={analysisState.result}
                           onExportPDF={handleExportPDF}
                         />
                       </div>
                    )}

                    {analysisState.error && (
                      <Card style={{ marginTop: 16 }}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          <Title level={4} style={{ color: '#ff4d4f' }}>分析失败</Title>
                          <p>{analysisState.error}</p>
                        </div>
                      </Card>
                    )}
                  </>
                ) : currentView === 'batch' ? (
                  <BatchUpload onBatchComplete={() => message.info('批量处理完成，原Excel导出功能已移除。')} />
                ) : (
                  <ReportHistory />
                )}
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;
