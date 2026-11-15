// ===== Mi Plata · rendimientos.js =====
// Gráficas de rendimiento (SVG, sin librerías) para: widget de Inicio, pestaña Inversión y Cuentas con rendimientos.
// Solo LEE los datos existentes (S.inv, S.invh, S.wal, S.items, S.ini): no cambia ningún cálculo ni el esquema, salvo dos campos
// opcionales por cuenta: a.ry (tasa E.A. %) y a.rs (fecha desde la que rinde). Una cuenta sin a.ry funciona exactamente igual que antes.

// ---------- Utilidades ----------
const yAddDays = (k, n) => { const t = new Date(k + "T00:00:00"); t.setDate(t.getDate() + n); return ymd(t); };
const yPct = n => (Math.round(n * 100) / 100).toLocaleString("es-CO", { maximumFractionDigits: 2 });
const ySigned = n => (n >= 0.5 ? "+" : n <= -0.5 ? "-" : "") + fmt(Math.abs(n));
const yDM = k => { const t = new Date(k + "T00:00:00"); return t.toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", ""); };
// Reduce una serie a como mucho n puntos (siempre conserva el primero y el último)
function yThin(p, n) {
    if (p.length <= n) return p;
    const out = [], st = (p.length - 1) / (n - 1);
    for (let i = 0; i < n; i++) out.push(p[Math.round(i * st)]);
    return out;
}

// ---------- Dibujo ----------
// pts = [{ d: "AAAA-MM-DD", v: número }]. Devuelve el SVG + el punto final (HTML, para que siga redondo aunque el SVG se estire).
// opts: w/h del viewBox, id (para el toque que muestra el valor), est (línea punteada = estimación), fmt (formato del valor)
const YC = {}; // datos de cada gráfica con toque: id → { pts, fmt }
let ycUid = 0;
function yChart(pts, o) {
    o = o || {};
    const W = 100, H = o.h || 32, pad = o.pad == null ? 3 : o.pad, id = o.id ? o.id + "-" + (++ycUid) : "";
    if (!pts || !pts.length) pts = [{ d: today(), v: 0 }];
    if (pts.length == 1) pts = [{ d: pts[0].d, v: pts[0].v }, { d: pts[0].d, v: pts[0].v }];
    const vs = pts.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo;
    const X = i => i / (pts.length - 1) * W;
    const Y = v => span < 1e-9 ? H / 2 : pad + (1 - (v - lo) / span) * (H - pad * 2);
    // Curva suave (Catmull-Rom → Bézier), sin pasarse de los valores reales
    const P = pts.map((p, i) => [X(i), Y(p.v)]);
    let d = "M" + P[0][0].toFixed(2) + " " + P[0][1].toFixed(2);
    for (let i = 0; i < P.length - 1; i++) {
        const a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c, k = 0.18;
        const clamp = y => Math.min(Math.max(y, Math.min(b[1], c[1])), Math.max(b[1], c[1]));
        d += " C" + (b[0] + (c[0] - a[0]) * k).toFixed(2) + " " + clamp(b[1] + (c[1] - a[1]) * k).toFixed(2) + " " + (c[0] - (e[0] - b[0]) * k).toFixed(2) + " " + clamp(c[1] - (e[1] - b[1]) * k).toFixed(2) + " " + c[0].toFixed(2) + " " + c[1].toFixed(2);
    }
    const last = P[P.length - 1], gid = "ycg" + (++ycUid);
    // La línea del cero (si la serie cruza el cero) ayuda a ver ganancia vs pérdida
    const zero = lo < 0 && hi > 0 ? `<line x1="0" x2="${W}" y1="${Y(0).toFixed(2)}" y2="${Y(0).toFixed(2)}" class="yc-zero"/>` : "";
    if (id) YC[id] = { pts, fmt: o.fmt || fmt, lo, hi, H, pad };
    return `<span class="yc ${o.cls || ""}${o.est ? " est" : ""}" ${id ? `data-yc="${id}"` : ""} ${o.label ? `role="img" aria-label="${esc(o.label)}"` : 'aria-hidden="true"'}>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
            <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".38"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
            ${zero}
            <path d="${d} L${W} ${H} L0 ${H} Z" fill="url(#${gid})" stroke="none"/>
            <path d="${d}" class="yc-line" fill="none" stroke="currentColor" stroke-width="${o.sw || 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <i class="yc-dot" style="top:${(last[1] / H * 100).toFixed(1)}%"></i>
        ${id ? '<i class="yc-cur"></i><b class="yc-tip"></b>' : ""}
    </span>`;
}
// Tocar o deslizar el dedo sobre una gráfica grande muestra el valor de ese día (un solo oyente para todas)
(function () {
    const upd = (el, ev) => {
        const m = YC[el.dataset.yc]; if (!m) return;
        const r = el.getBoundingClientRect(); if (!r.width) return;
        const t = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), i = Math.round(t * (m.pts.length - 1)), p = m.pts[i];
        const y = m.hi - m.lo < 1e-9 ? m.H / 2 : m.pad + (1 - (p.v - m.lo) / (m.hi - m.lo)) * (m.H - m.pad * 2);
        const cur = el.querySelector(".yc-cur"), tip = el.querySelector(".yc-tip"), x = i / (m.pts.length - 1) * 100;
        el.classList.add("touch");
        cur.style.left = x + "%"; cur.style.top = (y / m.H * 100) + "%";
        tip.textContent = yDM(p.d) + " · " + m.fmt(p.v);
        tip.style.left = Math.min(Math.max(x, 22), 78) + "%";
    };
    const off = () => document.querySelectorAll(".yc.touch").forEach(el => el.classList.remove("touch"));
    const at = e => e.target.closest && e.target.closest(".yc[data-yc]");
    document.addEventListener("pointerdown", e => { const el = at(e); if (el) upd(el, e); });
    document.addEventListener("pointermove", e => { const el = at(e); if (el) upd(el, e); else off(); });
    document.addEventListener("pointerup", off);
    document.addEventListener("pointercancel", off);
})();

