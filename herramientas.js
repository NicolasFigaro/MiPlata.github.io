// ============================================================
// Herramientas: Cierre del mes · Foto de recibo · Calculadora oculta
// ============================================================

// ---------- Cierre del mes ----------
let clSel = null; // mes que se está viendo ("2026-10")
const clPrev = k => ym(new Date(+k.slice(0, 4), +k.slice(5) - 2, 1));
const clNext = k => ym(new Date(+k.slice(0, 4), +k.slice(5), 1));
const clName = k => { const s = new Date(k + "-01T00:00:00").toLocaleDateString(DLOC, { month: "long", year: "numeric" }); return s.charAt(0).toUpperCase() + s.slice(1); };
function clDefault() { const n = new Date(); return n.getDate() <= 7 ? clPrev(ym(n)) : ym(n); } // los primeros días del mes se cierra el anterior

function clStats(k) {
    const its = S.items.filter(x => x.d.startsWith(k) && vis(x));
    const gs = its.filter(x => x.t == "g"), is = its.filter(x => x.t == "i");
    const ing = is.reduce((s, x) => s + x.a, 0), gas = gs.reduce((s, x) => s + x.a, 0);
    const by = {}; gs.forEach(x => { if (x.c != "Ahorro") by[x.c] = (by[x.c] || 0) + x.a; });
    const cats = Object.entries(by).sort((a, b) => b[1] - a[1]);
    const days = {}; gs.forEach(x => { if (x.c != "Ahorro") days[x.d] = (days[x.d] || 0) + x.a; });
    const dayTop = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    const big = gs.filter(x => x.c != "Ahorro" && x.c != "Deudas/Tarjeta").sort((a, b) => b.a - a.a)[0];
    const goals = {}; S.sv.filter(x => x.d.startsWith(k) && !x.i).forEach(x => { goals[x.a] = (goals[x.a] || 0) + (x.cp ?? x.v); });
    const saved = Object.values(goals).reduce((s, v) => s + v, 0);
    const buds = G.filter(g => g[0] != "Ahorro").map(([c]) => ({ c, b: budOf(c, k), s: catSpent(c, k) })).filter(x => x.b > 0);
    return { n: gs.length + is.length, ing, gas, net: ing - gas, rate: ing > 0 ? (ing - gas) / ing : null, cats, dayTop, big, goals, saved, buds,
        nw: S.nwh[k] !== undefined && S.nwh[clPrev(k)] !== undefined ? S.nwh[k] - S.nwh[clPrev(k)] : null };
}

// Hasta 3 ideas concretas para el mes que viene, a partir de lo que pasó
function clTips(k, s, p) {
    const T = [];
    const over = s.buds.filter(x => x.s > x.b).sort((a, b) => (b.s - b.b) - (a.s - a.b))[0];
    if (over) T.push("Te pasaste en " + over.c + " por " + fmt(over.s - over.b) + ". Prueba con un tope de " + fmt(Math.round(over.s * 0.9 / 1000) * 1000) + " el mes que viene.");
    if (s.ing > 0 && s.rate !== null && s.rate < 0.1 && s.net < s.ing * 0.1) T.push("Intenta separar al menos el 10% de lo que entra apenas llegue: serían " + fmt(Math.round(s.ing * 0.1 / 1000) * 1000) + ".");
    const top = s.cats[0], pt = top ? (p.cats.find(c => c[0] == top[0]) || [0, 0])[1] : 0;
    if (top && pt > 0 && top[1] > pt * 1.2) T.push(top[0] + " subió " + Math.round((top[1] / pt - 1) * 100) + "% frente al mes anterior. Vale la pena mirar qué cambió.");
    if (s.rate !== null && s.rate >= 0.2) {
        const g = S.acc.filter(a => !a.f && a.g && goalAll(a) < a.g)[0];
        T.push("Te sobró bien este mes. " + (g ? "Podrías mover " + fmt(Math.round(s.net * 0.5 / 1000) * 1000) + " a tu meta «" + g.n + "»." : "Considera crear una meta para eso que sobra."));
    }
    return T.slice(0, 3);
}

