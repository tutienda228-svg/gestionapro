"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCOP } from "@/lib/utils/currency";

export function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <div className="h-64 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium text-neutral-700">Ingresos por mes (últimos 6 meses)</p>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCOP(v)} width={90} />
          <Tooltip formatter={(v: number) => formatCOP(v)} />
          <Line type="monotone" dataKey="total" stroke="#0B3D2E" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
