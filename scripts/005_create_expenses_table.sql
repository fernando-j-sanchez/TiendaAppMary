-- Tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'efectivo',
  receipt_image_url TEXT,
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
