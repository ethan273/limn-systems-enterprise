// Test script for tRPC API endpoints
import { appRouter } from './src/server/api/root.ts';
import { createContext } from './src/server/api/trpc/context.ts';

async function testAPI() {
  console.log('🚀 Testing Limn Systems API Endpoints\n');
  console.log('='.repeat(50));
  
  // Create context for testing
  const ctx = await createContext({
    session: null,
    req: {} as any,
    res: undefined,
  });

  try {
    // Test Clients endpoint
    console.log('\n📊 Testing Clients endpoint...');
    const clients = await appRouter.createCaller(ctx).clients.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Clients: Found ${clients.total} clients`);
    clients.items.slice(0, 3).forEach((client: any) => {
      console.log(`   • ${client.name}`);
    });

    // Test Tasks endpoint
    console.log('\n📝 Testing Tasks endpoint...');
    const tasks = await appRouter.createCaller(ctx).tasks.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Tasks: Found ${tasks.total} tasks`);
    tasks.items.slice(0, 3).forEach((task: any) => {
      console.log(`   • ${task.title} - ${task.status}`);
    });

    // Test Leads endpoint
    console.log('\n🎯 Testing Leads endpoint...');
    const leads = await appRouter.createCaller(ctx).leads.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Leads: Found ${leads.total} leads`);
    leads.items.slice(0, 3).forEach((lead: any) => {
      console.log(`   • ${lead.name} - Status: ${lead.prospect_status || 'none'}`);
    });

    // Test Orders endpoint
    console.log('\n📦 Testing Orders endpoint...');
    const orders = await appRouter.createCaller(ctx).orders.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Orders: Found ${orders.total} orders`);
    orders.items.slice(0, 3).forEach((order: any) => {
      console.log(`   • Order #${order.order_number} - ${order.status}`);
    });

    // Test Items endpoint
    console.log('\n🛍️ Testing Items endpoint...');
    const items = await appRouter.createCaller(ctx).items.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Items: Found ${items.total} items`);
    items.items.slice(0, 3).forEach((item: any) => {
      console.log(`   • ${item.name} - SKU: ${item.sku_full || 'none'}`);
    });

    // Test Collections endpoint
    console.log('\n📚 Testing Collections endpoint...');
    const collections = await appRouter.createCaller(ctx).collections.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Collections: Found ${collections.total} collections`);
    collections.items.slice(0, 3).forEach((collection: any) => {
      console.log(`   • ${collection.name}`);
    });

    // Test Materials endpoint
    console.log('\n🧱 Testing Materials endpoint...');
    const materials = await appRouter.createCaller(ctx).materials.getAll({ 
      limit: 5, 
      offset: 0 
    });
    console.log(`✅ Materials: Found ${materials.total} materials`);
    materials.items.slice(0, 3).forEach((material: any) => {
      console.log(`   • ${material.name} - ${material.type}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL API ENDPOINTS TESTED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log(`   • ${clients.total} Clients`);
    console.log(`   • ${tasks.total} Tasks`);
    console.log(`   • ${leads.total} Leads`);
    console.log(`   • ${orders.total} Orders`);
    console.log(`   • ${items.total} Items`);
    console.log(`   • ${collections.total} Collections`);
    console.log(`   • ${materials.total} Materials`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Supabase handles connection management automatically - no need to disconnect
    console.log('🔌 Connection cleaned up automatically by Supabase');
  }
}

// Run the tests
testAPI().catch(console.error);