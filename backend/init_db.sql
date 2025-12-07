-- Script de inicialización para tablas de negocio (Mate Único)
-- Ejecutar este script en la base de datos PostgreSQL para crear la estructura necesaria

-- 1. Tabla de Usuarios (Clientes)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255), -- Puede ser null si entra con Google
    foto VARCHAR(255),
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Domicilios
CREATE TABLE IF NOT EXISTS domicilio (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    calle VARCHAR(100),
    numero VARCHAR(20),
    ciudad VARCHAR(50),
    provincia VARCHAR(50),
    pais VARCHAR(50),
    codigo_postal VARCHAR(20),
    telefono VARCHAR(50)
);

-- 3. Tabla de Carritos
CREATE TABLE IF NOT EXISTS carrito (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES usuarios(id),
    precio_total DECIMAL(10, 2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo' -- 'activo', 'cerrado'
);

-- 4. Items del Carrito
-- Relaciona el carrito con los productos (IDs de Strapi)
CREATE TABLE IF NOT EXISTS item_carrito (
    id SERIAL PRIMARY KEY,
    carrito_id INTEGER REFERENCES carrito(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL, -- ID que viene de Strapi
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(10, 2),
    color VARCHAR(50),
    grabado_texto VARCHAR(20),
    costo_grabado DECIMAL(10, 2) DEFAULT 0
);

-- 5. Orden de Compra (Cabecera)
CREATE TABLE IF NOT EXISTS orden_compra (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES usuarios(id),
    carrito_id INTEGER, -- Referencia histórica
    monto_total DECIMAL(10, 2) NOT NULL,
    estado_pago VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    estado_pedido VARCHAR(20) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pago_id VARCHAR(100), -- ID de transacción de MercadoPago
    
    -- Datos de envío históricos (snapshot)
    direccion_envio VARCHAR(200),
    ciudad_envio VARCHAR(100),
    provincia_envio VARCHAR(100),
    pais_envio VARCHAR(100),
    codigo_postal_envio VARCHAR(20),
    domicilio_id INTEGER
);

-- 6. Líneas de Compra (Detalle de la orden)
CREATE TABLE IF NOT EXISTS linea_compra (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES orden_compra(id),
    producto_id INTEGER NOT NULL,
    cantidad INTEGER,
    precio_unitario DECIMAL(10, 2),
    grabado_texto VARCHAR(20),
    costo_grabado DECIMAL(10, 2) DEFAULT 0
);

