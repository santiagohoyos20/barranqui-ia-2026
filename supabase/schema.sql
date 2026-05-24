-- Esquema comercial para el dashboard de Serfinanza (Supabase / PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase antes de conectar el frontend.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Catálogos ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advisors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Usuarios y conversaciones ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL DEFAULT 'web',
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Embudo comercial ────────────────────────────────────────────────────────

-- Consulta / interés por producto
CREATE TABLE IF NOT EXISTS product_inquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Precalificación o rechazo del agente
CREATE TABLE IF NOT EXISTS user_qualifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status            TEXT NOT NULL CHECK (status IN ('prequalified', 'rejected')),
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Citas confirmadas con asesor
CREATE TABLE IF NOT EXISTS appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  advisor_id    UUID REFERENCES advisors(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Abandono en pasos del flujo
CREATE TABLE IF NOT EXISTS abandonment_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
  step              TEXT NOT NULL CHECK (step IN ('income_request', 'id_request', 'email_request')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Índices ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_created_at ON product_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_product_id ON product_inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_user_qualifications_created_at ON user_qualifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_qualifications_status ON user_qualifications(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_advisor_id ON appointments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_abandonment_events_created_at ON abandonment_events(created_at);
CREATE INDEX IF NOT EXISTS idx_abandonment_events_step ON abandonment_events(step);

-- ─── RLS: lectura pública para el dashboard (ajusta según tu política) ───────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandonment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "dashboard_read_advisors" ON advisors FOR SELECT USING (true);
CREATE POLICY "dashboard_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "dashboard_read_conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "dashboard_read_inquiries" ON product_inquiries FOR SELECT USING (true);
CREATE POLICY "dashboard_read_qualifications" ON user_qualifications FOR SELECT USING (true);
CREATE POLICY "dashboard_read_appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "dashboard_read_abandonment" ON abandonment_events FOR SELECT USING (true);
