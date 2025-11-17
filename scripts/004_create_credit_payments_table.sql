-- Tabla de pagos de crédito (fiado)
CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'efectivo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_credit_payments_customer_id ON credit_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_created_at ON credit_payments(created_at DESC);
