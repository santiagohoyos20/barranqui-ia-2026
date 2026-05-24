require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^["']|["']$/g, '');

async function main() {
  console.log('URL:', url);
  console.log('Key length:', key.length);

  const c = createClient(url, key);
  const tables = ['users', 'conversations', 'messages', 'product_interests'];

  for (const t of tables) {
    const r = await c.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}:`, r.error ? `ERROR ${r.error.message}` : `OK count=${r.count}`);
  }

  const phone = `test-debug-${Date.now()}`;
  const ins = await c.from('users').insert({ phone }).select('id').single();
  console.log('insert test:', ins.error ? ins.error.message : `OK id=${ins.data.id}`);
  if (ins.data) await c.from('users').delete().eq('id', ins.data.id);
}

main().catch(console.error);
