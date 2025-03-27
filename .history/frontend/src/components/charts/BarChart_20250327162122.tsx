"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// Couleurs aux teintes du drapeau sénégalais
const DEFAULT_COLORS = {
  primary: "#00AA5B", // Vert sénégalais
  secondary: "#FFCD00", // Jaune sénégalais
  accent: "#E31B23", // Rouge sénégalais
};

interface BarChartProps {
  data: {
    name: string;
    value: number;
    [key: string]: any;
  }[];
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  height?: number;
  showGrid?: boolean;
  rotateLabels?: boolean;
  sortData?: boolean;
  maxItems?: number;
}

export function BarChart({
  data,
  xAxisKey = "name",
  yAxisKey = "value",
  colors = DEFAULT_COLORS,
  height = 300,
  showGrid = true,
  rotateLabels = false,
  sortData = false,
  maxItems = 10
}: BarChartProps) {
  // Trier et limiter les données si nécessaire
  let processedData = [...data];
  
  if (sortData) {
    processedData.sort((a, b) => b[yAxisKey] - a[yAxisKey]);
  }
  
  if (maxItems && processedData.length > maxItems) {
    processedData = processedData.slice(0, maxItems);
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={processedData}
        margin={{ top: 10, right: 30, left: 0, bottom: rotateLabels ? 60 : 20 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={rotateLabels ? -45 : 0}
          textAnchor={rotateLabels ? "end" : "middle"}
          height={rotateLabels ? 60 : 30}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1c1c1c",
            border: "none",
            borderRadius: "6px", 
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
          labelStyle={{ color: "#f3f4f6" }}
          itemStyle={{ color: "#f3f4f6" }}
          formatter={(value) => [`${value} diffusions`, undefined]}
        />
        <Bar
          dataKey={yAxisKey}
          radius={[4, 4, 0, 0]}
        >
          {processedData.map((entry, index) => {
            // Alternance de couleurs ou attribution basée sur propriétés dans les données
            let fillColor = colors.primary;
            
            if (entry.color) {
              // Si l'entrée a une couleur spécifique
              fillColor = entry.color;
            } else if (index % 3 === 1 && colors.secondary) {
              fillColor = colors.secondary;
            } else if (index % 3 === 2 && colors.accent) {
              fillColor = colors.accent;
            }
            
            return <Cell key={`cell-${index}`} fill={fillColor} />;
          })}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
} 