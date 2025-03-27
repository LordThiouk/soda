"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface AreaChartProps {
  data: {
    date: string;
    count: number;
    [key: string]: any;
  }[];
  xAxisKey?: string;
  yAxisKey?: string;
  gradientFrom?: string;
  gradientTo?: string;
  strokeColor?: string;
  height?: number;
  showGrid?: boolean;
  axisColor?: string;
  tooltipTitle?: string;
  animated?: boolean;
}

export function AreaChart({
  data,
  xAxisKey = "date",
  yAxisKey = "count",
  gradientFrom = "#00AA5B", // Vert sénégalais
  gradientTo = "rgba(0, 170, 91, 0.1)", // Vert sénégalais transparent
  strokeColor = "#00AA5B", // Vert sénégalais
  height = 300,
  showGrid = true,
  axisColor = "#888888",
  tooltipTitle = "diffusions",
  animated = true
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.8} />
            <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey={xAxisKey}
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="stroke-muted-foreground"
          />
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "#1c1c1c",
            border: "none",
            borderRadius: "6px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
          labelStyle={{ color: "#f3f4f6" }}
          itemStyle={{ color: "#f3f4f6" }}
          formatter={(value) => [`${value} ${tooltipTitle}`, undefined]}
        />
        <Area
          type="monotone"
          dataKey={yAxisKey}
          stroke={strokeColor}
          fillOpacity={1}
          fill="url(#colorCount)"
          strokeWidth={2}
          isAnimationActive={animated}
          animationDuration={1000}
          animationEasing="ease-in-out"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
} 