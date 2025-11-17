-- Tabla de lista de compras
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índice para búsqueda
CREATE INDEX IF NOT EXISTS idx_shopping_list_is_completed ON shopping_list(is_completed);
CREATE INDEX IF NOT EXISTS idx_shopping_list_priority ON shopping_list(priority);
