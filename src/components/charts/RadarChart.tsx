"use client";
import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CategoryVector } from "@/types";

interface Props {
  vectorA: CategoryVector;
  vectorB: CategoryVector;
  nameA: string;
  nameB: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: "엔터/게임",
  knowledge: "지식/교육",
  humor: "유머/밈",
  lifestyle: "라이프",
  music: "음악",
  news: "뉴스",
  food: "음식",
  tech: "테크",
};

export function RadarChartComponent({ vectorA, vectorB, nameA, nameB }: Props) {
  const data = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    category: label,
    [nameA]: Math.round((vectorA[key as keyof CategoryVector] || 0) * 100),
    [nameB]: Math.round((vectorB[key as keyof CategoryVector] || 0) * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="#E8E8E4" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: "#6B6B6B", fontSize: 11 }}
        />
        <Radar
          name={nameA}
          dataKey={nameA}
          stroke="#FF4D00"
          fill="#FF4D00"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Radar
          name={nameB}
          dataKey={nameB}
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "#1A1A1A", fontSize: 12 }}>{value}</span>
          )}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
