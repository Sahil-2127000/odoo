# Operations module: field names and endpoints (Dev 4 -> Dev 1)

The Operations frontend mocks use these names. **Dev 1: if your Mongoose models differ, tell Dev 4 and we rename on our side.**
Rules from the task sheet apply: camelCase fields, lowercase snake_case status values, every response is `{ success, data, message }`.

Product catalog for the seed script: [`product-catalog.json`](product-catalog.json) (28 products, INR prices).

## Models

**Product**: `name, sku (unique), category, brand, unit, price, costPrice, warrantyMonths, trackSerial, reorderLevel, specs, warehouse, stockQty, isActive`
- `category`: `solar_panel | inverter | battery | charge_controller | mounting_structure | cable | electrical | accessory`
- `stockQty` is only used when `trackSerial: false`. For serial products, stock = count of SerialItems with `status: in_stock`.
- List responses add computed `inStock` and `isLowStock` (`inStock < reorderLevel`).

**SerialItem**: `serialNumber (unique), product, status, warehouse, order, customer, installation, warranty, stockInDate, notes`
- `status`: `in_stock | reserved | installed | defective`

**Technician**: `name, phone, email, skills [String], status, isActive`
- `status`: `available | on_job | leave`

**Installation**: `installationNumber, order, customer, scheduledDate, technicians [ref], status, siteAddress, systemSizeKw, startedAt, completedAt, notes`
- `status`: `scheduled | in_progress | completed | cancelled`

**Warranty**: `warrantyNumber, serialItem, serialNumber, product, customer, order, installation, startDate, endDate, status`
- `status`: `active | expired` (endDate = startDate + product.warrantyMonths; startDate = installation completedAt)

**Ticket**: `ticketNumber, customer, order, serialItem, warranty, type, priority, status, subject, description, assignedTechnician, resolutionNotes, isBillable, resolvedAt`
- `type`: `complaint | service | warranty_claim`
- `priority`: `low | medium | high | urgent`
- `status`: `open | assigned | in_progress | resolved | closed`
- `isBillable` = false when the linked warranty is active.

**Order** (Dev 3 / Dev 1, Operations reads it): `orderNumber, customer, systemType (on_grid | off_grid), systemSizeKw, status, items [{ product, quantity, unitPrice }], totalAmount`
- Operations needs order `status` values: `confirmed` (awaiting reservation) -> `reserved` -> `installation_scheduled` -> `installed`.

Refs (`product`, `customer`, `order`, `technicians`, `assignedTechnician`, ...) are expected **populated** in GET responses.

## Endpoints the frontend calls (base `VITE_API_URL`, default `http://localhost:4000/api/v1`, cookie auth with credentials)

| Module | Calls |
|---|---|
| Products | `GET /products?q&category&lowStock`, `GET /products/:id`, `POST /products`, `PUT /products/:id` |
| Inventory | `GET /inventory/summary`, `GET /serials?product&status&q`, `POST /serials/stock-in {product, serialNumbers[], quantity, warehouse}`, `GET /serials/lookup/:serialNumber` (full trace incl. installation, warranty, tickets) |
| Orders | `GET /orders?status=confirmed`, `GET /orders/:id`, `POST /orders/:id/reserve {allocations: [{product, serialItems: [id]}]}` |
| Technicians | `GET /technicians?q&status`, `POST /technicians`, `PUT /technicians/:id`, `PATCH /technicians/:id/status {status}` |
| Installations | `GET /installations?status&from&to`, `GET /installations/:id`, `POST /installations {order, scheduledDate, technicians[], notes}`, `PUT /installations/:id`, `PATCH /installations/:id/status {status}`, `POST /installations/:id/complete` (creates warranties) |
| Warranties | `GET /warranties?status&q&customer`, `GET /warranties/serial/:serialNumber` |
| Tickets | `GET /tickets?status&priority&type&assignedTechnician&q`, `GET /tickets/:id`, `POST /tickets`, `PUT /tickets/:id`, `PATCH /tickets/:id/assign {assignedTechnician}`, `PATCH /tickets/:id/status {status, resolutionNotes}` |

Mock behaviour for each call lives in `frontend/src/api/operations/*.js` (the `USE_MOCK` branch) and is a working reference for the backend logic.
