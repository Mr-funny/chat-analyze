import React, { useState } from 'react';
import { Upload, Button, Card, Progress, Alert, message, Typography, List, Tag, Space, Modal } from 'antd';
import { InboxOutlined, DeleteOutlined, PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface BatchFile {
  uid: string;
  name: string;
  content: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

interface BatchUploadProps {
  onBatchComplete?: (results: any[]) => void;
}

const BatchUpload: React.FC<BatchUploadProps> = ({ onBatchComplete }) => {
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // 处理文件上传
  const handleFileUpload = async (file: File): Promise<boolean> => {
    try {
      const content = await readFileContent(file);
      const newFile: BatchFile = {
        uid: `${Date.now()}_${Math.random()}`,
        name: file.name,
        content: content,
        status: 'pending',
        progress: 0
      };

      setBatchFiles(prev => [...prev, newFile]);
      return true;
    } catch (error) {
      message.error(`文件 ${file.name} 读取失败`);
      return false;
    }
  };

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  };

  // 删除文件
  const handleRemoveFile = (uid: string) => {
    setBatchFiles(prev => prev.filter(file => file.uid !== uid));
  };

  // 清空所有文件
  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有文件吗？',
      onOk: () => {
        setBatchFiles([]);
        setOverallProgress(0);
      }
    });
  };

  // 开始批量分析
  const handleStartBatchAnalysis = async () => {
    if (batchFiles.length === 0) {
      message.error('请先添加文件');
      return;
    }

    setIsAnalyzing(true);
    setOverallProgress(0);

    const results: any[] = [];

    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      
      // 更新文件状态为分析中
      setBatchFiles(prev => prev.map(f => 
        f.uid === file.uid 
          ? { ...f, status: 'analyzing', progress: 0 }
          : f
      ));

      try {
        // 模拟分析过程
        for (let step = 0; step < 3; step++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const fileProgress = ((step + 1) / 3) * 100;
          const overallProgress = ((i + fileProgress / 100) / batchFiles.length) * 100;
          
          setBatchFiles(prev => prev.map(f => 
            f.uid === file.uid 
              ? { ...f, progress: fileProgress }
              : f
          ));
          setOverallProgress(overallProgress);
        }

        // 生成模拟结果
        const mockResult = {
          fileName: file.name,
          overallScore: Math.floor(Math.random() * 40) + 60,
          customerCount: Math.floor(Math.random() * 10) + 1,
          analysisDate: new Date().toLocaleDateString()
        };

        // 更新文件状态为完成
        setBatchFiles(prev => prev.map(f => 
          f.uid === file.uid 
            ? { ...f, status: 'completed', progress: 100, result: mockResult }
            : f
        ));

        results.push(mockResult);

      } catch (error) {
        // 更新文件状态为错误
        setBatchFiles(prev => prev.map(f => 
          f.uid === file.uid 
            ? { ...f, status: 'error', error: '分析失败' }
            : f
        ));
      }
    }

    setIsAnalyzing(false);
    
    if (onBatchComplete) {
      onBatchComplete(results);
    }

    message.success(`批量分析完成！成功分析 ${results.length} 个文件`);
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'analyzing':
        return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'analyzing':
        return 'processing';
      default:
        return 'default';
    }
  };

  return (
    <div>
      {/* 批量上传区域 */}
      <Card title="批量文件上传" style={{ marginBottom: 16 }}>
        <Dragger
          multiple
          accept=".txt"
          beforeUpload={(file) => {
            handleFileUpload(file);
            return false;
          }}
          showUploadList={false}
          disabled={isAnalyzing}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或多个TXT文件，每个文件最大10MB
          </p>
        </Dragger>

        {/* 操作按钮 */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleStartBatchAnalysis}
              loading={isAnalyzing}
              disabled={batchFiles.length === 0}
            >
              开始批量分析
            </Button>
            <Button 
              icon={<DeleteOutlined />}
              onClick={handleClearAll}
              disabled={batchFiles.length === 0 || isAnalyzing}
            >
              清空所有
            </Button>
          </Space>
        </div>
      </Card>

      {/* 文件列表 */}
      {batchFiles.length > 0 && (
        <Card title={`文件列表 (${batchFiles.length})`} style={{ marginBottom: 16 }}>
          {/* 总体进度 */}
          {isAnalyzing && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>总体进度：</Text>
              <Progress percent={Math.round(overallProgress)} status="active" />
            </div>
          )}

          <List
            dataSource={batchFiles}
            renderItem={(file) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFile(file.uid)}
                    disabled={isAnalyzing}
                    danger
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={getStatusIcon(file.status)}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text>{file.name}</Text>
                      <Tag color={getStatusColor(file.status)}>
                        {file.status === 'pending' && '待分析'}
                        {file.status === 'analyzing' && '分析中'}
                        {file.status === 'completed' && '已完成'}
                        {file.status === 'error' && '失败'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">文件大小: {(file.content.length / 1024).toFixed(1)} KB</Text>
                      {file.status === 'analyzing' && (
                        <div style={{ marginTop: 8 }}>
                          <Progress percent={Math.round(file.progress)} size="small" />
                        </div>
                      )}
                      {file.status === 'error' && file.error && (
                        <Alert 
                          message={file.error} 
                          type="error" 
                          showIcon 
                          style={{ marginTop: 8 }}
                        />
                      )}
                      {file.status === 'completed' && file.result && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="success">
                            评分: {file.result.overallScore}/100 | 
                            客户数: {file.result.customerCount}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 分析结果统计 */}
      {batchFiles.some(f => f.status === 'completed') && (
        <Card title="分析结果统计">
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {batchFiles.filter(f => f.status === 'completed').length}
              </div>
              <div>成功分析</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {batchFiles.filter(f => f.status === 'error').length}
              </div>
              <div>分析失败</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {batchFiles.filter(f => f.status === 'pending').length}
              </div>
              <div>待分析</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BatchUpload;
