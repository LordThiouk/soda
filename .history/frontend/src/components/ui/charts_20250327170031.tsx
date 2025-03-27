"use client";

import { AreaChart as RechartsAreaChart, 
         Area, 
         XAxis, 
         YAxis, 
         CartesianGrid, 
         Tooltip, 
         ResponsiveContainer, 
         Legend,
         LineChart as RechartsLineChart,
         Line,
         BarChart as RechartsBarChart,
         Bar } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  startEndOnly?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  yAxisWidth?: number;
  className?: string;
}

// Couleurs par défaut inspirées du drapeau sénégalais (vert, jaune, rouge)
const defaultColors = [
  '#00853F', // vert
  '#FDEF42', // jaune
  '#E31B23', // rouge
  '#2563eb', // bleu
  '#9333ea', // violet
  '#f97316', // orange
];

// Formateur de valeur par défaut
const defaultValueFormatter = (value: number) => value.toString();

export function AreaChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = defaultValueFormatter,
  showLegend = true,
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  className,
}: ChartProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          
          {showXAxis && (
            <XAxis 
              dataKey={index} 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              tickFormatter={(value, index) => {
                if (startEndOnly) {
                  if (index === 0 || index === data.length - 1) {
                    return value;
                  }
                  return '';
                }
                return value;
              }}
            />
          )}
          
          {showYAxis && (
            <YAxis 
              width={yAxisWidth}
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              tickFormatter={(value) => valueFormatter(value)}
            />
          )}
          
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: 'none'
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          
          {showLegend && <Legend verticalAlign="top" height={40} />}
          
          {categories.map((category, index) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              name={category}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.3}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = defaultValueFormatter,
  showLegend = true,
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  className,
}: ChartProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          
          {showXAxis && (
            <XAxis 
              dataKey={index} 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              tickFormatter={(value, index) => {
                if (startEndOnly) {
                  if (index === 0 || index === data.length - 1) {
                    return value;
                  }
                  return '';
                }
                return value;
              }}
            />
          )}
          
          {showYAxis && (
            <YAxis 
              width={yAxisWidth}
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              tickFormatter={(value) => valueFormatter(value)}
            />
          )}
          
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: 'none'
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          
          {showLegend && <Legend verticalAlign="top" height={40} />}
          
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              name={category}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = defaultValueFormatter,
  showLegend = true,
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  className,
}: ChartProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          
          {showXAxis && (
            <XAxis 
              dataKey={index} 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              tickFormatter={(value, index) => {
                if (startEndOnly) {
                  if (index === 0 || index === data.length - 1) {
                    return value;
                  }
                  return '';
                }
                return value;
              }}
            />
          )}
          
          {showYAxis && (
            <YAxis 
              width={yAxisWidth}
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              tickFormatter={(value) => valueFormatter(value)}
            />
          )}
          
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: 'none'
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          
          {showLegend && <Legend verticalAlign="top" height={40} />}
          
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              name={category}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
} 