function clText(k) {
    const s = clStats(k); if (!s.n) return "";
    return "Mi cierre de " + clName(k) + " en Mi Plata\n• Ingresos: " + fmt(s.ing) + " · Gastos: " + fmt(s.gas) + "\n• Me quedó: " + fmt(s.net) + (s.rate !== null ? " (" + Math.round(s.rate * 100) + "%)" : "")
        + (s.cats[0] ? "\n• Donde más gasté: " + s.cats[0][0] + " (" + fmt(s.cats[0][1]) + ")" : "");
}
function clShare() {
    const tx = t(clText(clSel || clDefault())); if (!tx) return;
    if (navigator.share) navigator.share({ title: t("Mi cierre del mes"), text: tx }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(tx).then(() => showToast("Resumen copiado")).catch(() => showToast("No se pudo copiar", true));
}
function clGo(n) { clSel = n > 0 ? clNext(clSel || clDefault()) : clPrev(clSel || clDefault()); draw(); }

function vClose() {
    const k = clSel || (clSel = clDefault()), s = clStats(k), p = clStats(clPrev(k));
    const nav = `<div class="flex items-center justify-between mb-4">
        <button onclick="clGo(-1)" aria-label="Mes anterior" class="nav-btn"><i class="fa-solid fa-chevron-left text-xs"></i></button>
        <b class="text-[17px] text-slate-800 dark:text-white">${clName(k)}</b>
        <button onclick="clGo(1)" aria-label="Mes siguiente" class="nav-btn"><i class="fa-solid fa-chevron-right text-xs"></i></button></div>`;
    if (!s.n) return nav + `<section class="${CARD} p-5">${emptyUI("fa-flag-checkered", "#34C759", "Nada anotado en " + clName(k), "Cuando anotes movimientos de este mes, aquí verás cómo cerró: cuánto te quedó, en qué se fue y qué mejorar.", "Anotar un movimiento", "openMov()")}</section>`;
    const good = s.net >= 0, dG = p.n ? s.gas - p.gas : null;
    const hero = `<section class="bg-gradient-to-b ${good ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600"} text-white p-6 rounded-[20px] shadow-sm mb-4">
        <small class="text-xs text-white/80 font-medium uppercase tracking-wider">${good ? "Te quedó" : "Quedaste en"}</small>
        <div class="text-3xl font-extrabold mt-1">${fmt(s.net)}</div>
        <p class="text-xs text-white/85 mt-1">${s.rate !== null ? (good ? "Guardaste el " : "Gastaste de más: ") + Math.abs(Math.round(s.rate * 100)) + "% de lo que ingresó" : "Sin ingresos anotados este mes"}</p>
        <div class="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/15">
            <div><small class="text-[10px] text-white/80 block uppercase">Ingresos</small><b class="text-sm">${fmt(s.ing)}</b></div>
            <div><small class="text-[10px] text-white/80 block uppercase">Gastos</small><b class="text-sm">${fmt(s.gas)}</b>${dG !== null && Math.abs(dG) >= 1 ? `<small class="text-[10px] text-white/80 block">${dG > 0 ? "+" : "-"}${fmt(Math.abs(dG))} vs mes anterior</small>` : ""}</div>
        </div></section>`;
    const top = s.cats.slice(0, 3), mx = s.cats[0] ? s.cats[0][1] : 1;
    const bar = ([c, v]) => `<div class="py-1.5"><div class="flex justify-between text-xs mb-1"><span class="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">${esc(c)}</span><b class="shrink-0">${fmt(v)}</b></div><div class="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full bg-indigo-500" style="width:${Math.max(3, v / mx * 100)}%"></div></div></div>`;
    const cats = `<section class="${CARD} p-5 mb-4"><h3 class="text-sm font-bold text-slate-800 dark:text-white mb-1">En qué se fue</h3>${top.map(bar).join("") || '<p class="text-xs text-slate-400">Sin gastos este mes.</p>'}
        ${s.cats.length > 3 ? sdet("Ver las demás categorías", s.cats.slice(3).map(bar).join("")) : ""}</section>`;
    const bud = s.buds.length ? `<section class="${CARD} p-5 mb-4"><h3 class="text-sm font-bold text-slate-800 dark:text-white mb-2">Presupuestos</h3>${s.buds.map(x => { const r = x.s / x.b; return `<div class="flex items-center justify-between text-xs py-1.5"><span class="truncate pr-2">${esc(x.c)}</span><span class="shrink-0 font-semibold ${r > 1 ? "text-rose-500" : r >= .8 ? "text-amber-500" : "text-emerald-500"}">${fmt(x.s)} de ${fmt(x.b)} ${r > 1 ? "· pasaste" : "✓"}</span></div>`; }).join("")}</section>` : "";
    const det = [];
    if (s.big) det.push(["Tu gasto más grande", fmt(s.big.a) + " · " + esc(s.big.n || s.big.c)]);
    if (s.dayTop) det.push(["Día más caro", dm(+s.dayTop[0].slice(8), +s.dayTop[0].slice(5, 7) - 1) + " · " + fmt(s.dayTop[1])]);
    if (Math.abs(s.saved) >= 1) det.push(["Movido a metas (neto)", fmt(s.saved)]);
    if (s.nw !== null) det.push(["Tu patrimonio", (s.nw >= 0 ? "+" : "-") + fmt(Math.abs(s.nw))]);
    const dets = det.length ? `<section class="${CARD} p-5 mb-4">${sdet("Más detalles del mes", det.map(([a, b]) => `<div class="flex justify-between gap-3 text-xs py-1.5"><span class="text-slate-500">${a}</span><b class="text-right">${b}</b></div>`).join(""))}</section>` : "";
    const tips = clTips(k, s, p);
    const tp = tips.length ? `<section class="${CARD} p-5 mb-4"><h3 class="text-sm font-bold text-slate-800 dark:text-white mb-2"><i class="fa-solid fa-lightbulb text-amber-500 mr-1.5"></i>Para el próximo mes</h3>${tips.map(x => `<p class="text-xs text-slate-600 dark:text-slate-300 py-1.5 leading-relaxed">${x}</p>`).join("")}</section>` : "";
    return nav + hero + cats + bud + dets + tp + `<button onclick="clShare()" class="w-full py-3 rounded-[14px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm">Compartir como texto</button>`;
}

// Fila en Inicio: aparece los primeros 7 días (cierre del mes que pasó) y los últimos 2 del mes (adelanto)
function closeTeaser() {
    const n = new Date(), dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(), d = n.getDate();
    if (!(d <= 7 || d >= dim - 1)) return "";
    const k = d <= 7 ? clPrev(ym(n)) : ym(n), s = clStats(k); if (!s.n) return "";
    return `<button onclick="clSel='${k}';goTab(${N.indexOf("Cierre del mes")})" class="${CARD} w-full flex items-center gap-3 p-4 mb-3 text-left lift">
        <span class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white" style="background:#34C759"><i class="fa-solid fa-flag-checkered"></i></span>
        <span class="min-w-0 flex-1"><b class="block text-sm text-slate-800 dark:text-white">Cierre de ${clName(k).split(" ")[0].toLowerCase()}</b><small class="text-xs text-slate-400">${s.net >= 0 ? "Te quedó " : "Quedaste en "}${fmt(s.net)} · toca para ver cómo te fue</small></span>
        <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i></button>`;
}

// ---------- Foto de recibo ----------
// La foto se guarda SOLO en este dispositivo (IndexedDB) para no llenar los datos; el movimiento lleva la marca rc:1.
let rcPend = null, rcDbP = null;
function rcDb() {
    if (rcDbP) return rcDbP;
    rcDbP = new Promise((ok, no) => {
        try {
            const r = indexedDB.open("miplata_rc", 1);
            r.onupgradeneeded = () => r.result.createObjectStore("f");
            r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
        } catch (e) { no(e); }
    });
    rcDbP.catch(() => { rcDbP = null; });
    return rcDbP;
}
const rcReq = (mode, fn) => rcDb().then(db => new Promise((ok, no) => { const tx = db.transaction("f", mode), r = fn(tx.objectStore("f")); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error); }));
const rcPut = (id, blob) => rcReq("readwrite", s => s.put(blob, String(id)));
const rcGet = id => rcReq("readonly", s => s.get(String(id)));
const rcDel = id => rcReq("readwrite", s => s.delete(String(id)));
// Reduce la foto (lado largo 1100 px, JPEG) para que pese ~100 KB en vez de varios MB
function rcShrink(file) {
    return new Promise((ok, no) => {
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = () => {
            const k = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement("canvas");
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
            c.toBlob(b => b ? ok(b) : no(new Error("blob")), "image/jpeg", .72);
        };
        img.onerror = () => { URL.revokeObjectURL(url); no(new Error("img")); };
        img.src = url;
    });
}
function rcFormUI() {
    return `<div class="flex items-center gap-2"><label class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"><i class="fa-solid fa-paperclip"></i>Foto del recibo<input type="file" accept="image/*" class="hidden" onchange="rcPick(this)"></label><span id="rcPrev" class="text-[11px] text-emerald-600 font-semibold">${rcPend ? "✓ lista" : ""}</span></div>`;
}
function rcPick(el) {
    const f = el.files && el.files[0]; el.value = ""; if (!f) return;
    rcShrink(f).then(b => { rcPend = b; const p = document.getElementById("rcPrev"); if (p) p.textContent = "✓ lista"; }).catch(() => showToast("No se pudo leer esa foto.", true));
}
// Guarda la foto pendiente para un movimiento recién creado
function rcSavePend(id) {
    if (!rcPend) return; const b = rcPend; rcPend = null;
    rcPut(id, b).catch(() => { const x = S.items.find(y => y.id == id); if (x) { delete x.rc; save(); draw(); } showToast("Este navegador no dejó guardar la foto.", true); });
}
function rcAttach(id) {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        rcShrink(f).then(b => rcPut(id, b)).then(() => {
            const x = S.items.find(y => y.id == id); if (x) { x.rc = 1; save(); }
            showToast("Foto guardada"); rcEditRefresh(id); draw();
        }).catch(() => showToast("No se pudo guardar la foto.", true));
    };
    inp.click();
}
function rcRemove(id) {
    const x = S.items.find(y => y.id == id); if (!x) return;
    delete x.rc; save(); rcDel(id).catch(() => {}); rcClose(); rcEditRefresh(id); draw(); showToast("Foto quitada");
}
function rcView(id) {
    rcGet(id).then(b => {
        if (!b) { const x = S.items.find(y => y.id == id); if (x) { delete x.rc; save(); draw(); } return showToast("Esta foto no está en este dispositivo.", true); }
        rcClose();
        const url = URL.createObjectURL(b), o = document.createElement("div");
        o.id = "rcOv"; o.className = "fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-4 mo-in";
        o.dataset.url = url;
        o.innerHTML = `<img src="${url}" alt="Recibo" class="max-w-full max-h-[78vh] rounded-xl object-contain">
            <div class="flex gap-3 mt-4"><button onclick="rcClose()" class="px-5 py-2.5 rounded-xl bg-white text-slate-800 text-sm font-semibold">Cerrar</button>
            <button onclick="rcRemove(${id})" class="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold">Quitar foto</button></div>
            <p class="text-[11px] text-white/60 mt-3">La foto está solo en este dispositivo y no va en la copia de seguridad.</p>`;
        o.onclick = e => { if (e.target === o) rcClose(); };
        document.body.appendChild(o);
    }).catch(() => showToast("No se pudo abrir la foto.", true));
}
function rcClose() { const o = document.getElementById("rcOv"); if (!o) return; try { URL.revokeObjectURL(o.dataset.url); } catch (e) {} o.remove(); }
function rcEditInner(x) {
    const b = "px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300";
    return x.rc ? `<button type="button" onclick="rcView(${x.id})" class="${b}"><i class="fa-solid fa-paperclip mr-1.5"></i>Ver foto</button><button type="button" onclick="rcAttach(${x.id})" class="${b}">Cambiar</button>`
        : `<button type="button" onclick="rcAttach(${x.id})" class="${b}"><i class="fa-solid fa-paperclip mr-1.5"></i>Adjuntar foto del recibo</button>`;
}
function rcEditBlock(id) {
    const f = document.getElementById("customForm"), x = S.items.find(y => y.id == id); if (!f || !x) return;
    const sb = f.querySelector("button[type=submit]"); if (!sb || !sb.parentElement) return;
    sb.parentElement.insertAdjacentHTML("beforebegin", `<div id="rcEdit" class="flex flex-wrap gap-2 items-center">${rcEditInner(x)}</div>`);
}
function rcEditRefresh(id) { const e = document.getElementById("rcEdit"), x = S.items.find(y => y.id == id); if (e && x) e.innerHTML = rcEditInner(x); }
// Borra las fotos de movimientos que ya no existen (al abrir la app; así "Deshacer" sigue funcionando)
function rcClean() {
    if (!window.indexedDB || !S.items.some(x => x.rc)) return;
    rcDb().then(db => { const ks = db.transaction("f").objectStore("f").getAllKeys(); ks.onsuccess = () => ks.result.forEach(k => { if (!S.items.some(x => String(x.id) == k && x.rc)) rcDel(k).catch(() => {}); }); }).catch(() => {});
}
setTimeout(rcClean, 5000);

