const VERSION='kleenest-mail-v1';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',(event)=>{
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message',(event)=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});

// Mail content is intentionally network-first and is not cached by this worker.
// This prevents stale or sensitive mailbox data from being persisted in a shared cache.
