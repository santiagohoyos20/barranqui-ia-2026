require('dotenv').config();

async function main() {
  const persistence = (await import('../dist/services/supabase/persistence.service.js')).default;
  await persistence.initialize();

  console.log('enabled:', persistence.isEnabled());
  console.log('ready:', persistence.isReady());

  const ctx = await persistence.startChannelSession('tg:test-user-999', 'telegram', 'Test User');
  console.log('ctx:', ctx);

  if (ctx) {
    await persistence.insertMessage(ctx.dbConversationId, 'user', 'Hola, quiero un crédito de vivienda. Gano 3 millones');
    await persistence.processEvents(ctx, {
      userData: { monthly_income: 3000000 },
      productInterest: { productName: 'Crédito de vivienda', outcome: 'interested' },
    });
    console.log('Integration test OK');
  }
}

main().catch(console.error);
