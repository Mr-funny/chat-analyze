import React, { useState } from 'react';
import { Upload, Button, Card, Progress, Alert, message, Typography } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { FileUploadState } from '../types';
import { ChatParser } from '../services/aiAnalysis';

const { Text } = Typography;

interface FileUploadProps {
  onFileUploaded: (content: string) => void;
  onUploadStateChange: (state: FileUploadState) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onUploadStateChange }) => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    error: null
  });

  const handleFileChange = async (info: any) => {
    console.log('=== FileUpload handleFileChange called ===');
    console.log('File change info:', info);
    const { file } = info;
    
    if (file.status === 'uploading') {
      console.log('File uploading...');
      setUploadState({
        file,
        isUploading: true,
        progress: 0,
        error: null
      });
      onUploadStateChange({
        file,
        isUploading: true,
        progress: 0,
        error: null
      });
    }
    
    // 处理文件状态变化
    if (file.status === 'done') {
      console.log('File upload done');
      setUploadState({
        file,
        isUploading: false,
        progress: 100,
        error: null
      });
      onUploadStateChange({
        file,
        isUploading: false,
        progress: 100,
        error: null
      });
    }
    
    if (file.status === 'error') {
      console.log('File upload error');
      setUploadState({
        file,
        isUploading: false,
        progress: 0,
        error: file.error?.message || '文件上传失败'
      });
      onUploadStateChange({
        file,
        isUploading: false,
        progress: 0,
        error: file.error?.message || '文件上传失败'
      });
    }
    
    // 如果文件状态是uploading，手动处理文件
    if (file.status === 'uploading' && file.originFileObj) {
      console.log('Manually processing file...');
      try {
        const content = await readFileContent(file.originFileObj);
        console.log('File content loaded, length:', content.length);
        
        // 验证文件内容
        if (!validateFileContent(content)) {
          throw new Error('文件格式不正确，请上传有效的聊天记录文件');
        }
        
        // 解析聊天记录
        const sessions = ChatParser.parseChatContent(content);
        console.log('Parsed sessions:', sessions.length);
        
        // 更新状态
        setUploadState({
          file,
          isUploading: false,
          progress: 100,
          error: null
        });
        onUploadStateChange({
          file,
          isUploading: false,
          progress: 100,
          error: null
        });
        
        // 调用回调
        console.log('Calling onFileUploaded with content length:', content.length);
        onFileUploaded(content);
        message.success('文件上传成功！');
        
      } catch (error) {
        console.error('File processing error:', error);
        const errorMessage = error instanceof Error ? error.message : '文件处理失败';
        
        setUploadState({
          file,
          isUploading: false,
          progress: 0,
          error: errorMessage
        });
        onUploadStateChange({
          file,
          isUploading: false,
          progress: 0,
          error: errorMessage
        });
        
        message.error(errorMessage);
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('File read successfully, content length:', content.length);
        resolve(content);
      };
      reader.onerror = (error) => {
        console.error('File read error:', error);
        reject(new Error('文件读取失败'));
      };
      reader.readAsText(file, 'utf-8');
    });
  };

  const validateFileContent = (content: string): boolean => {
    console.log('Validating content...');
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 500));
    
    // 非常宽松的验证：只要文件不为空就接受
    const isValid = content.trim().length > 0;
    
    console.log('Validation result:', isValid);
    return isValid;
  };

  const uploadProps = {
    name: 'file',
    accept: '.txt',
    beforeUpload: (file: File) => {
      console.log('=== beforeUpload called ===');
      console.log('Before upload check:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');
      if (!isTxt) {
        message.error('只能上传TXT文件！');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB！');
        return false;
      }
      
      console.log('File validation passed');
      return true; // 允许上传，让customRequest处理
    },
    onChange: handleFileChange,
    showUploadList: false,
    customRequest: ({ file, onSuccess, onError }: any) => {
      console.log('=== customRequest called ===');
      console.log('Custom request handling file:', file);
      
      if (file) {
        // 设置上传状态
        setUploadState({
          file,
          isUploading: true,
          progress: 0,
          error: null
        });
        onUploadStateChange({
          file,
          isUploading: true,
          progress: 0,
          error: null
        });
        
        // 模拟上传进度
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            console.log('File content loaded, length:', content.length);
            
            // 验证文件内容
            if (!validateFileContent(content)) {
              throw new Error('文件格式不正确，请上传有效的聊天记录文件');
            }
            
            // 解析聊天记录
            const sessions = ChatParser.parseChatContent(content);
            console.log('Parsed sessions:', sessions.length);
            
            // 更新状态
            setUploadState({
              file,
              isUploading: false,
              progress: 100,
              error: null
            });
            onUploadStateChange({
              file,
              isUploading: false,
              progress: 100,
              error: null
            });
            
            // 调用回调
            console.log('Calling onFileUploaded with content length:', content.length);
            onFileUploaded(content);
            onSuccess();
            message.success('文件上传成功！');
            
          } catch (error) {
            console.error('File processing error:', error);
            const errorMessage = error instanceof Error ? error.message : '文件处理失败';
            
            setUploadState({
              file,
              isUploading: false,
              progress: 0,
              error: errorMessage
            });
            onUploadStateChange({
              file,
              isUploading: false,
              progress: 0,
              error: errorMessage
            });
            
            onError(error);
            message.error(errorMessage);
          }
        };
        
        reader.onerror = () => {
          const error = new Error('文件读取失败');
          setUploadState({
            file,
            isUploading: false,
            progress: 0,
            error: error.message
          });
          onUploadStateChange({
            file,
            isUploading: false,
            progress: 0,
            error: error.message
          });
          onError(error);
          message.error('文件读取失败');
        };
        
        reader.readAsText(file, 'utf-8');
      }
    }
  };

  return (
    <Card title="上传聊天记录" className="file-upload-card">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            点击或拖拽文件到此区域上传
          </p>
          <p className="ant-upload-hint">
            支持TXT格式的聊天记录文件，文件大小不超过10MB
          </p>
        </Upload.Dragger>
      </div>

      {/* 上传进度 */}
      {uploadState.isUploading && (
        <div style={{ marginTop: 16 }}>
          <Text>正在处理文件...</Text>
          <Progress percent={uploadState.progress} status="active" />
        </div>
      )}

      {/* 错误提示 */}
      {uploadState.error && (
        <Alert
          message="上传失败"
          description={
            <div>
              <div>{uploadState.error}</div>
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                请检查文件格式是否正确，或尝试重新上传
              </div>
            </div>
          }
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 文件信息 */}
      {uploadState.file && !uploadState.isUploading && !uploadState.error && (
        <Alert
          message="文件上传成功"
          description={
            <div>
              <Text>文件名: {uploadState.file.name}</Text><br />
              <Text>文件大小: {(uploadState.file.size / 1024).toFixed(2)} KB</Text><br />
              <Text>上传时间: {new Date().toLocaleString()}</Text>
            </div>
          }
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 使用说明 */}
      <div style={{ marginTop: 16 }}>
        <Text strong>文件格式要求：</Text>
        <ul style={{ marginTop: 8 }}>
          <li>支持TXT格式的聊天记录文件</li>
          <li>文件大小不超过10MB</li>
          <li>包含客户和客服的对话内容</li>
          <li>支持1688旺旺聊天记录格式</li>
        </ul>
      </div>
    </Card>
  );
};

export default FileUpload;
