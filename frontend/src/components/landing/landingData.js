// All the fixed text used on the landing page lives here,
// so the components only deal with layout.

// Links shown in the top menu and in the footer.
export const NAV_LINKS = [
  { label: 'Packages', href: '/#packages' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Subsidy', href: '/#subsidy' },
  { label: 'Get a quote', href: '/#enquiry' },
]

// Numbers in the scrolling strip at the bottom of the hero.
export const TICKER = [
  { value: '500+', label: 'rooftops installed' },
  { value: '20 years', label: 'panel warranty' },
  { value: '₹78,000', label: 'max govt. subsidy' },
  { value: '1–5 kW', label: 'ready-made systems' },
  { value: 'On-Grid & Off-Grid', label: 'with battery backup' },
  { value: 'Every serial', label: 'scanned before dispatch' },
]

// "How it works" steps: Enquiry -> Survey -> Install -> Warranty.
export const STEPS = [
  {
    title: 'Enquiry',
    text: 'Fill the form below. Your request reaches our sales team straight away and is never lost.',
  },
  {
    title: 'Roof survey',
    text: 'We call you, then a technician visits to check roof direction, tilt, shade and cable distance.',
  },
  {
    title: 'Installation',
    text: 'Every inverter and battery is scanned before dispatch. Our crew installs, tests and hands over.',
  },
  {
    title: '20-year warranty',
    text: 'Warranty starts on delivery. Track your order and report problems online with your phone number.',
  },
]

// PM Surya Ghar subsidy slabs (on-grid homes).
export const SUBSIDY = [
  { size: '1 kW', amount: '₹30,000' },
  { size: '2 kW', amount: '₹60,000' },
  { size: '3 kW and above', amount: '₹78,000' },
]

// Reasons to trust us, shown next to the subsidy note.
export const TRUST_POINTS = [
  { title: 'Every serial number recorded', text: 'We know exactly which panel, inverter and battery is on your roof.' },
  { title: 'Warranty starts by itself', text: '2 years on inverters and batteries, 20 years on panels, from delivery day.' },
  { title: 'Track your order online', text: 'No calls needed. See progress, payments and warranty at /track.' },
  { title: 'Complaints never get lost', text: 'Report a problem any time. You get a ticket number and we follow it to the end.' },
]

// Common questions, shown in the FAQ section.
export const FAQS = [
  {
    q: 'What is the difference between On-Grid and Off-Grid?',
    a: 'On-Grid is connected to the electricity grid and gets the government subsidy. Off-Grid adds a big battery, so you have power even during cuts.',
  },
  {
    q: 'How long does installation take?',
    a: 'After the roof survey is approved and the order is confirmed, installation is usually done in one or two days.',
  },
  {
    q: 'What happens if something stops working?',
    a: 'Open "Track my order", pick the equipment and press "Report a problem". If it is under warranty, the repair costs you nothing.',
  },
  {
    q: 'How do I check my order without calling?',
    a: 'Go to Track my order and enter your phone number and order ID (for example OR-1001). It is printed on your quote and invoice.',
  },
]

// Starting values of the enquiry form.
export const EMPTY_ENQUIRY = {
  name: '',
  phone: '',
  city: '',
  capacityKw: 3,
  systemType: 'on_grid',
  monthlyBill: '',
}

// Options for the enquiry form dropdowns.
export const KW_OPTIONS = [1, 2, 3, 4, 5].map((kw) => ({ value: kw, label: `${kw} kW` }))

export const SYSTEM_TYPES = [
  { value: 'on_grid', label: 'On-Grid (connected to grid)' },
  { value: 'off_grid', label: 'Off-Grid (with battery backup)' },
]
