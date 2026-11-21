import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import EmptyState from './EmptyState'
import { Skeleton } from './Loader'
import { cn } from '@/utils/cn'

/**
 * <DataTable
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
 *     { key: 'total', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.total) },
 *   ]}
 *   data={rows}
 *   loading={loading}
 *   searchable searchKeys={['name', 'phone']}     // client-side search box
 *   toolbar={<Select .../>}                       // extra filters next to search
 *   onRowClick={(row) => navigate(`/admin/projects/${row._id}`)}
 *   pageSize={10}
 *   emptyTitle="No leads" emptyDescription="..."
 * />
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  rowKey = '_id',
  onRowClick,
  searchable = false,
  searchKeys,
  searchPlaceholder = 'Search...',
  toolbar,
  pageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  className,
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!query.trim()) return data
    const q = query.toLowerCase()
    const keys = searchKeys || columns.map((c) => c.key)
    return data.filter((row) => keys.some((k) => String(getValue(row, k) ?? '').toLowerCase().includes(q)))
  }, [data, query, searchKeys, columns])

  const sorted = useMemo(() => {
    if (!sort.key) return filtered
    const col = columns.find((c) => c.key === sort.key)
    const get = col?.sortValue || ((r) => getValue(r, sort.key))
    return [...filtered].sort((a, b) => {
      const av = get(a)
      const bv = get(b)
      if (av === bv) return 0
      if (av === undefined || av === null) return 1
      if (bv === undefined || bv === null) return -1
      const cmp = av > bv ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const rows = pageSize ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize) : sorted

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return (
    <div className={cn('rounded-card border border-slate-200 bg-white shadow-card', className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-control border border-slate-300 bg-white pr-3 pl-9 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-end gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase',
                    alignClass(col.align),
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                    col.headerClassName,
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      sort.key === col.key &&
                      (sort.dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={query ? 'No matches' : emptyTitle}
                    description={query ? `Nothing matches "${query}"` : emptyDescription}
                    action={!query && emptyAction}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={getValue(row, rowKey) ?? i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-slate-50')}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 whitespace-nowrap text-slate-700', alignClass(col.align), col.className)}
                    >
                      {col.render ? col.render(row) : (getValue(row, col.key) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pageSize > 0 && sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <PageBtn disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </PageBtn>
            <PageBtn disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function PageBtn({ children, ...props }) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  )
}

// Supports dotted keys: "customer.name"
function getValue(obj, path) {
  return String(path)
    .split('.')
    .reduce((acc, k) => (acc == null ? undefined : acc[k]), obj)
}

const alignClass = (align) => (align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left')
