import { daysAgo } from './dates'

// Operations-side copy of customers so the module works before Dev 3's API.
// Shape should match Dev 1's Customer model.
export const customers = [
  { _id: 'cus_001', name: 'Gurpreet Sandhu', phone: '9876500001', email: 'gurpreet.sandhu@example.com', address: '12 Model Town, Ludhiana, Punjab' },
  { _id: 'cus_002', name: 'Anita Mehta', phone: '9876500002', email: 'anita.mehta@example.com', address: '45 Sarabha Nagar, Ludhiana, Punjab' },
  { _id: 'cus_003', name: 'Balwinder Dhillon', phone: '9876500003', email: 'balwinder.d@example.com', address: 'Plot 8, Focal Point Phase 7, Ludhiana, Punjab' },
  { _id: 'cus_004', name: 'Ritu Malhotra', phone: '9876500004', email: 'ritu.malhotra@example.com', address: '221 Urban Estate, Jalandhar, Punjab' },
  { _id: 'cus_005', name: 'Kuldeep Bains', phone: '9876500005', email: 'kuldeep.bains@example.com', address: 'Village Lalton Kalan, Ludhiana, Punjab' },
  { _id: 'cus_006', name: 'Simran Grewal', phone: '9876500006', email: 'simran.grewal@example.com', address: '7 BRS Nagar, Ludhiana, Punjab' },
].map((c) => ({ ...c, createdAt: daysAgo(900) }))
