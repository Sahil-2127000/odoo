// Line chart: money received on each day of the chosen range.
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/utils/format'

export default function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
        <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={data.length <= 10 ? { r: 3 } : false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
