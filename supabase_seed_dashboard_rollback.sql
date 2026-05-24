begin;

delete from public.appointments
where summary = 'TEST_20260524 cita comercial de prueba';

delete from public.product_interests
where created_at >= now() - interval '30 days'
  and conversation_id in (
    select id from public.conversations where user_id in (
      select id from public.users where name like 'TEST_20260524%'
    )
  );

delete from public.messages
where conversation_id in (
  select id from public.conversations where user_id in (
    select id from public.users where name like 'TEST_20260524%'
  )
);

delete from public.conversations
where user_id in (
  select id from public.users where name like 'TEST_20260524%'
);

delete from public.users
where name like 'TEST_20260524%'
   or email like 'test_20260524_%';

delete from public.products
where name like 'TEST_20260524%';

delete from public.advisors
where name like 'TEST_20260524%'
   or email like 'test_20260524_%';

commit;
