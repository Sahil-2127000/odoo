// Fake data for the admin dashboard, used until the backend endpoints are ready.
// Field names are the ones we expect from:
//   GET /dashboard/summary?range=today|week|month
//   GET /dashboard/profit-per-job
//   GET /dashboard/funnel

// Helper: date string for "n days ago"
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

// Helper: label like "15 Nov" for "n days ago"
const dayLabel = (n) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

// Jobs that are not finished yet (order is between confirmed and installed)
const unfinishedJobs = [
  { orderNumber: 'SC-1051', customerName: 'Meena Gupta', city: 'Noida', capacityKw: 3, stage: 'confirmed', technician: '—', updatedAt: daysAgo(1) },
  { orderNumber: 'SC-1049', customerName: 'Arjun Mehta', city: 'Gurugram', capacityKw: 5, stage: 'packed', technician: '—', updatedAt: daysAgo(2) },
  { orderNumber: 'SC-1047', customerName: 'Kavita Rao', city: 'New Delhi', capacityKw: 2, stage: 'dispatched', technician: 'Suresh Technician', updatedAt: daysAgo(1) },
  { orderNumber: 'SC-1045', customerName: 'Harpreet Singh', city: 'Faridabad', capacityKw: 3, stage: 'delivered', technician: 'Suresh Technician', updatedAt: daysAgo(3) },
  { orderNumber: 'SC-1044', customerName: 'Rohit Verma', city: 'Ghaziabad', capacityKw: 4, stage: 'delivered', technician: 'Amit Kumar', updatedAt: daysAgo(5) },
]

// Open tickets that are more than 3 days old
const oldTickets = [
  { ticketNumber: 'TKT-201', customerName: 'Sunita Sharma', orderNumber: 'SC-1031', issue: 'Inverter showing error E04', status: 'open', createdAt: daysAgo(6) },
  { ticketNumber: 'TKT-198', customerName: 'Deepak Jain', orderNumber: 'SC-1027', issue: 'Low generation on cloudy days', status: 'assigned', createdAt: daysAgo(9) },
  { ticketNumber: 'TKT-195', customerName: 'Pooja Nair', orderNumber: 'SC-1019', issue: 'Water leaking near panel mount', status: 'open', createdAt: daysAgo(4) },
]

// Revenue for the last 30 days (newest last). Week and month are cut from this list.
const DAILY_REVENUE = [
  210000, 0, 185000, 320000, 240000, 0, 275000, 198000, 355000, 0,
  230000, 410000, 160000, 290000, 0, 345000, 220000, 260000, 0, 395000,
  180000, 305000, 250000, 0, 330000, 185000, 240000, 0, 312000, 198000,
]
const lastDays = (count) =>
  DAILY_REVENUE.slice(-count).map((revenue, i) => ({ label: dayLabel(count - 1 - i), revenue }))

export const mockSummary = {
  today: {
    revenue: 198000,
    paymentsPending: 145000,
    installsCompleted: 1,
    unfinishedInstalls: unfinishedJobs.length,
    openTickets: 4,
    lowStockItems: 3,
    // For "today" the chart shows money received during the day
    revenueByDay: [
      { label: '10 am', revenue: 50000 },
      { label: '12 pm', revenue: 0 },
      { label: '2 pm', revenue: 98000 },
      { label: '4 pm', revenue: 0 },
      { label: '6 pm', revenue: 50000 },
    ],
    unfinishedJobs,
    oldTickets,
  },
  week: {
    revenue: DAILY_REVENUE.slice(-7).reduce((sum, n) => sum + n, 0),
    paymentsPending: 520000,
    installsCompleted: 4,
    unfinishedInstalls: unfinishedJobs.length,
    openTickets: 4,
    lowStockItems: 3,
    revenueByDay: lastDays(7),
    unfinishedJobs,
    oldTickets,
  },
  month: {
    revenue: DAILY_REVENUE.reduce((sum, n) => sum + n, 0),
    paymentsPending: 1240000,
    installsCompleted: 17,
    unfinishedInstalls: unfinishedJobs.length,
    openTickets: 4,
    lowStockItems: 3,
    revenueByDay: lastDays(30),
    unfinishedJobs,
    oldTickets,
  },
}

// Money for each finished job. profit = sale - partsCost - labour - repairCost
const jobs = [
  { orderNumber: 'SC-1043', customerName: 'Neha Kapoor', capacityKw: 5, sale: 310000, partsCost: 205000, labour: 22000, repairCost: 0 },
  { orderNumber: 'SC-1041', customerName: 'Sanjay Yadav', capacityKw: 3, sale: 195000, partsCost: 128000, labour: 15000, repairCost: 0 },
  { orderNumber: 'SC-1040', customerName: 'Ritu Malhotra', capacityKw: 3, sale: 195000, partsCost: 131000, labour: 15000, repairCost: 6500 },
  { orderNumber: 'SC-1038', customerName: 'Vivek Chauhan', capacityKw: 2, sale: 135000, partsCost: 88000, labour: 12000, repairCost: 0 },
  { orderNumber: 'SC-1036', customerName: 'Anjali Desai', capacityKw: 4, sale: 255000, partsCost: 170000, labour: 18000, repairCost: 12000 },
  { orderNumber: 'SC-1035', customerName: 'Manoj Tiwari', capacityKw: 1, sale: 72000, partsCost: 48000, labour: 8000, repairCost: 0 },
  { orderNumber: 'SC-1033', customerName: 'Farah Khan', capacityKw: 3, sale: 195000, partsCost: 126000, labour: 15000, repairCost: 0 },
  { orderNumber: 'SC-1031', customerName: 'Sunita Sharma', capacityKw: 2, sale: 135000, partsCost: 90000, labour: 12000, repairCost: 9000 },
  { orderNumber: 'SC-1029', customerName: 'Karan Bhatia', capacityKw: 5, sale: 310000, partsCost: 212000, labour: 22000, repairCost: 4000 },
  { orderNumber: 'SC-1027', customerName: 'Deepak Jain', capacityKw: 3, sale: 195000, partsCost: 129000, labour: 15000, repairCost: 15000 },
  { orderNumber: 'SC-1025', customerName: 'Lata Iyer', capacityKw: 2, sale: 135000, partsCost: 87000, labour: 12000, repairCost: 0 },
  { orderNumber: 'SC-1022', customerName: 'Gaurav Saini', capacityKw: 1, sale: 72000, partsCost: 50000, labour: 8000, repairCost: 2500 },
]

export const mockProfitPerJob = jobs.map((job) => ({
  ...job,
  profit: job.sale - job.partsCost - job.labour - job.repairCost,
}))

// How many leads reached each stage (lead statuses from the team brief)
export const mockFunnel = [
  { status: 'new', count: 64 },
  { status: 'contacted', count: 48 },
  { status: 'survey_scheduled', count: 35 },
  { status: 'surveyed', count: 29 },
  { status: 'quoted', count: 22 },
  { status: 'won', count: 14 },
]
