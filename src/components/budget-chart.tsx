"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function BudgetChart({ data }: { data: Array<{ name: string; planned: number; actual: number }> }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fontSize: 10 }} width={40} />
        <Tooltip />
        <Bar dataKey="planned" fill="#d8bd75" name="งบที่วางแผน" />
        <Bar dataKey="actual" fill="#123f76" name="ใช้จริง" />
      </BarChart>
    </ResponsiveContainer>
  );
}
