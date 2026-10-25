const C = "miplata-v20", SHELL = ["./", "index.html", "styles.css", "mejoras.css", "pantallas.css", "estetica.css", "tailwind.css", "tema.js", "idioma.js", "idioma-datos.js", "estetica.js", "zoom.js", "logica.js", "pantallas.js", "vistas.js", "acciones.js", "reporte.js", "rapido.js", "respaldo.js", "nuevas.js", "manifest.json", "icon-192.png", "icon-512.png"];
// Instalar: se descarga todo saltándose la caché HTTP (GitHub Pages guarda 10 min), así una versión nueva nunca queda a medias
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })))))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n != C).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
// Abrir la app = leer de la caché al instante (antes esperaba a la red en cada apertura y en cada archivo) y refrescar en segundo plano para la próxima vez.
// Los archivos de otros sitios (Font Awesome, Chart.js) llevan la versión en la URL: no cambian, se sirven de caché sin revalidar.
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method != "GET" || r.url.includes("finnhub.io")) return; // cotizaciones: siempre en vivo, nunca de caché
  const same = r.url.startsWith(self.location.origin);
  e.respondWith(caches.open(C).then(async cache => {
    const hit = await cache.match(r, { ignoreSearch: same });
    if (hit && !same) return hit;
    const net = fetch(r, same ? { cache: "no-cache" } : undefined).then(res => { if (res && (res.ok || res.type == "opaque")) cache.put(r, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => caches.match(r));
  }));
});

// ---- Avisos en segundo plano ----
// La app guarda en IndexedDB la lista de avisos (metas, tarjetas, deudas). Cuando el sistema despierta
// este service worker (Periodic Background Sync, solo Chrome/Edge en Android con la app instalada),
// se revisa esa lista y se muestran los que ya tocan.
const idb = () => new Promise((ok, no) => { const r = indexedDB.open("miplata", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const kvGet = k => idb().then(db => new Promise(ok => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); })).catch(() => undefined);
const kvSet = (k, v) => idb().then(db => new Promise(ok => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = ok; t.onerror = ok; })).catch(() => {});
const dueTxt = d => d < 0 ? "venció hace " + (-d) + (d == -1 ? " día" : " días") : d == 0 ? "vence hoy" : "vence en " + d + (d == 1 ? " día" : " días");
async function avisos() {
  const ev = await kvGet("events"); if (!ev || !ev.length) return;
  const sent = (await kvGet("sent")) || {};
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const td = t0.getFullYear() + "-" + String(t0.getMonth() + 1).padStart(2, "0") + "-" + String(t0.getDate()).padStart(2, "0");
  let ch = false;
  for (const e of ev) {
    const days = Math.round((new Date(e.date + "T00:00:00") - t0) / 864e5);
    if (days > e.win || days < -7 || sent[e.key] == td) continue;
    await self.registration.showNotification(e.title, { body: e.what + " " + dueTxt(days) + ". " + e.extra, icon: "icon-192.png", tag: e.key });
    sent[e.key] = td; ch = true;
  }
  if (ch) await kvSet("sent", sent);
}
self.addEventListener("periodicsync", e => { if (e.tag == "miplata-avisos") e.waitUntil(avisos()); });
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => l.length ? l[0].focus() : clients.openWindow("./")));
});
