// Warehouse: stock on hand, adding stock.
import api from '@/api/axios'

/** GET /products */
export const getProducts = () => api.get('/products')

/** PATCH /products/:id/stock   body: { quantity } */
export const addStock = (id, quantity) => api.patch(`/products/${id}/stock`, { quantity })
