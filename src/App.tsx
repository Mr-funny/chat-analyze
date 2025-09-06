import React, { useState, useEffect } from 'react';
import { Layout, Typography, Spin, Empty, message, Button, Menu, Card, Progress } from 'antd';
import { CustomerServiceOutlined, PlayCircleOutlined, HistoryOutlined, FileTextOutlined, AppstoreOutlined } from '@ant-design/icons';
import APIConfigPanel from './components/APIConfigPanel';
import FileUpload from './components/FileUpload';
import AnalysisReport from './components/AnalysisReport';
import ReportHistory from './components/ReportHistory';
import BatchUpload from './components/BatchUpload';
import { APIConfig, FileUploadState, AnalysisState } from './types';
import { configManager } from './services/configManager';
import { AIServiceAdapter } from './services/aiAnalysis';
import PDFExportService from './services/pdfExport';
import ExcelExportService from './services/excelExport';
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
  const [analysisState, setAnalysisState] = useState<{
    isAnalyzing: boolean;
    progress: number;
    currentStep: string;
    qualitativeResult: string | null;
    quantitativeResult: AnalysisState['result'] | null;
    error: string | null;
    chatContent: string;
  }>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    qualitativeResult: null,
    quantitativeResult: null,
    error: null,
    chatContent: ''
  });

  const [currentView, setCurrentView] = useState<'analysis' | 'history' | 'batch'>('analysis');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 加载保存的配置
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
    console.log('=== App handleConfigChange called ===');
    console.log('New config:', newConfig);
    setConfig(newConfig);
  };

  const handleConfigValid = (isValid: boolean) => {
    setIsConfigValid(isValid);
  };

  const handleFileUploaded = (content: string) => {
    console.log('=== App handleFileUploaded called ===');
    console.log('File uploaded, content length:', content.length);
    console.log('Content preview:', content.substring(0, 200));
    message.success('文件上传成功，可以开始分析了！');
    // 保存聊天内容用于后续分析
    setAnalysisState(prev => {
      console.log('Setting analysis state with chat content');
      return {
        ...prev,
        chatContent: content
      };
    });
  };

  const handleUploadStateChange = (state: FileUploadState) => {
    console.log('Upload state changed:', state);
    setFileUploadState(state);
  };

  const handleStartAnalysis = async () => {
    if (!config) {
      message.error('请先配置AI模型参数');
      return;
    }

    if (!analysisState.chatContent) {
      message.error('请先上传聊天记录文件');
      return;
    }

    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      currentStep: '正在初始化...',
      qualitativeResult: null,
      quantitativeResult: null,
      error: null
    }));

    try {
      console.log('Starting analysis with config:', config);
      const adapter = new AIServiceAdapter(config);
      
      // STAGE 1: 定性分析
      setAnalysisState(prev => ({
        ...prev,
        progress: 25,
        currentStep: '第一阶段：正在进行整体情况评估...'
      }));
      const qualResult = await adapter.performQualitativeAnalysis(analysisState.chatContent);
      setAnalysisState(prev => ({
        ...prev,
        progress: 50,
        qualitativeResult: qualResult
      }));

      // STAGE 2: 定量分析
      setAnalysisState(prev => ({
        ...prev,
        progress: 75,
        currentStep: '第二阶段：正在进行深度量化分析...'
      }));
      const quantResult = await adapter.performQuantitativeAnalysis(analysisState.chatContent);

      // 分析完成
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
        currentStep: '分析完成！',
        quantitativeResult: quantResult,
        error: null
      }));

      // 保存报告到历史记录 (使用定量结果)
      if (fileUploadState.file) {
        try {
          await reportManager.saveReport(quantResult, fileUploadState.file.name, config);
          message.success('分析完成！报告已保存到历史记录');
        } catch (error) {
          message.success('分析完成！但保存报告失败');
        }
      } else {
        message.success('分析完成！');
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
    if (!analysisState.quantitativeResult) {
      message.error('没有可导出的分析结果');
      return;
    }
    // The PDF export should now target the component that renders BOTH results.
    // We will assume pdfExport service can handle this.
    try {
      await PDFExportService.exportFullReport('full-report-container');
      message.success('PDF导出成功！');
    } catch (error) {
      message.error('PDF导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleExportExcel = async () => {
    if (!analysisState.quantitativeResult) {
      message.error('没有可导出的分析结果');
      return;
    }
    try {
      await ExcelExportService.exportAnalysisResult(analysisState.quantitativeResult);
      message.success('Excel导出成功！');
    } catch (error) {
      message.error('Excel导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleBatchComplete = async (results: any[]) => {
    try {
      await ExcelExportService.exportBatchResults(results);
      message.success('批量分析结果导出成功！');
    } catch (error) {
      message.error('批量结果导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
                    
                    {/* 调试信息 */}
                    <Card style={{ marginTop: 16, backgroundColor: '#f0f0f0' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <div>调试信息：</div>
                        <div>文件状态: {fileUploadState.file ? '已上传' : '未上传'}</div>
                        <div>上传中: {fileUploadState.isUploading ? '是' : '否'}</div>
                        <div>错误: {fileUploadState.error || '无'}</div>
                        <div>聊天内容长度: {analysisState.chatContent?.length || 0}</div>
                      </div>
                    </Card>

                    {/* 开始分析按钮 */}
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
                    
                    {/* 分析状态显示 */}
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

                    {/* 分析结果显示 */}
                    {(analysisState.qualitativeResult || analysisState.quantitativeResult) && (
                      <div style={{ marginTop: 24 }} id="full-report-container">
                        <AnalysisReport 
                          qualitativeResult={analysisState.qualitativeResult}
                          quantitativeResult={analysisState.quantitativeResult}
                          onExportPDF={handleExportPDF}
                          onExportExcel={handleExportExcel}
                        />
                      </div>
                    )}

                    {/* 错误显示 */}
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
                  <BatchUpload onBatchComplete={handleBatchComplete} />
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
