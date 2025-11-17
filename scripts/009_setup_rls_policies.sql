-- Deshabilitar RLS para este proyecto
-- Como este es un sistema POS local sin autenticación multi-usuario,
-- no necesitamos RLS. Las políticas se pueden agregar más tarde si se necesita.

-- Productos
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Clientes
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Ventas
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- Pagos de crédito
ALTER TABLE credit_payments DISABLE ROW LEVEL SECURITY;

-- Gastos
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Proveedores
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- Lista de compras
ALTER TABLE shopping_list DISABLE ROW LEVEL SECURITY;

-- Configuración
ALTER TABLE store_config DISABLE ROW LEVEL SECURITY;
