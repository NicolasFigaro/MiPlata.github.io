// ===== Mi Plata · respaldo.js =====
// Respaldo en la nube.
//  • Android / computador: Google Drive (carpeta oculta de la app, solo Mi Plata puede verla). Se sube solo al abrir la app (máx. 1 vez cada 12 h).
//  • iPhone / iPad: una PWA no puede escribir sola en iCloud. Se usa la hoja de compartir: "Guardar en Archivos" → iCloud Drive.
// Necesitas un "ID de cliente" de Google (gratis, ver instrucciones en Ajustes). Se pega una sola vez en la app.
const RB_FILE = "miplata-respaldo.json", RB_SCOPE = "https://www.googleapis.com/auth/drive.appdata", RB_EVERY = 12 * 36e5;
const rbIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform == "MacIntel" && navigator.maxTouchPoints > 1);
const rbGet = () => { try { return JSON.parse(localStorage.getItem("miplata_drive") || "{}") || {}; } catch (e) { return {}; } };
const rbSet = o => { try { localStorage.setItem("miplata_drive", JSON.stringify(Object.assign(rbGet(), o))); } catch (e) {} };
let rbTok = null, rbTokExp = 0, rbBusy = false;

function rbLoadGIS() {
    return new Promise((ok, no) => {
        if (window.google && google.accounts && google.accounts.oauth2) return ok();
        const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
        s.onload = () => ok(); s.onerror = () => no(new Error("sin conexión")); document.head.appendChild(s);
    });
}
// silent = true: intenta sin mostrar ventana (solo funciona si ya diste permiso antes)
function rbToken(silent) {
    if (rbTok && Date.now() < rbTokExp - 6e4) return Promise.resolve(rbTok);
    const cfg = rbGet(); if (!cfg.cid) return Promise.reject(new Error("Falta el ID de cliente"));
    return rbLoadGIS().then(() => new Promise((ok, no) => {
        const c = google.accounts.oauth2.initTokenClient({
            client_id: cfg.cid, scope: RB_SCOPE,
            callback: r => { if (r.error || !r.access_token) return no(new Error(r.error || "sin permiso")); rbTok = r.access_token; rbTokExp = Date.now() + (r.expires_in || 3600) * 1000; ok(rbTok); },
            error_callback: e => no(new Error((e && e.type) || "cancelado"))
        });
        c.requestAccessToken({ prompt: silent ? "none" : (cfg.on ? "" : "consent") });
    }));
}
const rbApi = (tok, url, opt) => fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: "Bearer " + tok }, (opt || {}).headers) })).then(r => { if (!r.ok) throw new Error("Drive " + r.status); return r; });
async function rbFindId(tok) {
    const r = await rbApi(tok, "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=" + encodeURIComponent("name='" + RB_FILE + "'") + "&fields=files(id,modifiedTime)&pageSize=1");
    const j = await r.json(); return j.files && j.files[0] ? j.files[0] : null;
}
async function rbUpload(tok) {
    const body = JSON.stringify(S), f = await rbFindId(tok);
    if (f) { await rbApi(tok, "https://www.googleapis.com/upload/drive/v3/files/" + f.id + "?uploadType=media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body }); return; }
    const bd = "mp" + Date.now(), meta = JSON.stringify({ name: RB_FILE, parents: ["appDataFolder"], mimeType: "application/json" });
    await rbApi(tok, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + bd },
        body: "--" + bd + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + meta + "\r\n--" + bd + "\r\nContent-Type: application/json\r\n\r\n" + body + "\r\n--" + bd + "--" });
}
// Sube la copia. silent = automático (sin avisos de error); si no se pudo sin ventana, queda pendiente para el próximo toque
async function rbBackupNow(silent) {
    if (rbBusy) return; rbBusy = true;
    try {
        const tok = await rbToken(silent);
        markBackup(); await rbUpload(tok);
        rbSet({ on: 1, last: Date.now(), pend: 0 });
        if (!silent) showToast("Copia guardada en Google Drive");
        if (typeof draw == "function" && !silent) draw();
    } catch (e) {
        if (silent) rbSet({ pend: 1 }); else showToast("No se pudo guardar en Drive: " + (e.message || e), true);
    } finally { rbBusy = false; }
}
function rbSetClient() {
    openCustomModal("ID de cliente de Google", [{ l: "Pega aquí tu ID de cliente", p: "123456-abc.apps.googleusercontent.com", v: rbGet().cid || "" }], v => {
        if (v[0] && !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(v[0])) return "Ese ID no parece válido (termina en .apps.googleusercontent.com).";
        rbSet({ cid: v[0] || "", on: v[0] ? rbGet().on : 0 }); rbTok = null; showToast(v[0] ? "ID guardado" : "ID quitado");
    });
}
function rbDriveOff() { const t = rbTok; rbSet({ on: 0, pend: 0 }); rbTok = null; try { if (t && window.google && google.accounts) google.accounts.oauth2.revoke(t, () => {}); } catch (e) {} draw(); showToast("Respaldo automático desactivado"); }
async function rbRestoreDrive() {
    try {
        const tok = await rbToken(false), f = await rbFindId(tok);
        if (!f) return showToast("No hay copia en tu Drive todavía", true);
        const j = await (await rbApi(tok, "https://www.googleapis.com/drive/v3/files/" + f.id + "?alt=media")).json();
        if (!j || !Array.isArray(j.items)) return showToast("La copia de Drive no es válida", true);
        confirmAction("Esto reemplaza todos tus datos actuales con la copia de Drive (" + String(f.modifiedTime || "").slice(0, 10) + "). ¿Continuar?", () => { localStorage.setItem(KEY, JSON.stringify(j)); location.reload(); });
    } catch (e) { showToast("No se pudo leer Drive: " + (e.message || e), true); }
}
// iPhone / iPad: hoja de compartir → "Guardar en Archivos" → iCloud Drive
async function rbShareFile() {
    markBackup();
    const name = "mi-plata-copia-" + today() + ".json", file = new File([JSON.stringify(S)], name, { type: "application/json" });
    try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Copia de Mi Plata" }); showToast("Elige «Guardar en Archivos» → iCloud Drive"); }
        else downloadBackup();
    } catch (e) { if (e && e.name != "AbortError") downloadBackup(); }
    draw();
}
function rbUI() {
    const cfg = rbGet(), btn = "px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs", btn2 = "px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs";
    if (rbIOS) return `<div class="space-y-3 pb-3 mb-1 border-b border-slate-200 dark:border-slate-700">
        <p class="text-xs font-semibold text-slate-500 uppercase">iCloud (iPhone)</p>
        <p class="text-xs text-slate-400">Apple no deja que una app instalada desde Safari escriba sola en iCloud. Con este botón se abre la hoja de compartir: elige «Guardar en Archivos» y luego iCloud Drive. Te recuerdo cada ${BK_DAYS} días.</p>
        <button onclick="rbShareFile()" class="${btn}">Guardar copia en iCloud</button></div>`;
    const last = cfg.last ? new Date(cfg.last).toLocaleString() : null;
    return `<div class="space-y-3 pb-3 mb-1 border-b border-slate-200 dark:border-slate-700">
        <p class="text-xs font-semibold text-slate-500 uppercase">Google Drive</p>
        <p class="text-xs text-slate-400">${cfg.cid ? (cfg.on ? "Activado ✓ Se guarda solo al abrir la app (cada 12 horas como máximo)." + (last ? " Último respaldo en Drive: " + last : "") : "ID guardado. Falta dar permiso a tu cuenta de Google.") : "Para activarlo necesitas un ID de cliente de Google (gratis). Pasos: console.cloud.google.com → crea un proyecto → habilita «Google Drive API» → Credenciales → ID de cliente de OAuth (aplicación web) → en «Orígenes autorizados» agrega la dirección donde abres la app → pega el ID aquí."}</p>
        <div class="flex flex-wrap gap-2">
            <button onclick="rbSetClient()" class="${cfg.cid ? btn2 : btn}">${cfg.cid ? "Cambiar ID de cliente" : "Pegar ID de cliente"}</button>
            ${cfg.cid ? `<button onclick="rbBackupNow(false)" class="${btn}">${cfg.on ? "Respaldar ahora" : "Activar respaldo en Drive"}</button>` : ""}
            ${cfg.cid && cfg.on ? `<button onclick="rbRestoreDrive()" class="${btn2}">Restaurar desde Drive</button><button onclick="rbDriveOff()" class="${btn2}">Desactivar</button>` : ""}
        </div></div>`;
}
// Respaldo automático: al abrir la app y al volver a ella
function rbAuto() {
    const c = rbGet(); if (rbIOS || !c.cid || !c.on || !navigator.onLine || typeof S == "undefined") return;
    if (c.last && Date.now() - c.last < RB_EVERY && !c.pend) return;
    if (S.items.length < 1 && !S.acc.length) return;
    rbBackupNow(true);
}
// Si el intento silencioso falló, se reintenta en el próximo toque (el navegador solo deja abrir el permiso con un toque)
document.addEventListener("pointerup", () => { const c = rbGet(); if (c.pend && c.on && !rbBusy && !rbIOS) rbBackupNow(false); }, { passive: true });
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(rbAuto, 1500); });
window.addEventListener("load", () => setTimeout(rbAuto, 3000));
