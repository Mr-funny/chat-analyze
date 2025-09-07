import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from 'antd';

interface ChartDataItem {
  name: string;
  score: number;
}

interface RadarChartProps {
  data: ChartDataItem[];
  title?: string;
}

const RadarChartComponent: React.FC<RadarChartProps> = ({ data, title = '能力评估雷达图' }) => {

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
            评分: {payload[0].value}/10
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e8e8e8" />
          <PolarAngleAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 10]} 
            tick={{ fontSize: 10, fill: '#999' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <Radar
            name="能力评分"
            dataKey="score"
            stroke="#1890ff"
            fill="#1890ff"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default RadarChartComponent;
