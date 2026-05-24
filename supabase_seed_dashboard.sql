begin;

with inserted_advisors as (
  insert into public.advisors (name, email, role, active)
  values
    ('TEST_20260524_Ana', 'test_20260524_ana@example.com', 'advisor', true),
    ('TEST_20260524_Carlos', 'test_20260524_carlos@example.com', 'advisor', true),
    ('TEST_20260524_Laura', 'test_20260524_laura@example.com', 'advisor', true)
  returning id, name
),
inserted_products as (
  insert into public.products (name, category, min_income, min_age, max_age, description, active)
  values
    ('TEST_20260524_Credito Vivienda', 'credito', 1500000, 18, 70, 'Producto de prueba', true),
    ('TEST_20260524_Credito Libre Inversion', 'credito', 1000000, 18, 70, 'Producto de prueba', true),
    ('TEST_20260524_Tarjeta Credito', 'tarjeta', 0, 18, 70, 'Producto de prueba', true),
    ('TEST_20260524_CDT', 'inversion', 500000, 18, 70, 'Producto de prueba', true),
    ('TEST_20260524_Seguros', 'seguros', 0, 18, 70, 'Producto de prueba', true)
  returning id, name
),
inserted_users as (
  insert into public.users (phone, name, email, monthly_income, id_number, status)
  values
    ('3000000001', 'TEST_20260524_Usuario_1', 'test_20260524_usuario_1@example.com', 3200000, '900000001', 'qualified'),
    ('3000000002', 'TEST_20260524_Usuario_2', 'test_20260524_usuario_2@example.com', 1800000, '900000002', 'qualified'),
    ('3000000003', 'TEST_20260524_Usuario_3', 'test_20260524_usuario_3@example.com', 1200000, '900000003', 'rejected'),
    ('3000000004', 'TEST_20260524_Usuario_4', 'test_20260524_usuario_4@example.com', 2400000, '900000004', 'qualified'),
    ('3000000005', 'TEST_20260524_Usuario_5', 'test_20260524_usuario_5@example.com', 900000, '900000005', 'prospect')
  returning id, phone, name
),
conversation_rows as (
  insert into public.conversations (user_id, channel, status, started_at, ended_at)
  select
    u.id,
    case
      when u.phone in ('3000000001', '3000000004') then 'whatsapp'
      when u.phone = '3000000002' then 'web'
      else 'voice'
    end,
    case
      when u.phone = '3000000003' then 'abandoned'
      else 'completed'
    end,
    now() - interval '1 day' * (5 - row_number() over (order by u.phone)),
    case
      when u.phone = '3000000003' then null
      else now() - interval '1 day' * (5 - row_number() over (order by u.phone)) + interval '14 minutes'
    end
  from inserted_users u
  returning id, user_id, channel, status, started_at, ended_at
),
message_rows as (
  insert into public.messages (conversation_id, role, content, sent_at)
  select c.id, 'user', 'Hola, quiero conocer productos', c.started_at + interval '1 minute'
  from conversation_rows c
  union all
  select c.id, 'assistant', 'Claro, cuéntame qué te interesa', c.started_at + interval '2 minutes'
  from conversation_rows c
  union all
  select c.id, 'user', 'Necesito una cita con asesor', c.started_at + interval '3 minutes'
  from conversation_rows c
  where c.status = 'completed'
),
interest_rows as (
  insert into public.product_interests (conversation_id, product_id, outcome, rejection_reason, abandonment_step, created_at)
  select c.id, p.id, 'qualified', null, null, c.started_at + interval '4 minutes'
  from conversation_rows c
  join inserted_products p on p.name = 'TEST_20260524_Credito Vivienda'
  where c.status = 'completed'
  union all
  select c.id, p.id, 'interested', null, null, c.started_at + interval '5 minutes'
  from conversation_rows c
  join inserted_products p on p.name = 'TEST_20260524_Credito Libre Inversion'
  where c.status = 'completed'
  union all
  select c.id, p.id, 'rejected', 'low_income', null, c.started_at + interval '6 minutes'
  from conversation_rows c
  join inserted_products p on p.name = 'TEST_20260524_Tarjeta Credito'
  where c.status = 'completed'
  union all
  select c.id, p.id, 'abandoned', null, 'email', c.started_at + interval '7 minutes'
  from conversation_rows c
  join inserted_products p on p.name = 'TEST_20260524_CDT'
  where c.status = 'abandoned'
),
appointment_rows as (
  insert into public.appointments (user_id, product_id, advisor_id, conversation_id, status, summary, scheduled_at)
  select
    u.id,
    p.id,
    a.id,
    c.id,
    case when u.phone = '3000000003' then 'rejected_by_client' else 'confirmed' end,
    'TEST_20260524 cita comercial de prueba',
    now() + interval '1 day' * row_number() over (order by u.phone)
  from inserted_users u
  join conversation_rows c on c.user_id = u.id
  join inserted_products p on p.name = case
    when u.phone = '3000000001' then 'TEST_20260524_Credito Vivienda'
    when u.phone = '3000000002' then 'TEST_20260524_Credito Libre Inversion'
    when u.phone = '3000000003' then 'TEST_20260524_Tarjeta Credito'
    when u.phone = '3000000004' then 'TEST_20260524_CDT'
    else 'TEST_20260524_Seguros'
  end
  join inserted_advisors a on a.name = case
    when u.phone in ('3000000001', '3000000004') then 'TEST_20260524_Ana'
    when u.phone = '3000000002' then 'TEST_20260524_Carlos'
    else 'TEST_20260524_Laura'
  end
  where c.status = 'completed'
  returning id
)

select
  (select count(*) from inserted_advisors) as advisors_inserted,
  (select count(*) from inserted_products) as products_inserted,
  (select count(*) from inserted_users) as users_inserted,
  (select count(*) from conversation_rows) as conversations_inserted,
  (select count(*) from interest_rows) as product_interests_inserted,
  (select count(*) from appointment_rows) as appointments_inserted;

commit;
