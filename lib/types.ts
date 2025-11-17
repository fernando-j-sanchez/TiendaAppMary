export interface Product {
  id: string
  barcode: string | null
  name: string
  description: string | null
  purchase_price: number
  sale_price: number
  stock: number
  min_stock: number
  category: string | null
  unit: string
  is_active: boolean
  is_favorite: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  address: string | null
  credit_limit: number
  current_debt: number
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  sale_number: string
  customer_id: string | null
  total: number
  payment_method: string
  payment_status: string
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CreditPayment {
  id: string
  customer_id: string
  sale_id: string | null
  amount: number
  payment_method: string
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface Expense {
  id: string
  description: string
  category: string
  amount: number
  payment_method: string
  receipt_image_url: string | null
  notes: string | null
  expense_date: string
  created_at: string
  created_by: string | null
}

export interface Supplier {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  products_supplied: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShoppingListItem {
  id: string
  product_id: string | null
  product_name: string
  quantity: number
  priority: string
  notes: string | null
  is_completed: boolean
  created_at: string
  completed_at: string | null
}
