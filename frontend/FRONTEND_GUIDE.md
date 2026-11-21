# Frontend guide (for Devs 3 & 4)

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```

Login is in **mock mode** until Dev 1 ships `/auth/login` (`src/api/auth.js` → `USE_MOCK`).
Demo accounts (any password): `admin@sunpower.com`, `sales@sunpower.com`, `ops@sunpower.com`.

Live component reference: log in as admin → **/admin/ui-kit**.

## Where your code goes

| You | Pages | Routes | Sidebar | API | Mocks |
|---|---|---|---|---|---|
| Dev 3 (Sales) | `src/pages/sales/` | `src/routes/salesRoutes.jsx` | `src/config/nav.sales.js` | `src/api/<module>.js` | `src/mocks/` |
| Dev 4 (Ops) | `src/pages/operations/` | `src/routes/operationsRoutes.jsx` | `src/config/nav.operations.js` | `src/api/<module>.js` | `src/mocks/` |

Routes are relative children of `/sales` or `/operations` and already render inside `DashboardLayout`
and behind the role check. Don't touch `App.jsx`.

## Rules

- **UI**: import only from `@/components/ui` — `Button, Input, Select, Textarea, Card, StatCard, DataTable, Modal, Badge, PageHeader, EmptyState, Loader, Skeleton, Tabs`. Need something new? Ask Dev 2.
- **Every page** starts with `<PageHeader title=... actions=... />`.
- **Status colours**: `<Badge status={row.status} />`. Add new status values to `STATUS_COLORS` in `src/constants/status.js`.
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
