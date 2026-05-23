import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function verifyTable(tableName, columns = 'id') {
  const { data, error } = await supabase.from(tableName).select(columns).limit(5);
  if (error) {
    throw new Error(`${tableName} query failed: ${error.message}`);
  }
  return data;
}

async function main() {
  try {
    console.log('Checking Supabase connection...');
    const tablesToCheck = [
      { name: 'brands', columns: 'id,name,created_at' },
      { name: 'creators', columns: 'id,display_name,created_at' },
      { name: 'chat_threads', columns: 'id,stage,last_message_at' },
    ];

    for (const table of tablesToCheck) {
      const rows = await verifyTable(table.name, table.columns);
      console.log(`✔ ${table.name}: ${rows.length} row(s) visible`);
    }

    console.log('Supabase connection verified successfully.');
  } catch (error) {
    console.error('Supabase connection check failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();
