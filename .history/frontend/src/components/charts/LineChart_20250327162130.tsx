"use client";

import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

// Couleurs aux teintes du drapeau sénégalais
const DEFAULT_COLORS = [
  "#00AA5B", // Vert sénégalais
  "#FFCD00", // Jaune sénégalais
  "#E31B23", // Rouge sénégalais
  "#006837", // Vert foncé
  "#FDB913", // Jaune doré
];

interface DataSeries {
  id: string;
  name: string;
  color?: string;
}

interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  series: DataSeries[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  rotateLabels?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  curveType?: "linear" | "monotone" | "natural";
}

export function LineChart({
  data,
  series,
  xAxisKey = "date",
  height = 300,
  showGrid = true,
  rotateLabels = false,
  showLegend = true,
  strokeWidth = 2,
  curveType = "monotone"
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: rotateLabels ? 60 : 20 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="stroke-muted-foreground"
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
        {showLegend && <Legend />}
        
        {/* Dessiner chaque série avec sa propre couleur */}
        {series.map((serie, index) => (
          <Line
            key={serie.id}
            type={curveType}
            dataKey={serie.id}
            name={serie.name}
            stroke={serie.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            strokeWidth={strokeWidth}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
} 