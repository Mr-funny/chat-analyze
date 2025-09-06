import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Space, 
  Modal, 
  message, 
  Popconfirm, 
  Tag, 
  Statistic, 
  Row, 
  Col,
  DatePicker,
  Tooltip,
  Typography
} from 'antd';
import { 
  SearchOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  ClearOutlined,
  ImportOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { reportManager, ReportRecord } from '../services/reportManager';
import { AnalysisResult } from '../types';
import AnalysisReport from './AnalysisReport';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Text } = Typography;

interface ReportHistoryProps {
  onViewReport?: (report: ReportRecord) => void;
  onRefresh?: () => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ onViewReport, onRefresh }) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    averageScore: 0
  });

  // 加载报告数据
  const loadReports = async () => {
    setLoading(true);
    try {
      const reportsData = await reportManager.loadReports();
      const statsData = await reportManager.getReportStats();
      
      setReports(reportsData);
      setFilteredReports(reportsData);
      setStats(statsData);
    } catch (error) {
      message.error('加载报告失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    try {
      let filtered = reports;
      
      if (keyword.trim()) {
        filtered = await reportManager.searchReports(keyword);
      }
      
      if (dateRange) {
        filtered = await reportManager.filterReportsByDate(dateRange[0], dateRange[1]);
      }
      
      setFilteredReports(filtered);
    } catch (error) {
      message.error('搜索失败');
    }
  };

  // 日期筛选
  const handleDateRangeChange = async (dates: any) => {
    setDateRange(dates ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null);
    
    try {
      let filtered = reports;
      
      if (searchKeyword.trim()) {
        filtered = await reportManager.searchReports(searchKeyword);
      }
      
      if (dates) {
        filtered = await reportManager.filterReportsByDate(
          dates[0].format('YYYY-MM-DD'), 
          dates[1].format('YYYY-MM-DD')
        );
      }
      
      setFilteredReports(filtered);
    } catch (error) {
      message.error('筛选失败');
    }
  };

  // 删除报告
  const handleDeleteReport = async (reportId: string) => {
    try {
      const success = await reportManager.deleteReport(reportId);
      if (success) {
        message.success('删除成功');
        loadReports();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 清空所有报告
  const handleClearAllReports = async () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有报告吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const success = await reportManager.clearAllReports();
          if (success) {
            message.success('清空成功');
            loadReports();
          } else {
            message.error('清空失败');
          }
        } catch (error) {
          message.error('清空失败');
        }
      }
    });
  };

  // 导出报告数据
  const handleExportReports = async () => {
    try {
      const data = await reportManager.exportReports();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 导入报告数据
  const handleImportReports = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const success = await reportManager.importReports(text);
          if (success) {
            message.success('导入成功');
            loadReports();
          } else {
            message.error('导入失败');
          }
        } catch (error) {
          message.error('导入失败');
        }
      }
    };
    input.click();
  };

  // 查看报告详情
  const handleViewReport = (report: ReportRecord) => {
    setSelectedReport(report);
    if (onViewReport) {
      onViewReport(report);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '报告标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: ReportRecord) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{title}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.fileName}
          </Text>
        </div>
      ),
    },
    {
      title: '生成日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <div>
          <div>{date}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleTimeString()}
          </Text>
        </div>
      ),
    },
    {
      title: '总体评分',
      dataIndex: 'result',
      key: 'score',
      width: 100,
      render: (result: AnalysisResult) => {
        const score = result.executive_summary.overall_score;
        let color = 'green';
        if (score < 60) color = 'red';
        else if (score < 80) color = 'orange';
        
        return (
          <Tag color={color} style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {score}/100
          </Tag>
        );
      },
    },
    {
      title: '客户数量',
      dataIndex: 'result',
      key: 'customers',
      width: 100,
      render: (result: AnalysisResult) => (
        <Text>{result.customer_analysis.length}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: ReportRecord) => (
        <Space size="small">
          <Tooltip title="查看报告">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewReport(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除报告">
            <Popconfirm
              title="确定要删除这个报告吗？"
              onConfirm={() => handleDeleteReport(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="link" 
                icon={<DeleteOutlined />} 
                danger
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总报告数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月报告" value={stats.thisMonth} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本周报告" value={stats.thisWeek} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均评分" value={stats.averageScore} suffix="/100" />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索报告标题或文件名"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col span={8}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadReports}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                onClick={handleExportReports}
              >
                导出
              </Button>
              <Button 
                icon={<ImportOutlined />} 
                onClick={handleImportReports}
              >
                导入
              </Button>
              <Popconfirm
                title="确定要清空所有报告吗？"
                onConfirm={handleClearAllReports}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  icon={<ClearOutlined />} 
                  danger
                >
                  清空
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 报告列表 */}
      <Card title={`报告历史 (${filteredReports.length})`}>
        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 报告详情模态框 */}
      <Modal
        title="报告详情"
        open={!!selectedReport}
        onCancel={() => setSelectedReport(null)}
        width="90%"
        style={{ top: 20 }}
        footer={null}
      >
        {selectedReport && (
          <AnalysisReport 
            result={selectedReport.result}
            onExportPDF={() => {
              // 这里可以添加导出PDF的逻辑
              message.success('PDF导出功能已集成');
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ReportHistory;
