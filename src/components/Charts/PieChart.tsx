import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, Typography } from 'antd';
import { Issue } from '../../types';

const { Title } = Typography;

interface PieChartProps {
  data: Issue[];
  title?: string;
}

const PieChartComponent: React.FC<PieChartProps> = ({ data, title = '问题严重程度分布' }) => {
  // 统计问题严重程度
  const severityCount = data.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // 转换数据格式
  const chartData = Object.entries(severityCount).map(([severity, count]) => ({
    name: severity,
    value: count,
  }));

  // 颜色配置
  const COLORS = {
    '高': '#ff4d4f',
    '中': '#faad14',
    '低': '#52c41a'
  };

  // 自定义工具提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {data.name}级问题
          </p>
          <p style={{ margin: 0, color: data.color }}>
            数量: {data.value} 个
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
            占比: {((data.value / data.length) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // 自定义图例
  const CustomLegend = ({ payload }: any) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: entry.color,
              borderRadius: '2px'
            }}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {entry.value}级问题 ({entry.payload.value}个)
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* 统计信息 */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', color: '#666' }}>
          <div>
            <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              {severityCount['高'] || 0}
            </div>
            <div>高优先级</div>
          </div>
          <div>
            <div style={{ color: '#faad14', fontWeight: 'bold' }}>
              {severityCount['中'] || 0}
            </div>
            <div>中优先级</div>
          </div>
          <div>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {severityCount['低'] || 0}
            </div>
            <div>低优先级</div>
          </div>
          <div>
            <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
              {data.length}
            </div>
            <div>总计</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PieChartComponent;
