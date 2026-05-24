-- Ejecutar SOLO si tienes el schema viejo y quieres migrar a cero.
-- ⚠️ Esto elimina todos los datos existentes.

DROP VIEW IF EXISTS v_advisor_appointments CASCADE;
DROP VIEW IF EXISTS v_daily_trend CASCADE;
DROP VIEW IF EXISTS v_abandonment_steps CASCADE;
DROP VIEW IF EXISTS v_rejection_reasons CASCADE;
DROP VIEW IF EXISTS v_product_stats CASCADE;
DROP VIEW IF EXISTS v_dashboard_metrics CASCADE;

DROP TABLE IF EXISTS abandonment_events CASCADE;
DROP TABLE IF EXISTS user_qualifications CASCADE;
DROP TABLE IF EXISTS product_inquiries CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS product_interests CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS advisors CASCADE;

-- Luego ejecutar schema.sql y seed.sql