// ---------- Inversiones ----------
// Ganancia del portafolio (valor − invertido) día a día. Se usa la ganancia y no el valor porque no salta cuando agregas una compra.
// Sale de las fotos diarias (S.invh, ver invSnap en nuevas.js). Sin fotos suficientes se dibuja la línea desde la primera compra hasta hoy.
const INV_RNG = [["1M", 30], ["3M", 90], ["6M", 180], ["1A", 365], ["Todo", 0]];
let invRng = "3M";
function invGainSeries(days) {
    const P = invPortfolio(), td = today(), g = P.T - P.C;
    const snaps = Object.keys(S.invh || {}).sort().filter(k => S.invh[k] && S.invh[k].length >= 2 && k < td);
    let pts = snaps.map(k => ({ d: k, v: S.invh[k][0] - S.invh[k][1] }));
    pts.push({ d: td, v: g });
    if (days) { const from = yAddDays(td, -days), keep = pts.filter(p => p.d >= from); pts = keep.length >= 2 ? keep : pts.slice(-2); }
    let est = false;
    if (pts.length < 2 || (pts.length == 2 && pts[0].d == pts[1].d)) {
        const first = S.inv.map(x => x.d).sort()[0] || td;
        pts = [{ d: first < td ? first : yAddDays(td, -1), v: 0 }, { d: td, v: g }]; est = true;
    }
    return { pts, est, gain: g, cost: P.C, total: P.T, pct: P.C > 0 ? g / P.C : 0, ann: P.ann };
}
// Widget de Inicio (sustituye a "Dólar hoy")
function invWidgetUI() {
    const has = S.inv.length > 0, R = invGainSeries(90), neg = R.gain < -0.5;
    const sub = !has ? "Agrega tu primera inversión" : R.cost > 0 ? `${pct1(R.pct)} sobre lo invertido` : "";
    return `
        <button onclick="goTab(N.indexOf('Inversión'))" class="wd wd-yield wd-inv${neg ? " neg" : ""}${has ? "" : " empty"}">
            <span class="wd-l">Inversiones rinden</span>
            <span class="wd-ch" aria-hidden="true">${yChart(has ? R.pts : [{ d: "a", v: 0 }, { d: "b", v: 0 }], { est: !has || R.est })}</span>
            <b class="wd-v">${has ? ySigned(R.gain) : "—"}</b>
            <span class="wd-s">${sub}</span>
        </button>`;
}
// Tarjeta grande de la pestaña Inversión
function invYieldUI() {
    if (!S.inv.length) return "";
    const dd = (INV_RNG.find(r => r[0] == invRng) || INV_RNG[1])[1], R = invGainSeries(dd), a = R.pts[0], b = R.pts[R.pts.length - 1], dg = b.v - a.v;
    const chips = INV_RNG.map(([k]) => `<button onclick="setInvRng('${k}')" class="yr-chip${k == invRng ? " on" : ""}" aria-pressed="${k == invRng}">${k}</button>`).join("");
    return `
        <section class="${CARD} p-5 mb-6 yr-card${R.gain < -0.5 ? " neg" : ""}">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <small class="yr-k">Rendimiento del portafolio</small>
                    <div class="yr-v">${ySigned(R.gain)}</div>
                    <div class="yr-s ${R.gain >= 0 ? "up" : "dn"}">${R.cost > 0 ? pct1(R.pct) + " sobre lo invertido" : "—"}${R.ann !== null ? " · ≈ " + pct1(R.ann) + " anual" : ""}</div>
                </div>
            </div>
            <div class="yr-chart">${yChart(R.pts, { id: "inv", h: 40, cls: "big", sw: 2.4, label: "Gráfica de la ganancia del portafolio" })}</div>
            <div class="yr-axis"><span>${yDM(a.d)}</span><span>${R.est ? "estimado" : (dg >= 0 ? "+" : "-") + fmt(Math.abs(dg)) + " en el periodo"}</span><span>Hoy</span></div>
            <div class="yr-chips" role="group" aria-label="Periodo">${chips}</div>
            ${R.est ? `<p class="yr-note">Aún hay pocos días guardados: la línea va de $0 a tu ganancia de hoy. La app guarda una foto del portafolio cada día que la abres y la gráfica se va afinando sola.</p>` : ""}
        </section>`;
}
function setInvRng(k) { invRng = k; draw(); }

