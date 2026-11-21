# Frontend guide (for Frontend 2 & 3)

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api/v1
npm run dev               # http://localhost:5173
```

Login is in **mock mode** until the backend is running (`src/api/auth.js` → `USE_MOCK`).
Demo accounts (any password in mock mode): `admin@solarconnect.com` (admin → /admin), `sales@solarconnect.com` (customer_care → /sales), `warehouse@solarconnect.com` (warehouse → /operations), `tech@solarconnect.com` (technician → /tech, mobile layout).

Live component reference: log in as admin → **/admin/ui-kit**.

## Where your code goes

| You | Pages | Routes | Sidebar | API | Mocks |
|---|---|---|---|---|---|
| Frontend 2 (Sales) | `src/pages/sales/` | `src/routes/salesRoutes.jsx` | `src/config/nav.sales.js` | `src/api/<module>.js` | `src/mocks/` |
| Frontend 3 (Warehouse) | `src/pages/operations/` | `src/routes/operationsRoutes.jsx` | `src/config/nav.operations.js` | `src/api/<module>.js` | `src/mocks/` |
| Frontend 3 (Technician) | `src/pages/tech/` | `src/routes/techRoutes.jsx` | none (mobile layout) | `src/api/<module>.js` | `src/mocks/` |

Routes are relative children of `/sales`, `/operations` or `/tech` and already render inside their layout
and behind the role check. Don't touch `App.jsx`.

## Rules

- **UI**: import only from `@/components/ui` — `Button, Input, Select, Textarea, Card, StatCard, DataTable, Modal, ConfirmDialog, StatusBadge, PageHeader, EmptyState, Loader, Skeleton, Tabs, useToast`. Need something new? Ask Frontend 1 (Purvika).
- **Every page** starts with `<PageHeader title=... actions=... />`.
- **Status colours**: `<StatusBadge status={row.status} />`. Use only the frozen status names; they are listed at the top of `src/constants/status.js`.
- **Formatting**: `formatCurrency`, `formatDate`, `formatDateTime`, `formatKw`, `formatPercent` from `@/utils/format`.
- **API**: pages call functions in `src/api/*`, never axios or mocks directly. The axios instance unwraps `{ success, data, message }`, so `await api.get('/leads')` returns `data`; errors throw with `err.message`.

## API module pattern

```js
// src/api/leads.js
import api, { mockDelay } from './axios'
import { mockLeads } from '@/mocks/leads'

const USE_MOCK = true // flip when the backend endpoint is ready

export const getLeads = (params) => (USE_MOCK ? mockDelay(mockLeads) : api.get('/leads', { params }))
export const createLead = (body) => (USE_MOCK ? mockDelay({ ...body, _id: crypto.randomUUID() }) : api.post('/leads', body))
```

## Page pattern

```jsx
const [rows, setRows] = useState([])
const [loading, setLoading] = useState(true)
useEffect(() => { getLeads().then(setRows).finally(() => setLoading(false)) }, [])

return (
  <>
    <PageHeader title="Leads" actions={<Button icon={Plus}>New lead</Button>} />
    <DataTable columns={columns} data={rows} loading={loading} searchable />
  </>
)
```
