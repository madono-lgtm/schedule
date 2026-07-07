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

// ▼ プッシュ通知を使う場合だけ：生成した VAPID「公開鍵」を貼る（手順は PUSH-SETUP 参照）▼
export const VAPID_PUBLIC_KEY = 'YOUR-VAPID-PUBLIC-KEY';
export const pushConfigured = !VAPID_PUBLIC_KEY.includes('YOUR-');

/* ---- 問い合わせ項目（カテゴリ）---- */
export async function bookableCategories(){        // お客様用：受付中かつ表示中
  const { data, error } = await supabase.from('categories')
    .select('*').eq('active', true).eq('bookable', true).order('sort_order');
  if(error) throw error; return data||[];
}
export async function customerCategories(){        // お客様画面用：表示中（仕事＋私用）
  const { data, error } = await supabase.from('categories')
    .select('*').eq('active', true).order('sort_order');
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

/* ---- 私用の解放枠 ---- */
export async function privateSlotsForDate(dateKey){
  const { data, error } = await supabase.from('private_slots').select('time').eq('date_key', dateKey);
  if(error) throw error; return (data||[]).map(r=>r.time);
}
export async function allPrivateSlots(){
  const { data, error } = await supabase.from('private_slots').select('*')
    .order('date_key', { ascending:true }).order('time', { ascending:true });
  if(error) throw error; return data||[];
}
export async function addPrivateSlots(dateKey, times){
  const rows = times.map(t => ({ date_key: dateKey, time: t }));
  const { error } = await supabase.from('private_slots').upsert(rows, { onConflict:'date_key,time' });
  if(error) throw error;
}
export async function removePrivateSlot(dateKey, time){
  const { error } = await supabase.from('private_slots').delete().eq('date_key', dateKey).eq('time', time);
  if(error) throw error;
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

/* ---- プライベート（承認制）---- */
export async function privateCategory(){
  const { data, error } = await supabase.from('categories').select('*').eq('slug','private').maybeSingle();
  if(error) throw error; return data;
}
export async function submitPrivateRequest(b){
  const { error } = await supabase.from('bookings').insert({
    no:b.no, type:b.type||'プライベート', dur:b.dur, category_slug:'private', color:b.color,
    source:'private', status:'pending',
    date_key:b.dateKey, date_label:b.dateLabel, time:b.time,
    name:b.name, instagram:b.instagram, line_url:b.lineUrl
  });
  if(error) throw error;
}
export async function approveBooking(id){
  const { error } = await supabase.from('bookings').update({ status:'approved' }).eq('id', id);
  if(error) throw error;
}
export async function rejectBooking(id){
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if(error) throw error;
}

/* ---- プッシュ通知（購読情報の保存）---- */
export async function savePushSubscription(sub){
  const j = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth
  }, { onConflict:'endpoint' });
  if(error) throw error;
}
export async function deletePushSubscription(endpoint){
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
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
