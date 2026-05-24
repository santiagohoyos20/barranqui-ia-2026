-- ============================================================
-- SERFINANZA AI — Schema PostgreSQL / Supabase
-- Ejecutar en el SQL Editor de Supabase (proyecto limpio o tras backup)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ADVISORS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS advisors (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  role        TEXT        NOT NULL DEFAULT 'advisor',
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  category      TEXT        NOT NULL,
  min_income    NUMERIC(12,2),
  min_age       SMALLINT,
  max_age       SMALLINT,
  description   TEXT,
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USERS (clientes potenciales) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT        NOT NULL UNIQUE,
  name            TEXT,
  email           TEXT,
  monthly_income  NUMERIC(12,2),
  id_number       TEXT,
  status          TEXT        NOT NULL DEFAULT 'prospect'
                              CHECK (status IN ('prospect', 'qualified', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── CONVERSATIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel     TEXT        NOT NULL DEFAULT 'whatsapp',
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT        NOT NULL,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- ─── PRODUCT_INTERESTS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_interests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  product_id       UUID        NOT NULL REFERENCES products(id),
  outcome          TEXT        NOT NULL DEFAULT 'interested'
                               CHECK (outcome IN ('interested', 'qualified', 'rejected', 'abandoned')),
  rejection_reason TEXT        CHECK (rejection_reason IN (
                                 'low_income', 'age', 'incomplete_docs', 'other'
                               )),
  abandonment_step TEXT        CHECK (abandonment_step IN (
                                 'income', 'id_number', 'email', 'name', 'other'
                               )),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_pi_conversation_id ON product_interests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pi_product_id      ON product_interests(product_id);
CREATE INDEX IF NOT EXISTS idx_pi_created_at      ON product_interests(created_at);
CREATE INDEX IF NOT EXISTS idx_pi_outcome         ON product_interests(outcome);

-- ─── APPOINTMENTS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id),
  product_id       UUID        NOT NULL REFERENCES products(id),
  advisor_id       UUID        NOT NULL REFERENCES advisors(id),
  conversation_id  UUID        NOT NULL REFERENCES conversations(id),
  status           TEXT        NOT NULL DEFAULT 'pending_confirmation'
                               CHECK (status IN (
                                 'pending_confirmation', 'confirmed', 'rejected_by_client'
                               )),
  summary          TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_advisor_id   ON appointments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id      ON appointments(user_id);

-- ─── VISTAS DASHBOARD ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_dashboard_metrics AS
WITH interested_users AS (
  SELECT COUNT(DISTINCT c.user_id) AS total
  FROM product_interests pi
  JOIN conversations c ON c.id = pi.conversation_id
),
confirmed AS (
  SELECT COUNT(*) AS total FROM appointments WHERE status = 'confirmed'
)
SELECT
  (SELECT COUNT(DISTINCT user_id) FROM conversations WHERE channel IN ('whatsapp', 'telegram')) AS unique_users,
  (SELECT COUNT(*) FROM conversations WHERE channel IN ('whatsapp', 'telegram'))                AS total_conversations,
  (SELECT total FROM confirmed)                                                                AS confirmed_appointments,
  (SELECT total FROM interested_users)                                                         AS interested_users,
  ROUND(
    (SELECT total FROM confirmed)::NUMERIC /
    NULLIF((SELECT total FROM interested_users), 0) * 100, 2
  )                                                                                            AS conversion_rate_pct;

CREATE OR REPLACE VIEW v_product_stats AS
SELECT
  p.id,
  p.name,
  p.category,
  COUNT(pi.id)                                                    AS total_interests,
  COUNT(pi.id) FILTER (WHERE pi.outcome = 'rejected')            AS total_rejections,
  COUNT(a.id)  FILTER (WHERE a.status  = 'confirmed')            AS total_appointments,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'confirmed')::NUMERIC /
    NULLIF(COUNT(pi.id), 0) * 100, 2
  )                                                               AS conversion_rate_pct
FROM products p
LEFT JOIN product_interests pi ON pi.product_id = p.id
LEFT JOIN appointments       a  ON a.product_id  = p.id
GROUP BY p.id, p.name, p.category;

CREATE OR REPLACE VIEW v_rejection_reasons AS
SELECT
  rejection_reason,
  COUNT(*) AS total
FROM product_interests
WHERE outcome = 'rejected' AND rejection_reason IS NOT NULL
GROUP BY rejection_reason
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_abandonment_steps AS
SELECT
  abandonment_step,
  COUNT(*) AS total
FROM product_interests
WHERE outcome = 'abandoned' AND abandonment_step IS NOT NULL
GROUP BY abandonment_step
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_daily_trend AS
SELECT
  DATE(created_at) AS day,
  COUNT(*)         AS total_interests
FROM product_interests
GROUP BY DATE(created_at)
ORDER BY day;

CREATE OR REPLACE VIEW v_advisor_appointments AS
SELECT
  adv.id,
  adv.name,
  COUNT(a.id) FILTER (WHERE a.status = 'confirmed') AS confirmed_appointments
FROM advisors adv
LEFT JOIN appointments a ON a.advisor_id = adv.id
GROUP BY adv.id, adv.name
ORDER BY confirmed_appointments DESC;

-- ─── RLS: lectura pública para dashboard (anon key) ──────────────────────────

ALTER TABLE advisors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_read_advisors"          ON advisors;
DROP POLICY IF EXISTS "dashboard_read_products"          ON products;
DROP POLICY IF EXISTS "dashboard_read_users"             ON users;
DROP POLICY IF EXISTS "dashboard_read_conversations"     ON conversations;
DROP POLICY IF EXISTS "dashboard_read_messages"          ON messages;
DROP POLICY IF EXISTS "dashboard_read_product_interests" ON product_interests;
DROP POLICY IF EXISTS "dashboard_read_appointments"      ON appointments;

CREATE POLICY "dashboard_read_advisors"          ON advisors          FOR SELECT USING (true);
CREATE POLICY "dashboard_read_products"          ON products          FOR SELECT USING (true);
CREATE POLICY "dashboard_read_users"             ON users             FOR SELECT USING (true);
CREATE POLICY "dashboard_read_conversations"     ON conversations     FOR SELECT USING (true);
CREATE POLICY "dashboard_read_messages"          ON messages          FOR SELECT USING (true);
CREATE POLICY "dashboard_read_product_interests" ON product_interests FOR SELECT USING (true);
CREATE POLICY "dashboard_read_appointments"      ON appointments      FOR SELECT USING (true);

-- Escritura: solo service_role (backend webhook). No crear políticas INSERT para anon.
