import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, Typography } from 'antd';
import { KeyMetrics } from '../../types';

const { Title } = Typography;

interface RadarChartProps {
  data: KeyMetrics;
  title?: string;
}

const RadarChartComponent: React.FC<RadarChartProps> = ({ data, title = '能力评估雷达图' }) => {
  // 转换数据格式
  const chartData = [
    { metric: '响应率', value: data.response_rate, fullMark: 100 },
    { metric: '态度评分', value: data.attitude_score, fullMark: 100 },
    { metric: '销售技巧', value: data.sales_skills, fullMark: 100 },
    { metric: '谈判能力', value: data.negotiation_ability, fullMark: 100 },
  ];

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
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#1890ff' }}>
            评分: {payload[0].value}/100
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e8e8e8" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#999' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <Radar
            name="能力评分"
            dataKey="value"
            stroke="#1890ff"
            fill="#1890ff"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* 评分说明 */}
      <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>优秀: 90-100</span>
          <span>良好: 80-89</span>
          <span>一般: 70-79</span>
          <span>较差: 60-69</span>
          <span>差: 0-59</span>
        </div>
      </div>
    </Card>
  );
};

export default RadarChartComponent;
