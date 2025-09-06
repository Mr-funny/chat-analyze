import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Alert, Typography, Space, Button, Divider, Skeleton } from 'antd';
import { AnalysisResult } from '../types';
import RadarChartComponent from './Charts/RadarChart';
import BarChartComponent from './Charts/BarChart';
import PieChartComponent from './Charts/PieChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text } = Typography;

interface AnalysisReportProps {
  qualitativeResult: string | null;
  quantitativeResult: AnalysisResult | null;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ qualitativeResult, quantitativeResult, onExportPDF, onExportExcel }) => {
  // 客户分析表格列定义 (与之前版本相同)
  const customerColumns = [
    { title: '客户ID', dataIndex: 'customer_id', key: 'customer_id', width: 120 },
    {
      title: '总体评分', dataIndex: 'score_breakdown', key: 'overall_score', width: 100,
      render: (score: any) => (
        <div>
          <Text strong style={{ fontSize: '16px' }}>{score.overall}/100</Text>
          <Progress percent={score.overall} size="small" status={score.overall >= 80 ? 'success' : score.overall >= 60 ? 'normal' : 'exception'} />
        </div>
      ),
    },
    { title: '对话摘要', dataIndex: 'conversation_summary', key: 'conversation_summary', ellipsis: true },
    {
      title: '问题数量', dataIndex: 'issues_found', key: 'issues_count', width: 100,
      render: (issues: any[]) => (
        <Space direction="vertical" size="small">
          <div>
            <Tag color="red">{issues.filter(i => i.severity === '高').length} 高</Tag>
            <Tag color="orange">{issues.filter(i => i.severity === '中').length} 中</Tag>
            <Tag color="green">{issues.filter(i => i.severity === '低').length} 低</Tag>
          </div>
        </Space>
      ),
    },
  ];

  const result = quantitativeResult; // For easier access to quantitative data

  return (
    <div className="analysis-report">
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              {result ? result.report_metadata.title : "分析报告"}
            </Title>
            {result && (
              <Text type="secondary">
                生成时间: {result.report_metadata.date} | 分析客户数: {result.report_metadata.total_customers}
              </Text>
            )}
          </Col>
          <Col>
            <Space>
              <Button type="primary" onClick={onExportPDF}>导出PDF</Button>
              <Button onClick={onExportExcel}>导出Excel</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Divider orientation="left">第一部分：定性分析概要</Divider>
      
      <Card>
        {qualitativeResult ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{qualitativeResult}</ReactMarkdown>
          </div>
        ) : (
          <Skeleton active paragraph={{ rows: 6 }} />
        )}
      </Card>

      <Divider orientation="left">第二部分：定量数据与可视化</Divider>
      
      {result ? (
        <>
          {/* 执行摘要 */}
          <Card title="执行摘要" style={{ marginTop: 24 }}>
            <Row gutter={24}>
              <Col span={6}><Statistic title="总体评分" value={result.executive_summary.overall_score} suffix="/100" valueStyle={{ color: '#1890ff' }} /></Col>
              <Col span={6}><Statistic title="响应率" value={result.executive_summary.key_metrics.response_rate} suffix="%" valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="态度评分" value={result.executive_summary.key_metrics.attitude_score} suffix="/100" valueStyle={{ color: '#faad14' }} /></Col>
              <Col span={6}><Statistic title="销售技巧" value={result.executive_summary.key_metrics.sales_skills} suffix="/100" valueStyle={{ color: '#722ed1' }} /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={12}><RadarChartComponent data={result.executive_summary.key_metrics} /></Col>
              <Col span={12}><PieChartComponent data={result.customer_analysis.flatMap(c => c.issues_found)} /></Col>
            </Row>
            <Row style={{ marginTop: 16 }}><Col span={24}><BarChartComponent data={result.customer_analysis} /></Col></Row>
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Title level={4}>主要问题</Title>
                <div>{result.executive_summary.top_issues.map((issue, index) => (<Alert key={index} message={issue} type="warning" showIcon style={{ marginBottom: 8 }} />))}</div>
              </Col>
            </Row>
          </Card>

          {/* 客户分析 */}
          <Card title="客户分析详情" style={{ marginTop: 24 }}>
            <Table columns={customerColumns} dataSource={result.customer_analysis} rowKey="customer_id" pagination={false} size="small" />
          </Card>

          {/* 最佳实践 */}
          <Card title="最佳实践案例" style={{ marginTop: 24 }}>
            {result.best_practices.map((practice, index) => (
              <Card key={index} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}><Text strong>场景:</Text><div>{practice.scenario}</div></Col>
                  <Col span={8}><Text strong>问题:</Text><div>{practice.problem}</div></Col>
                  <Col span={8}><Text strong>解决方案:</Text><div>{practice.solution}</div></Col>
                </Row>
              </Card>
            ))}
          </Card>

          {/* 行动方案 */}
          <Card title="改进行动方案" style={{ marginTop: 24 }}>
            <Row gutter={24}>
              <Col span={8}><Card title="立即行动" size="small" type="inner"><ul>{result.action_plan.immediate.map((action, index) => (<li key={index}>{action}</li>))}</ul></Card></Col>
              <Col span={8}><Card title="短期计划" size="small" type="inner"><ul>{result.action_plan.short_term.map((action, index) => (<li key={index}>{action}</li>))}</ul></Card></Col>
              <Col span={8}><Card title="长期规划" size="small" type="inner"><ul>{result.action_plan.long_term.map((action, index) => (<li key={index}>{action}</li>))}</ul></Card></Col>
            </Row>
          </Card>
        </>
      ) : (
        <Card style={{ marginTop: 24 }}><Skeleton active paragraph={{ rows: 10 }} /></Card>
      )}
    </div>
  );
};

export default AnalysisReport;
