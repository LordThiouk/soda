"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

// Couleurs aux teintes du drapeau sénégalais (vert, jaune, rouge) et variantes
const DEFAULT_COLORS = [
  "#00AA5B", // Vert sénégalais
  "#FFCD00", // Jaune sénégalais
  "#E31B23", // Rouge sénégalais
  "#006837", // Vert foncé
  "#FDB913", // Jaune doré
  "#C1272D", // Rouge foncé
  "#1B8A5A", // Vert émeraude
  "#FFD44F", // Jaune clair
  "#BF0D3E", // Rouge framboise
];

interface PieChartProps {
  data: {
    name: string;
    value: number;
    [key: string]: any;
  }[];
  nameKey?: string;
  dataKey?: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
}

export function PieChart({
  data,
  nameKey = "name",
  dataKey = "value",
  colors = DEFAULT_COLORS,
  innerRadius = 70,
  outerRadius = 90,
  height = 300
}: PieChartProps) {
  // Formater les données pour la légende
  const legendFormatter = (value: string, entry: any) => {
    const { payload } = entry;
    return `${value}: ${payload.value} (${Math.round(payload.percent * 100)}%)`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} diffusions`, undefined]}
          contentStyle={{
            backgroundColor: "#1c1c1c",
            border: "none",
            borderRadius: "6px", 
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
          labelStyle={{ color: "#f3f4f6" }}
          itemStyle={{ color: "#f3f4f6" }}
        />
        <Legend 
          formatter={legendFormatter}
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
} 