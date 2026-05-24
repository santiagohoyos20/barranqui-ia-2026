import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Crear usuario de prueba
  const { data: user, error: userErr } = await client
    .from('users')
    .insert({ phone: '3009999999', name: 'Test Claude' })
    .select('id')
    .single();

  if (userErr) { console.error('❌ Usuario:', userErr.message); return; }
  console.log('✅ Usuario creado:', user);

  // 2. Crear conversación ligada a ese usuario
  const { data: conv, error: convErr } = await client
    .from('conversations')
    .insert({ user_id: user.id, channel: 'telegram', status: 'active' })
    .select()
    .single();

  if (convErr) { console.error('❌ Conversación:', convErr.message); return; }
  console.log('✅ Conversación creada:', JSON.stringify(conv, null, 2));

  // 3. Limpiar
  await client.from('conversations').delete().eq('id', conv.id);
  await client.from('users').delete().eq('id', user.id);
  console.log('\n🗑️  Datos de prueba borrados');
}

main().catch(console.error);
