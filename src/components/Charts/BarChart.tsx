import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Typography } from 'antd';
import { CustomerAnalysis } from '../../types';

const { Title } = Typography;

interface BarChartProps {
  data: CustomerAnalysis[];
  title?: string;
}

const BarChartComponent: React.FC<BarChartProps> = ({ data, title = '客户评分对比' }) => {
  // 转换数据格式
  const chartData = data.map(customer => ({
    name: customer.customer_id,
    总体评分: customer.score_breakdown.overall,
    响应率: customer.score_breakdown.response_rate,
    态度: customer.score_breakdown.attitude,
    销售技巧: customer.score_breakdown.sales_skills,
    谈判能力: customer.score_breakdown.negotiation,
  }));

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>客户: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              margin: 0, 
              color: entry.color,
              fontSize: '12px'
            }}>
              {entry.name}: {entry.value}/100
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#999' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="总体评分" fill="#1890ff" radius={[4, 4, 0, 0]} />
          <Bar dataKey="响应率" fill="#52c41a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="态度" fill="#faad14" radius={[4, 4, 0, 0]} />
          <Bar dataKey="销售技巧" fill="#722ed1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="谈判能力" fill="#eb2f96" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default BarChartComponent;
