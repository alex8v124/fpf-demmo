import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.yqajcjzkgcmauazcvwtd',
  password: 'VUGV5bTmVPzYJczF',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name = 'id';
  `);
  console.log('Existing tables and id types:', res.rows);
  await client.end();
}
main();
