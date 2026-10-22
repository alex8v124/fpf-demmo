import { createClient } from '@supabase/supabase-js';

const url = 'https://yqajcjzkgcmauazcvwtd.supabase.co';
const key = 'sb_publishable__TonarQ5mpLl1jjc_tE3tg_uE8pA-Qh';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('expedientes_medicos').select('id, nombre_completo, club, estado_aptitud, imc');
  console.log('Query expedientes_medicos:', { count: data?.length, rows: data, error });
}
test();