// ---------- Cuentas con rendimientos ----------
// a.ry = tasa E.A. (%) · a.rs = fecha desde la que rinde. Es una ESTIMACIÓN informativa: no se suma al saldo (para no contarla dos veces cuando
// ajustas el saldo con lo que muestra tu banco). El interés es compuesto diario sobre el saldo de cada día más lo ya ganado.
const walRate = a => (+a.ry > 0 ? +a.ry : 0);
function walBalAt(a, k) {
    let s = S.ini[a.n] || 0;
    for (const x of S.items) {
        if (x.d > k) continue;
        if (x.t == "tr" && x.to == a.n) s += x.a;
        if (x.w == a.n) { if (x.t == "i") s += x.a; else if (!x.k) s -= x.a; }
    }
    for (const x of S.sv) if (x.w == a.n && !x.i && x.d <= k) s -= (x.cp ?? x.v);
    return s;
}
const _wyC = {};
function walYield(a) {
    const r = walRate(a); if (!r) return null;
    const td = today(), st = a.rs && a.rs <= td ? a.rs : td, key = a.id + "|" + r + "|" + st + "|" + td + "|" + S.items.length + "|" + (S.ini[a.n] || 0) + "|" + S.sv.length;
    if (_wyC[key]) return _wyC[key];
    const dr = Math.pow(1 + r / 100, 1 / 365) - 1, delta = {};
    const add = (d, v) => { if (d > st && d <= td) delta[d] = (delta[d] || 0) + v; };
    for (const x of S.items) {
        if (x.t == "tr" && x.to == a.n) add(x.d, x.a);
        if (x.w == a.n) { if (x.t == "i") add(x.d, x.a); else if (!x.k) add(x.d, -x.a); }
    }
    for (const x of S.sv) if (x.w == a.n && !x.i) add(x.d, -(x.cp ?? x.v));
    let cur = Math.max(0, walBalAt(a, st)), earned = 0, day = st, atPrev = 0; // atPrev = lo ganado al cierre del mes pasado
    const m0 = td.slice(0, 8) + "01", prevEnd = yAddDays(m0, -1), pts = [{ d: st, v: 0 }];
    for (let i = 0; i < 4000 && day < td; i++) {
        day = yAddDays(day, 1);
        earned += (cur + earned) * dr; cur = Math.max(0, cur + (delta[day] || 0));
        pts.push({ d: day, v: earned });
        if (day == prevEnd) atPrev = earned;
    }
    const bal = Math.max(0, walBalAt(a, td)), base = bal + earned;
    const out = {
        rate: r, pts, total: earned, start: st, bal,
        month: earned - atPrev,
        daily: base * dr, monthly: base * (Math.pow(1 + r / 100, 1 / 12) - 1), year: base * (r / 100)
    };
    for (const k in _wyC) delete _wyC[k]; _wyC[key] = out; // solo guarda la última cuenta calculada: basta para un dibujo
    return out;
}
// Si todavía no hay historia (empezó hoy), se muestra una proyección a 30 días con la tasa actual
function walYieldPts(y) {
    if (y.pts.length >= 2) return { pts: y.pts, est: false };
    const dr = Math.pow(1 + y.rate / 100, 1 / 365) - 1, pts = [{ d: y.start, v: 0 }]; let e = 0;
    for (let i = 1; i <= 30; i++) { e += (y.bal + e) * dr; pts.push({ d: yAddDays(y.start, i), v: e }); }
    return { pts, est: true };
}
function walYieldPanelUI(a) {
    const y = walYield(a);
    if (!y) {
        return `<div class="yr-off"><div><b>Rendimientos</b><small>Si esta cuenta te paga intereses (Nu, Lulo, un CDT, una fiducia…), actívalos y verás cuánto ganas.</small></div>
            <button onclick="walRend(${a.id})" class="yr-btn">Activar</button></div>`;
    }
    const w = walYieldPts(y), a0 = w.pts[0], a1 = w.pts[w.pts.length - 1];
    const stat = (l, v, c) => `<div class="${c || ""}"><span class="sv-lbl">${l}</span><b>${v}</b></div>`;
    return `
        <div class="yr-acc">
            <div class="flex items-center justify-between gap-2 mb-1">
                <h4 class="sv-lbl !mb-0"><i class="fa-solid fa-arrow-trend-up mr-1.5"></i>Rendimientos · ${yPct(y.rate)}% E.A.</h4>
                <button onclick="walRend(${a.id})" class="yr-link">Editar</button>
            </div>
            <div class="yr-chart sm">${yChart(w.pts, { id: "w" + a.id, h: 36, cls: "big", est: w.est, fmt: n => "+" + fmt(n), label: "Gráfica de rendimientos de la cuenta" })}</div>
            <div class="yr-axis"><span>${yDM(a0.d)}</span><span>${w.est ? "proyección a 30 días" : "ganado en total"}</span><span>${w.est ? yDM(a1.d) : "Hoy"}</span></div>
            <div class="sv-stats mt-3">
                ${stat("Hoy", "+" + fmt(y.daily), "up")}${stat("Este mes", "+" + fmt(y.month), "up")}${stat(y.total >= 0.5 ? "Ganado" : "Al mes", "+" + fmt(y.total >= 0.5 ? y.total : y.monthly), "up")}
            </div>
            <p class="text-[11px] text-slate-400 mt-2">Estimado con la tasa y el saldo diario desde ${dmy(y.start)}${y.pts.length < 2 ? " (la cuenta empezó a rendir hoy)" : ""}. No se suma al saldo: si tu banco ya lo suma, usa «Ajustar saldo».</p>
        </div>`;
}
// Resumen de todas las cuentas que rinden (aparece arriba de la lista en Cuentas)
function walYieldAllUI() {
    const L = S.wal.filter(a => walRate(a) > 0 && !(S.hide || {})[a.n]).map(a => ({ a, y: walYield(a) })).filter(x => x.y);
    if (!L.length) return "";
    const td = today(), first = L.map(x => x.y.start).sort()[0], days = Math.min(400, dayDiff(first, td));
    let pts = [];
    for (let i = 0; i <= days; i++) {
        const d = yAddDays(first, i);
        pts.push({ d, v: L.reduce((s, { y }) => { const p = y.pts.find(q => q.d == d); return s + (p ? p.v : d > y.start ? y.pts[y.pts.length - 1].v : 0); }, 0) });
    }
    pts = yThin(pts, 60);
    let est = false;
    if (pts.length < 2 || days < 1) {
        const dr = L.reduce((s, x) => s + x.y.daily, 0); est = true; pts = [];
        for (let i = 0; i <= 30; i++) pts.push({ d: yAddDays(td, i), v: dr * i });
    }
    const T = L.reduce((s, x) => s + x.y.total, 0), D = L.reduce((s, x) => s + x.y.daily, 0), M = L.reduce((s, x) => s + x.y.monthly, 0);
    return `
        <section class="${CARD} p-5 yr-card">
            <small class="yr-k">Rendimiento de tus cuentas</small>
            <div class="yr-v">${T >= 0.5 ? "+" + fmt(T) : "+" + fmt(D) + " hoy"}</div>
            <div class="yr-s up">${T >= 0.5 ? "+" + fmt(D) + " hoy · " : ""}≈ +${fmt(M)} al mes · ${L.length} ${L.length == 1 ? "cuenta" : "cuentas"}</div>
            <div class="yr-chart">${yChart(pts, { id: "wall", h: 40, cls: "big", est, fmt: n => "+" + fmt(n), label: "Gráfica de rendimientos de tus cuentas" })}</div>
            <div class="yr-axis"><span>${yDM(pts[0].d)}</span><span>${est ? "proyección a 30 días" : "ganado en total"}</span><span>${est ? yDM(pts[pts.length - 1].d) : "Hoy"}</span></div>
        </section>`;
}
// Activar / editar / quitar los rendimientos de una cuenta
function walRend(id) {
    const a = S.wal.find(x => x.id == id); if (!a) return;
    openCustomModal("Rendimientos de " + esc(a.n), walRendFields(a), v => { const e = walRendApply(a, v); if (e) return e; save(); });
}
function walRendFields(a) {
    return [
        { l: "¿Esta cuenta tiene rendimientos?", o: ["No", "Sí"], v: walRate(a) ? "Sí" : "No" },
        { l: "Tasa efectiva anual (%)", m: "decimal", p: "Ej. 9,5", v: walRate(a) ? tf(a.ry) : "", dep: [0, "Sí"] },
        { l: "Rinde desde", t: "date", v: a.rs || today(), dep: [0, "Sí"] }
    ];
}
// Devuelve un texto si algo está mal (el modal lo muestra); si no, guarda en la cuenta.
function walRendApply(a, v, off) {
    const o = off || 0;
    if (v[o] != "Sí") { delete a.ry; delete a.rs; return; }
    const r = pr(v[o + 1]);
    if (!(r > 0) || r > 200) return "Escribe la tasa efectiva anual, por ejemplo 9,5.";
    if (v[o + 2] > today()) return "La fecha no puede ser futura.";
    a.ry = Math.round(r * 100) / 100; a.rs = v[o + 2] || today();
}
