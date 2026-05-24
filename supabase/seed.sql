-- Seed de catálogos Serfinanza para demo / hackathon
-- Ejecutar después de schema.sql

INSERT INTO advisors (name, email, role, active) VALUES
  ('Ana Rodríguez',  'ana.rodriguez@serfinanza.com',  'advisor', true),
  ('Carlos Méndez',  'carlos.mendez@serfinanza.com',  'advisor', true),
  ('Laura Quintero', 'laura.quintero@serfinanza.com', 'advisor', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, category, min_income, min_age, max_age, description) VALUES
  ('Crédito de vivienda',       'credito',    1423500, 18, 84, 'Financiación de vivienda nueva o usada'),
  ('Crédito libre inversión',   'credito',    1423500, 18, 84, 'Crédito de consumo para libre destinación'),
  ('Crédito rotativo',          'credito',    1423500, 18, 84, 'Línea rotativa de crédito'),
  ('Crédito vehículo',          'credito',    1423500, 18, 84, 'Financiación de vehículo nuevo o usado'),
  ('Crédito educativo',         'credito',    1423500, 18, 65, 'Financiación de estudios'),
  ('Crédito de libranza',       'credito',    1423500, 18, 84, 'Crédito con descuento por nómina'),
  ('Compra de cartera',         'credito',     500000, 18, 84, 'Unificación de deudas con otras entidades'),
  ('Crediplazo',                'credito',    1423500, 18, 84, 'Crédito a plazo fijo'),
  ('CDT',                       'inversion',  1000000, 18, NULL, 'Certificado de depósito a término'),
  ('Cuenta de ahorro',          'ahorro',           0, 18, NULL, 'Cuenta de ahorros tradicional'),
  ('Clicuenta',                 'ahorro',           0, 18, NULL, 'Cuenta de ahorro digital'),
  ('Tarjeta Olímpica Mastercard','tarjeta',    1423500, 18, NULL, 'Tarjeta de crédito Mastercard'),
  ('Seguro de vida',            'seguro',           0, 18, 65, 'Protección financiera familiar'),
  ('Seguro contra fraude',      'seguro',           0, 18, NULL, 'Protección contra transacciones fraudulentas')
ON CONFLICT (name) DO NOTHING;
