-- Tabla de configuración de la tienda
CREATE TABLE IF NOT EXISTS store_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Mi Tiendita',
  store_phone TEXT,
  store_address TEXT,
  receipt_message TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  low_stock_alert_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_store_config_updated_at
  BEFORE UPDATE ON store_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto
INSERT INTO store_config (store_name, store_phone, receipt_message)
VALUES (
  'La Tiendita de Doña Mary',
  '',
  'Gracias por su compra'
)
ON CONFLICT DO NOTHING;
