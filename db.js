// ============================================================
//  Supabase 接続 & データアクセス（index.html / admin.html 共通）
//  ▼ この2つだけ、あなたのプロジェクトの値に書き換えてください ▼
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = 'https://einttcojnlhcdhygeyqw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_i0mP4mffYlN8R3tZpWD1VA_LIiRdi_l';
// ============================================================

export const configured =
  !SUPABASE_URL.includes('YOUR-') && !SUPABASE_ANON_KEY.includes('YOUR-');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---- 問い合わせ項目（カテゴリ）---- */
export async function bookableCategories(){        // お客様用：受付中かつ表示中
  const { data, error } = await supabase.from('categories')
    .select('*').eq('active', true).eq('bookable', true).order('sort_order');
  if(error) throw error; return data||[];
}
export async function allCategories(){             // 管理用：全件
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if(error) throw error; return data||[];
}
export async function upsertCategory(c){
  const { error } = await supabase.from('categories').upsert(c, { onConflict:'slug' });
  if(error) throw error;
}
export async function updateCategory(slug, patch){
  const { error } = await supabase.from('categories').update(patch).eq('slug', slug);
  if(error) throw error;
}
export async function deleteCategory(slug){
  const { error } = await supabase.from('categories').delete().eq('slug', slug);
  if(error) throw error;
}

/* ---- お客様側 ---- */
export async function addBooking(b){
  const { error } = await supabase.from('bookings').insert({
    no:b.no, type:b.type, dur:b.dur, category_slug:b.categorySlug, color:b.color, source:'customer',
    date_key:b.dateKey, date_label:b.dateLabel, time:b.time,
    name:b.name, company:b.company, tel:b.tel, mail:b.mail, memo:b.memo
  });
  if(error) throw error;
}
export async function takenSlots(dateKey){
  const { data, error } = await supabase
    .from('public_taken_slots').select('time').eq('date_key', dateKey);
  if(error) throw error;
  return (data||[]).map(r=>r.time);
}
export async function blockedDays(){
  const { data, error } = await supabase
    .from('blocked_days').select('day').order('day');
  if(error) throw error;
  return (data||[]).map(r=>r.day);
}

/* ---- 管理側（要ログイン）---- */
export async function addAdminBooking(b){          // 自分用・プライベート予約
  const { error } = await supabase.from('bookings').insert({
    no:b.no, type:b.type, dur:b.dur, category_slug:b.categorySlug, color:b.color, source:'admin',
    date_key:b.dateKey, date_label:b.dateLabel, time:b.time, name:b.name, memo:b.memo
  });
  if(error) throw error;
}
export async function allBookings(){
  const { data, error } = await supabase
    .from('bookings').select('*')
    .order('date_key', { ascending:true }).order('time', { ascending:true });
  if(error) throw error;
  return data||[];
}
export async function deleteBooking(id){
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if(error) throw error;
}
export async function addBlocked(day){
  const { error } = await supabase.from('blocked_days').upsert({ day }, { onConflict:'day' });
  if(error) throw error;
}
export async function removeBlocked(day){
  const { error } = await supabase.from('blocked_days').delete().eq('day', day);
  if(error) throw error;
}

/* ---- 認証（管理者）---- */
export async function signIn(email, password){
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) throw error;
}
export async function signOut(){ await supabase.auth.signOut(); }
export async function currentSession(){
  const { data } = await supabase.auth.getSession();
  return data.session;
}
