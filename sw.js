/* 真殿星哉 スケジュール — Service Worker（プッシュ受信）*/
self.addEventListener('install', (e)=>{ self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event)=>{
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch(e){ d = { title:'新しい予約', body: event.data ? event.data.text() : '' }; }
  const title = d.title || '新しい予約';
  const options = {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'booking',
    data: { url: d.url || 'admin.html' },
    vibrate: [80,40,80]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'admin.html';
  event.waitUntil((async ()=>{
    const all = await clients.matchAll({ type:'window', includeUncontrolled:true });
    for(const c of all){ if(c.url.includes('admin.html') && 'focus' in c) return c.focus(); }
    if(clients.openWindow) return clients.openWindow(url);
  })());
});
