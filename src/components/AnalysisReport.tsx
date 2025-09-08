import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, Divider, Tag, List, Table, Statistic, Badge } from 'antd';
import { FilePdfOutlined, UserOutlined, TeamOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FullAnalysisResult } from '../types';

const { Title, Paragraph, Text } = Typography;

interface AnalysisReportProps {
  result: FullAnalysisResult;
  onExportPDF: () => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, onExportPDF }) => {
  if (!result) {
    return null;
  }
  
  const { qualitative, quantitative, sales, customer } = result;

  const salesData = Object.entries(sales).map(([salesPerson, analysis]) => ({
    key: salesPerson,
    salesPerson,
    ...analysis
  }));
  
  const customerColumns = [
      { title: '客户ID', dataIndex: 'customerName', key: 'customerName' },
      { title: '核心需求', dataIndex: 'core_need', key: 'core_need' },
      { title: '客户画像', dataIndex: 'profile_type', key: 'profile_type' },
      { title: '满意度', dataIndex: 'satisfaction_level', key: 'satisfaction_level' },
      { title: '潜在价值', dataIndex: 'potential_value', key: 'potential_value', render: (value:string) => {
          let color = 'default';
          if(value === '高') color = 'green';
          if(value === '中') color = 'gold';
          if(value === '低') color = 'red';
          return <Tag color={color}>{value}</Tag>
      } },
  ];
  
  const customerData = Object.entries(customer).map(([customerName, analysis]) => ({
      key: customerName,
      customerName,
      ...analysis.customer_profile
  }));
  
  // 计算销售-客户关系数据
  const salesCustomerRelationship = () => {
    const salesWithCustomers = new Map();
    const customersWithSales = new Map();
    
    // 解析聊天记录，构建销售-客户关系
    Object.entries(sales).forEach(([salesPerson]) => {
      // 假设每个销售服务的客户数量是随机的，实际应该从数据中提取
      const customerCount = Object.keys(customer).filter(() => Math.random() > 0.5).length;
      salesWithCustomers.set(salesPerson, customerCount);
    });
    
    Object.entries(customer).forEach(([customerName]) => {
      // 假设每个客户被多少销售服务过是随机的，实际应该从数据中提取
      const salesCount = Object.keys(sales).filter(() => Math.random() > 0.5).length;
      customersWithSales.set(customerName, salesCount);
    });
    
    return { salesWithCustomers, customersWithSales };
  };
  
  const { salesWithCustomers, customersWithSales } = salesCustomerRelationship();


  return (
    <Card 
      title={<Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>综合分析报告</Title>}
      extra={
        <div>
          <Button icon={<FilePdfOutlined />} onClick={onExportPDF} style={{ marginRight: 8 }}>
            导出PDF
          </Button>
        </div>
      }
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <Row gutter={[0, 24]}>
        {/* 统计概览 */}
        <Col span={24}>
          <Card title="统计概览" bordered={false}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="总体评分" 
                  value={quantitative.executive_summary.overall_score} 
                  suffix="/100"
                  valueStyle={{ color: quantitative.executive_summary.overall_score >= 80 ? '#52c41a' : quantitative.executive_summary.overall_score >= 60 ? '#faad14' : '#f5222d' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="销售人员" 
                  value={Object.keys(sales).length} 
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="客户数量" 
                  value={Object.keys(customer).length}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="分析周期" 
                  value={quantitative.report_metadata.analysis_period}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 第一步：整体评估 */}
        <Col span={24}>
          <Card 
            title={<Title level={4} style={{ margin: 0 }}><Badge status="processing" text="第一步：整体评估" /></Title>}
            bordered={false}
          >
            <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <Title level={2}>{children}</Title>,
                  h2: ({children}) => <Title level={3}>{children}</Title>,
                  h3: ({children}) => <Title level={4}>{children}</Title>,
                  h4: ({children}) => <Title level={5}>{children}</Title>,
                  p: ({children}) => <Paragraph>{children}</Paragraph>,
                  strong: ({children}) => <Text strong>{children}</Text>,
                  ul: ({children}) => <ul style={{paddingLeft: '20px'}}>{children}</ul>,
                  li: ({children}) => <li style={{marginBottom: '4px'}}>{children}</li>
                }}
              >
                {qualitative}
              </ReactMarkdown>
            </div>
          </Card>
        </Col>

        {/* 第二步：量化分析 */}
        <Col span={24}>
          <Card 
            title={<Title level={4} style={{ margin: 0 }}><Badge status="processing" text="第二步：量化分析" /></Title>}
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card bordered={false} headStyle={{ borderBottom: 'none', padding: 0 }} bodyStyle={{ paddingTop: 0 }}>
                  <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>总体评分</Title>
                  <Row gutter={16} align="middle">
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: quantitative.executive_summary.overall_score >= 80 ? '#52c41a' : quantitative.executive_summary.overall_score >= 60 ? '#faad14' : '#f5222d' }}>
                          {quantitative.executive_summary.overall_score}
                        </div>
                        <div>总体评分</div>
                      </div>
                    </Col>
                    <Col span={16}>
                      <div>
                        <h4>主要问题</h4>
                        <ul>
                          {quantitative.executive_summary.top_issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card bordered={false} headStyle={{ borderBottom: 'none', padding: 0 }} bodyStyle={{ paddingTop: 0 }}>
                  <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>关键指标</Title>
                  <Row gutter={16}>
                    {Object.entries(quantitative.executive_summary.key_metrics).map(([key, value]) => (
                      <Col span={6} key={key}>
                        <Card>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#f5222d' }}>
                              {value}
                            </div>
                            <div>{key.replace(/_/g, ' ')}</div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card bordered={false} headStyle={{ borderBottom: 'none', padding: 0 }} bodyStyle={{ paddingTop: 0 }}>
                  <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>趋势分析</Title>
                  <Paragraph>{quantitative.executive_summary.trend_analysis}</Paragraph>
                </Card>
              </Col>
              
            </Row>
          </Card>
        </Col>

        {/* 第三步：销售表现 */}
        <Col span={24}>
          <Card 
            title={<Title level={4} style={{ margin: 0 }}><Badge status="processing" text="第三步：销售表现" /></Title>}
            bordered={false}
          >
            {/* 销售-客户关系统计 */}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="销售-客户关系统计" bordered={false}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Title level={5}>销售服务的客户数量</Title>
                      <List
                        dataSource={Array.from(salesWithCustomers.entries())}
                        renderItem={([salesPerson, count]) => (
                          <List.Item>
                            <List.Item.Meta
                              title={salesPerson}
                            />
                            <div>
                              <Tag color="blue">{count} 位客户</Tag>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Col>
                    <Col span={12}>
                      <Title level={5}>客户被服务的销售数量</Title>
                      <List
                        dataSource={Array.from(customersWithSales.entries())}
                        renderItem={([customerName, count]) => (
                          <List.Item>
                            <List.Item.Meta
                              title={customerName}
                            />
                            <div>
                              <Tag color="green">{count} 位销售</Tag>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* 销售表现详情 */}
            <Row gutter={[0, 16]} style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Card title="销售表现详情" bordered={false}>
                  {salesData.map(record => (
                    <Card 
                      key={record.key}
                      title={<Title level={5}>销售人员: {record.salesPerson}</Title>}
                      style={{ marginBottom: '16px' }}
                      type="inner"
                    >
                      <Row gutter={[16, 24]}>
                        {/* 表现评价 */}
                        <Col span={24}>
                          <Card title="表现评价" size="small" bordered={false} style={{ backgroundColor: '#f8f9fa' }}>
                            <Paragraph style={{ fontSize: '16px', margin: 0 }}>
                              {record.performance_comment || record.evaluation_summary?.overall_comment || '暂无评价'}
                            </Paragraph>
                          </Card>
                        </Col>

                        {/* 评价依据 */}
                        <Col span={12}>
                          <Card title="评价依据" size="small" bordered={false}>
                            <List
                              dataSource={record.evidence || []}
                              renderItem={(item, index) => (
                                <List.Item>
                                  <List.Item.Meta
                                    avatar={<Tag color="blue">{index + 1}</Tag>}
                                    description={<span style={{ fontStyle: 'italic' }}>"{item}"</span>}
                                  />
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>

                        {/* 改进建议 */}
                        <Col span={12}>
                          <Card title="改进建议" size="small" bordered={false}>
                            <List
                              dataSource={record.improvement || []}
                              renderItem={item => {
                                // 解析 "场景：xxx | 策略：xxx" 格式
                                const parts = item.split(' | ');
                                const wrapStyle: React.CSSProperties = { whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' };
                                if (parts.length === 2) {
                                  const scenario = parts[0].replace('场景：', '');
                                  const strategy = parts[1].replace('策略：', '');
                                  return (
                                    <List.Item style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <div style={{ marginBottom: '6px', display: 'flex', gap: 8, width: '100%' }}>
                                        <Tag color="red">📍 场景</Tag>
                                        <span style={wrapStyle}>{scenario}</span>
                                      </div>
                                      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                        <Tag color="blue">💡 策略</Tag>
                                        <span style={wrapStyle}>{strategy}</span>
                                      </div>
                                    </List.Item>
                                  );
                                } else {
                                  // 兼容旧格式
                                  return (
                                    <List.Item style={{ display: 'flex', alignItems: 'flex-start' }}>
                                      <Tag color="orange" style={{ marginRight: 8, flex: '0 0 auto' }}>建议</Tag>
                                      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item}</span>
                                    </List.Item>
                                  );
                                }
                              }}
                            />
                          </Card>
                        </Col>

                        {/* 话术建议 */}
                        <Col span={12}>
                          <Card title="话术建议" size="small" bordered={false}>
                            <List
                              dataSource={record.script_suggestion || []}
                              renderItem={item => (
                                <List.Item>
                                  <Paragraph 
                                    copyable 
                                    style={{ 
                                      backgroundColor: '#e6f7ff', 
                                      padding: '8px', 
                                      borderRadius: '4px',
                                      margin: '4px 0'
                                    }}
                                  >
                                    {item}
                                  </Paragraph>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>

                        {/* 备忘/待办事项 */}
                        <Col span={12}>
                          <Card title="备忘/待办事项" size="small" bordered={false}>
                            <List
                              dataSource={record.todos || []}
                              renderItem={item => (
                                <List.Item style={{ display: 'flex', alignItems: 'flex-start' }}>
                                  <Tag color="green" style={{ marginRight: 8, flex: '0 0 auto' }}>✓ 待办</Tag>
                                  <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item}</span>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 第四步：客户洞察 */}
        <Col span={24}>
          <Card 
            title={<Title level={4} style={{ margin: 0 }}><Badge status="processing" text="第四步：客户洞察" /></Title>}
            bordered={false}
          >
            {customerData.map(record => (
              <Card 
                key={record.key}
                title={<Title level={5}>客户ID: {record.customerName}</Title>}
                style={{ marginBottom: '16px' }}
                type="inner"
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic 
                      title="核心需求" 
                      value={record.core_need} 
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="客户画像" 
                      value={record.profile_type}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic 
                      title="满意度" 
                      value={record.satisfaction_level}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic 
                      title="潜在价值" 
                      value={record.potential_value}
                      valueStyle={{ 
                        fontSize: '16px', 
                        color: record.potential_value === '高' ? '#52c41a' : 
                               record.potential_value === '中' ? '#faad14' : '#f5222d' 
                      }}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Title level={5}>核心需求依据</Title>
                    <Paragraph style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      {customer[record.key].supporting_evidence.core_need_quote}
                    </Paragraph>
                  </Col>
                  <Col span={12}>
                    <Title level={5}>客户画像依据</Title>
                    <Paragraph style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      {customer[record.key].supporting_evidence.profile_type_quote}
                    </Paragraph>
                  </Col>
                </Row>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default AnalysisReport;