// ---------- Calculadora oculta ----------
// Se abre manteniendo presionado el botón + (o con Shift + clic en computador).
let cxE = "", cxI = "";
function cxEval(s) {
    s = s.replace(/[+\-*/]+$/, ""); if (!s) return null;
    const tk = s.match(/(\d+\.?\d*|\.\d+)%?|[+\-*/]/g) || [];
    let sum = 0, i = 0, first = true;
    while (i < tk.length) {
        let sg = 1;
        if (tk[i] == "+" || tk[i] == "-") { sg = tk[i] == "-" ? -1 : 1; i++; }
        else if (!first) return null;
        const fs = []; let ops = [];
        if (i >= tk.length || /^[+\-*/]$/.test(tk[i])) return null;
        fs.push(tk[i++]);
        while (i < tk.length && (tk[i] == "*" || tk[i] == "/")) { ops.push(tk[i++]); if (i >= tk.length || /^[+\-*/]$/.test(tk[i])) return null; fs.push(tk[i++]); }
        let v;
        if (fs.length == 1 && fs[0].endsWith("%") && !first) v = sum * parseFloat(fs[0]) / 100;
        else { v = null; fs.forEach((f, j) => { const n = f.endsWith("%") ? parseFloat(f) / 100 : parseFloat(f); if (j == 0) v = n; else if (ops[j - 1] == "*") v *= n; else { if (n == 0) { v = NaN; } else v /= n; } }); }
        if (!isFinite(v)) return null;
        sum += sg * v; first = false;
    }
    return Math.round(sum * 1e8) / 1e8;
}
const cxNum = n => n.toLocaleString("es-CO", { maximumFractionDigits: 2 });
function cxShow(s) { return s.replace(/(\d+)(\.(\d*))?/g, (m, a, b, c) => Number(a).toLocaleString("es-CO") + (b ? "," + c : "")).replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−") || "0"; }
function cxPaint() {
    const d = document.getElementById("cxEx"), r = document.getElementById("cxRes"), f = document.getElementById("cxInfo");
    if (!d) return;
    const v = cxEval(cxE);
    d.textContent = cxShow(cxE); r.textContent = v === null ? (cxE ? "—" : "0") : cxNum(v); f.innerHTML = cxI;
}
function cxKey(k) {
    buzz && buzz();
    const last = cxE.slice(-1), isOp = c => "+-*/".includes(c);
    if (k == "C") { cxE = ""; cxI = ""; }
    else if (k == "B") cxE = cxE.slice(0, -1);
    else if (k == "=") { const v = cxEval(cxE); if (v !== null) cxE = String(v); cxI = ""; }
    else if ("+-*/".includes(k)) { if (!cxE) { if (k == "-") cxE = "-"; } else if (isOp(last)) cxE = cxE.slice(0, -1) + k; else cxE += k; }
    else if (k == "%") { if (/[\d.]$/.test(cxE)) cxE += "%"; }
    else if (k == ".") { const n = cxE.split(/[+\-*/]/).pop(); if (!n.includes(".") && !n.endsWith("%")) cxE += n === "" ? "0." : "."; }
    else if (/\d/.test(k)) { const n = cxE.split(/[+\-*/]/).pop(); if (n.endsWith("%") || n.length > 14) return; cxE += k; }
    if (k != "=" && "+-*/CB".includes(k)) cxI = "";
    cxPaint();
}
function cxTool(k) {
    const v = cxEval(cxE); if (v === null || !(v > 0)) { cxI = '<span class="text-amber-500">Escribe primero un valor.</span>'; return cxPaint(); }
    const L = (a, b) => `<div class="flex justify-between gap-3"><span>${a}</span><b>${b}</b></div>`;
    if (k == "gmf") cxI = L("4x1000 sobre " + fmt(v), fmt(v * 0.004)) + L("Total con el cobro", fmt(v * 1.004)) + L("Te llega si te lo descuentan", fmt(v * 0.996));
    else if (k == "iva") cxI = L("Si ya incluye IVA: base", fmt(v / 1.19)) + L("IVA incluido (19%)", fmt(v - v / 1.19)) + L("Si se le suma IVA: total", fmt(v * 1.19));
    else if (k == "usd") cxI = L(fu(v) + " a TRM " + fmtD(S.trm), fmt(v * S.trm));
    else if (k == "cop") cxI = L(fmt(v) + " a TRM " + fmtD(S.trm), fu(v / S.trm));
    cxPaint();
}
function cxUse() {
    const v = cxEval(cxE); if (v === null || !(v > 0)) return showToast("Escribe primero un valor.", true);
    closeModal();
    setTimeout(() => { type = "g"; openMov(); setTimeout(() => { const a = document.getElementById("amt"); if (a) { a.value = String(Math.round(v)); amtIn(a); } }, 80); }, 330);
}
function calcOpen() {
    const kb = (k, l, cl) => `<button type="button" onclick="cxKey('${k}')" class="h-12 rounded-2xl text-lg font-semibold ${cl || "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"}">${l}</button>`;
    const op = "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300", ch = "shrink-0 px-3.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300";
    showModal(`
        <div class="flex justify-between items-center mb-2"><h3 class="text-base font-bold text-slate-800 dark:text-white">Calculadora</h3>
            <button onclick="closeModal()" aria-label="Cerrar" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="text-right px-1 pb-2"><div id="cxEx" class="text-sm text-slate-400 min-h-[20px] break-all"></div><div id="cxRes" class="text-4xl font-extrabold text-slate-800 dark:text-white break-all">0</div></div>
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            <button onclick="cxTool('gmf')" class="${ch}">4x1000</button><button onclick="cxTool('iva')" class="${ch}">IVA 19%</button><button onclick="cxTool('usd')" class="${ch}">USD → COP</button><button onclick="cxTool('cop')" class="${ch}">COP → USD</button></div>
        <div id="cxInfo" class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 min-h-[16px] mb-2"></div>
        <div class="grid grid-cols-4 gap-2">
            ${kb("C", "C", op)}${kb("B", "⌫", op)}${kb("%", "%", op)}${kb("/", "÷", op)}
            ${kb("7", "7")}${kb("8", "8")}${kb("9", "9")}${kb("*", "×", op)}
            ${kb("4", "4")}${kb("5", "5")}${kb("6", "6")}${kb("-", "−", op)}
            ${kb("1", "1")}${kb("2", "2")}${kb("3", "3")}${kb("+", "+", op)}
            ${kb("0", "0")}${kb(".", ",")}${kb("=", "=", "col-span-2 bg-indigo-600 text-white")}
        </div>
        <button onclick="cxUse()" class="w-full mt-3 py-3 rounded-[14px] bg-emerald-600 text-white font-semibold text-sm">Usar como monto de un gasto</button>`);
    cxE = ""; cxI = ""; cxPaint();
}
(function () {
    const fab = document.getElementById("fab"); if (!fab) return;
    let tm = null, fired = false;
    const stop = () => { clearTimeout(tm); tm = null; };
    fab.addEventListener("pointerdown", () => { fired = false; stop(); tm = setTimeout(() => { fired = true; try { buzz(); } catch (e) {} calcOpen(); }, 600); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(e => fab.addEventListener(e, stop));
    fab.addEventListener("contextmenu", e => e.preventDefault());
    fab.addEventListener("click", e => {
        if (fired) { fired = false; e.stopImmediatePropagation(); e.preventDefault(); }
        else if (e.shiftKey) { e.stopImmediatePropagation(); e.preventDefault(); calcOpen(); }
    }, true);
})();

// ---------- Registro de la pantalla nueva ----------
N.push("Cierre del mes"); V.push(vClose);
MORE.splice(MORE.indexOf(N.indexOf("Resumen")) + 1, 0, N.length - 1);
MORE_IC["Cierre del mes"] = ["fa-flag-checkered", "#34C759"];
