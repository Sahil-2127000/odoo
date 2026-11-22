// Admin master data API: products, kits and staff users.
// Works on fake data until the backend is ready (changes are kept until the page is refreshed).
import api, { mockDelay } from './axios'
import { mockKits, mockProducts, mockStaff } from '@/mocks/admin'

export const USE_MOCK = false // true = fake data from src/mocks (for working without the backend)

// In-memory copies so add / edit / delete work in mock mode
let products = structuredClone(mockProducts)
let kits = structuredClone(mockKits)
let staff = structuredClone(mockStaff)
const newId = () => `mock-${Date.now()}`

// Mock helper: replace product ids in a kit with { _id, name, category, sellPrice } like the backend's populate
const withProducts = (kit) => ({
  ...kit,
  items: kit.items.map((item) => {
    const p = products.find((x) => x._id === item.product)
    return { ...item, product: p && { _id: p._id, name: p.name, category: p.category, sellPrice: p.sellPrice } }
  }),
})

// Kit price = sell price of each product x quantity (the backend does the same)
export const kitPrice = (items, productList) =>
  items.reduce((sum, item) => {
    const product = productList.find((p) => p._id === item.product)
    return sum + (product ? product.sellPrice * item.qty : 0)
  }, 0)

/* ---------------- Products ---------------- */

/** Backend API: GET /products */
export async function getProducts() {
  if (USE_MOCK) return mockDelay(products)
  return api.get('/products')
}

/** Backend API: POST /products  body: { name, category, costPrice, sellPrice, stock, minStock, warrantyYears } */
export async function createProduct(data) {
  if (USE_MOCK) {
    const product = { _id: newId(), ...data }
    products = [product, ...products]
    return mockDelay(product)
  }
  return api.post('/products', data)
}

/** Backend API: PUT /products/:id */
export async function updateProduct(id, data) {
  if (USE_MOCK) {
    products = products.map((p) => (p._id === id ? { ...p, ...data } : p))
    return mockDelay(products.find((p) => p._id === id))
  }
  return api.put(`/products/${id}`, data)
}

/* ---------------- Kits ---------------- */

/** Backend API: GET /kits  (items.product comes filled in with name, category, sellPrice) */
export async function getKits() {
  if (USE_MOCK) return mockDelay(kits.map((k) => ({ ...withProducts(k), price: kitPrice(k.items, products) })))
  return api.get('/kits')
}

/** Backend API: POST /kits  body: { name, items: [{ product: '<id>', qty }] } - the backend works out the price */
export async function createKit(data) {
  if (USE_MOCK) {
    const kit = { _id: newId(), ...data }
    kits = [kit, ...kits]
    return mockDelay(kit)
  }
  return api.post('/kits', data)
}

/** Backend API: DELETE /kits/:id */
export async function deleteKit(id) {
  if (USE_MOCK) {
    kits = kits.filter((k) => k._id !== id)
    return mockDelay(null)
  }
  return api.delete(`/kits/${id}`)
}

/* ---------------- Staff users ---------------- */

/** Backend API: GET /auth/users */
export async function getUsers() {
  if (USE_MOCK) return mockDelay(staff)
  const users = await api.get('/auth/users')
  return users.filter((u) => u.role !== 'customer') // this page only shows staff
}

/** Backend API: POST /auth/staff  body: { name, email, password, role, phone } */
export async function createStaff(data) {
  if (USE_MOCK) {
    if (staff.some((u) => u.email === data.email.toLowerCase())) {
      throw new Error('User already exists with this email')
    }
    // The password is not stored in mock mode (the real backend saves it hashed)
    const user = {
      _id: newId(),
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    staff = [user, ...staff]
    return mockDelay(user)
  }
  const res = await api.post('/auth/staff', data)
  return res.user // this endpoint sends { user } instead of { data }
}

/** Backend API: PATCH /auth/users/:id/status  (switches active <-> disabled) */
export async function toggleUserStatus(id) {
  if (USE_MOCK) {
    staff = staff.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u))
    return mockDelay(staff.find((u) => u._id === id))
  }
  return api.patch(`/auth/users/${id}/status`)
}
