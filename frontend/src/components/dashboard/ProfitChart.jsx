// Bar chart: the 10 orders that made the most profit. Clicking a bar calls onSelect(order).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/utils/format'

export default function ProfitChart({ orders, onSelect }) {
  // profit = total - totalCost (same rule as the backend). Highest first, top 10.
  const top10 = orders
    .map((o) => ({ ...o, profit: o.total - o.totalCost }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={top10} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          formatter={(v) => [formatCurrency(v), 'Profit']}
          labelFormatter={(label, items) => `${label} · ${items?.[0]?.payload?.customer?.name ?? ''}`}
        />
        <Bar
          dataKey="profit"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
          className="cursor-pointer"
          onClick={(bar) => onSelect(bar.payload)}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
