// ===== Mi Plata · logica.js =====
// Datos, utilidades y cálculos. No toca la pantalla (eso está en vistas.js y acciones.js).

const G0 = [["Vivienda","n"],["Comida","n"],["Transporte","n"],["Servicios","n"],["Deudas/Tarjeta","n"],["Ocio","g"],["Compras","g"],["Otros","g"],["Ahorro","a"]];
const G = G0.slice(); // lista viva: base + categorías propias (se rearma con syncG)
const I = ["Sueldo","Extra","Otro ingreso"];
const WH = ["Efectivo","Cuenta de ahorros","Billetera digital (Nequi, Daviplata)"];
const KEY = "miplata_advanced_v2"; // misma clave: tus datos actuales siguen funcionando

// ---------- Utilidades ----------
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// Modo incógnito: con S.th.mask activo, todas las cifras en pesos y dólares salen ocultas
const masked = () => !!(S.th && S.th.mask);
const fmt = n => masked() ? "$ ••••" : (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n || 0)).toLocaleString("es-CO");
const fu = n => masked() ? "US$ ••••" : "US$" + (n || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });
const ym = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const ymd = d => ym(d) + "-" + String(d.getDate()).padStart(2, "0");
const today = () => ymd(new Date());
const num = s => Number(String(s || "").replace(/\D/g, ""));
const tf = n => String(n).replace(".", ",");
const pr = s => parseFloat(String(s || "").replace(/\./g, "").replace(",", ".")) || 0;
const dmy = d => d ? d.slice(8) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "";
const midnight = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const daysBetween = (a, b) => Math.round((b - a) / 864e5);

const INP = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white";
const CARD = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm";

// ---------- Estado ----------
let S = {};
try {
    const j = JSON.parse(localStorage.getItem(KEY) || "{}");
    S = Array.isArray(j) ? { items: j } : j;
} catch (e) { S = {}; }

S.items = S.items || [];
S.acc = S.acc || [];
S.inv = S.inv || [];
S.cards = S.cards || [];
S.trm = S.trm || 4000;
S.sv = S.sv || [];
S.rec = S.rec || [];
S.dbt = S.dbt || [];
S.bud = S.bud || {};
S.budm = S.budm || {}; // presupuesto de un mes puntual (reemplaza al fijo solo ese mes): { "2026-09": { Comida: 600000 } }
S.budr = S.budr || {}; // categorías que acumulan lo que sobra, con el mes desde el que rige: { Comida: "2026-09" }
S.th = S.th || { m: "auto", p: 0, pv: false };
S.hide = S.hide || {};
S.ini = S.ini || {};
S.nwh = S.nwh || {};   // historial del patrimonio neto (una foto por mes)
S.nt = S.nt || {};     // avisos ya mostrados (para no repetir el mismo día)
S.rb = S.rb || { v: 50, f: 30, e: 20 }; // objetivo del portafolio en %: renta variable, renta fija, efectivo
S.dp = S.dp || {};     // plan de deudas: { b: lo que puedes pagar al mes }
S.cat = S.cat || [];   // categorías propias: { id, n: nombre, k: "n" necesidad | "g" gusto }
// "Ahorro" siempre queda de última
const syncG = () => { G.length = 0; G0.slice(0, -1).forEach(x => G.push(x)); S.cat.forEach(c => G.push([c.n, c.k])); G.push(G0[G0.length - 1]); };
syncG();
S.items.forEach(x => { if (x.t == "g") { if (WH.includes(x.k)) { x.w = x.k; x.k = ""; } else if (!x.k && !x.w) x.w = WH[0]; } });
// Inversiones antiguas no tenían fecha: se usa el momento en que se crearon
S.inv.forEach(x => { if (!x.d) { const d = new Date(x.id); x.d = isNaN(d) ? today() : ymd(d); } });

// ---------- Estado de pantalla ----------
let tab = 0;
let type = "g";
let cur = new Date(); cur.setDate(1);
let usd = !!S.th.u;
let sqry = "";          // texto del buscador
let sall = false;       // buscar en todos los meses
let cmp = 1;            // meses hacia atrás para comparar en Gráficas
let flt = { k: "all", v: null };
let anim = true;
let charts = [];
const lastPct = {}, lastOk = {};

const save = () => {
    try { S.nwh[ym(new Date())] = Math.round(netWorth().tot); } catch (e) {}
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    try { mirrorEvents(); } catch (e) {}
};
const cop = (v, c) => c == "USD" ? v * S.trm : v;
const show = c => usd ? fu(c / S.trm) : fmt(c);
const fm = (a, v) => a.u ? fu(v) : fmt(v);

// ---------- Ahorro y saldos ----------
const svm = () => S.sv.filter(x => x.d.startsWith(ym(cur)) && !x.i).reduce((s, x) => s + (x.cp ?? x.v), 0);
const upto = (x, k) => !k || x.d.slice(0, 7) <= k;
const svb = (id, k) => S.sv.filter(x => x.a == id && upto(x, k)).reduce((s, x) => s + x.v, 0);
const bal = (w, k) => (S.ini[w] || 0)
    + S.items.filter(x => x.t == "tr" && x.to == w && upto(x, k)).reduce((s, x) => s + x.a, 0)
    + S.items.filter(x => upto(x, k)).reduce((s, x) => x.w != w ? s : x.t == "i" ? s + x.a : x.k ? s : s - x.a, 0)
    - S.sv.filter(x => x.w == w && !x.i && upto(x, k)).reduce((s, x) => s + (x.cp ?? x.v), 0);
const sum = (m, f) => m.filter(f).reduce((s, x) => s + x.a, 0);
const vis = x => x.t != "g" || !(S.hide || {})[x.k || x.w || ""];
const monAll = () => S.items.filter(x => x.d.startsWith(ym(cur)));
const mon = () => monAll().filter(vis);
const yieldOf = (id, r) => {
    const now = Date.now();
    return S.sv.filter(x => x.a == id).reduce((s, x) => {
        const dd = Math.max(0, Math.floor((now - new Date(x.d + "T00:00:00")) / 864e5));
        return s + x.v * (Math.pow(1 + r / 100, dd / 365) - 1);
    }, 0);
};
const goalTotal = a => svb(a.id) + Math.max(0, yieldOf(a.id, a.r));

// ---------- Tarjetas: cuotas con interés ----------
// Mes en que se paga la PRIMERA cuota de una compra (año*12 + mes), según el corte y el día de pago de su tarjeta:
//  - comprar después del día de corte la manda al extracto siguiente (+1 mes)
//  - si el día de pago es igual o menor al de corte, el pago cae el mes después del cierre (+1 mes)
// Ej. corte 28 y pago 18: lo comprado del 1 al 28 de septiembre cierra el 28 y se paga el 18 de octubre.
const firstPay = x => {
    const c = S.cards.find(c => c.n == x.k);
    let m = +x.d.slice(0, 4) * 12 + +x.d.slice(5, 7);
    if (c && c.k && c.p) { if (+x.d.slice(8, 10) > c.k) m++; if (c.p <= c.k) m++; }
    return m;
};
// Cuota número N que cae en el mes nm (1 = primera cuota; 0 o menos = compra aún sin facturar)
const me = (x, nm) => (+nm.slice(0, 4) * 12 + +nm.slice(5)) - firstPay(x) + 1;
// Tasa mensual con la que se hizo esa compra (guardada al comprar). Sin tasa guardada = sin interés.
const rate = x => (x.k && x.q > 1 && !x.ni ? (x.ir || 0) : 0) / 100;
// Cuota fija (sistema francés). Con tasa 0 es dividir en partes iguales.
const pmt = (P, q, i) => i > 0 ? P * i / (1 - Math.pow(1 + i, -q)) : P / q;
const cm = (x, nm) => { const q = x.q > 1 ? x.q : 1, e = me(x, nm); return e >= 1 && e <= q ? pmt(x.a, q, rate(x)) : 0; };
// Capital que aún debes al empezar ese mes (lo que ocupa cupo)
const pend = (x, nm) => {
    const q = x.q > 1 ? x.q : 1, e = me(x, nm);
    if (e < 1) return x.d.slice(0, 7) <= nm ? x.a : 0; // ya comprada pero sin facturar: ya ocupa cupo completo
    if (e > q) return 0;
    const i = rate(x), C = pmt(x.a, q, i);
    return i > 0 ? x.a * Math.pow(1 + i, e - 1) - C * (Math.pow(1 + i, e - 1) - 1) / i : x.a - C * (e - 1);
};
// Parte de la cuota de ese mes que son intereses
const intOf = (x, nm) => { const i = rate(x); return i > 0 && me(x, nm) >= 1 ? i * pend(x, nm) : 0; };
const cardInt = (c, nm) => S.items.filter(x => x.k == c.n).reduce((t, x) => t + intOf(x, nm), 0);
const cardPaid = (c, nm) => S.items.filter(x => x.t == "p" && x.pc == c.n && x.d.startsWith(nm)).reduce((s, x) => s + x.a, 0);
const mIdx = m => +m.slice(0, 4) * 12 + +m.slice(5);
const idxYm = i => Math.floor((i - 1) / 12) + "-" + String((i - 1) % 12 + 1).padStart(2, "0");
// Cuota de manejo que cae en el extracto que se paga en el mes i (año*12+mes).
//  Mensual: todos los meses desde que se registró. Anual: solo en el mes elegido.
const feeAt = (c, i) => {
    if (!(c.mf > 0) || !c.mfs || i < mIdx(c.mfs)) return 0;
    return c.mt == "a" ? (((i - 1) % 12 + 1) == c.mm ? c.mf : 0) : c.mf;
};
const dayDiff = (a, b) => Math.max(0, daysBetween(new Date(a + "T00:00:00"), new Date(b + "T00:00:00")));
// Cómo se aplican los pagos a una tarjeta:
//  1) Lo que pagas en un mes va primero a lo que toca pagar ese mes (cuota + cuota de manejo + mora, si hay).
//  2) Lo que sobra adelanta la cuota del mes siguiente (así, si pagas por adelantado, esa cuota queda en $0).
//  3) Si todavía sobra, es un abono a capital: baja lo que debes y libera cupo, pero NO te quita cuotas
//     futuras; acorta el plazo (se cancelan las últimas cuotas).
// Mora: si pagas después del día de pago (o no pagas), se calcula un interés diario sobre lo que quedó sin pagar,
// con la tasa de mora de la tarjeta. Es un estimado (el banco puede cobrarlo distinto).
// Lo que no pagaste de un mes (cuota + manejo, y su mora) NO se olvida: pasa al mes siguiente como "vencido" (atr) y sigue generando mora.
//    Un pago va primero a lo vencido, luego a la cuota del mes y luego a la mora.
// Devuelve: cuota del mes ya ajustada por abonos a capital (cuota), vencido de meses anteriores (atr), cuota de manejo (fee), mora total (mora), fee+mora (ext),
// lo pagado en el mes (av), lo que ya cubre este mes contando adelantos del mes anterior (got) y el abono a capital acumulado (pool).
const cardFlow = (c, nm) => {
    const its = S.items.filter(x => x.k == c.n), ps = S.items.filter(x => x.t == "p" && x.pc == c.n);
    const n0 = mIdx(nm), sch = {}, byM = {}, td = today(), rd = (c.mr || 0) / 100 / 30;
    let start = null;
    its.forEach(x => {
        const q = x.q > 1 ? x.q : 1, f = firstPay(x);
        for (let e = 0; e < q; e++) { const i = f + e; sch[i] = (sch[i] || 0) + cm(x, idxYm(i)); }
        if (start === null || f < start) start = f;
    });
    ps.forEach(x => { const i = mIdx(x.d.slice(0, 7)); (byM[i] = byM[i] || []).push(x); if (start === null || i < start) start = i; });
    if (c.mf > 0 && c.mfs) { const i = mIdx(c.mfs); if (start === null || i < start) start = i; }
    const zero = { cuota: 0, fee: 0, mora: 0, atr: 0, ext: 0, av: 0, got: 0, pool: 0 };
    if (start === null || start > n0) return zero;
    let total = 0; Object.keys(sch).forEach(i => { total += sch[i]; });
    // arr = cuota vencida y sin pagar que viene de meses anteriores; mor = mora sin pagar que viene de meses anteriores
    let pool = 0, run = 0, cin = 0, arr = 0, mor = 0, out = zero;
    for (let i = start; i <= n0; i++) {
        const base = sch[i] || 0, fee = feeAt(c, i), m = idxYm(i), P = payDateIn(c.p, m), pool0 = pool, cin0 = cin, arr0 = arr, mor0 = mor;
        run += base;
        const eff = base - Math.max(0, Math.min(base, pool - (total - run))); // el abono a capital borra primero las últimas cuotas
        const D = eff + fee;
        const evs = (byM[i] || []).slice().sort((a, b) => a.d.localeCompare(b.d) || a.id - b.id), av = evs.reduce((s, x) => s + x.a, 0);
        const eom = payDateIn(31, m), lim = td < eom ? td : eom;              // la mora corre hasta hoy (o fin de ese mes)
        // A = vencido de meses anteriores (la mora corre desde el 1.º del mes), cB = cuota de este mes (la mora corre desde su día de pago)
        let A = arr, cB = Math.max(0, D - cin), xs = Math.max(0, cin - D), mora = 0, mp = 0, aA = payDateIn(31, idxYm(i - 1)), aC = P;
        const acc = dt => {
            if (rd > 0) { if (A > 0) mora += A * rd * dayDiff(aA, dt); if (dt > P && cB > 0) mora += cB * rd * dayDiff(aC, dt); }
            if (dt > aA) aA = dt;
            if (dt > P && dt > aC) aC = dt;
        };
        evs.forEach(x => {
            const dt = x.d < lim ? x.d : lim;
            acc(dt);
            let r = x.a;
            const payA = () => { const v = Math.min(r, A); A -= v; r -= v; };                             // lo vencido de meses anteriores
            const payC = () => { const v = Math.min(r, cB); cB -= v; r -= v; };                           // la cuota de este mes
            const payM = () => { const v = Math.min(r, Math.max(0, mor0 + mora - mp)); mp += v; r -= v; }; // la mora causada hasta ese día
            payA();
            if (dt <= P) { payM(); payC(); } else { payC(); payM(); } // antes del día de pago la cuota de este mes aún no está vencida: la mora va primero
            xs += r;
        });
        acc(lim);
        const flagged = !!(c.paid && c.paid[m]);                                 // marcada como pagada: se borra lo vencido y la mora
        if (flagged) { A = 0; cB = 0; mora = 0; mp = 0; }
        const moraTot = flagged ? 0 : mor0 + mora;                               // mora bruta: la que venía sin pagar + la de este mes
        if (i == n0) out = { cuota: eff, fee, mora: moraTot, atr: arr0, ext: fee + moraTot, av, got: av + cin0, pool: pool0 };
        const need = (sch[i + 1] || 0) + feeAt(c, i + 1), sp = Math.min(xs, need); // lo que sobra adelanta la cuota siguiente
        pool += xs - sp; cin = sp;
        // Lo que quedó sin pagar pasa al mes siguiente como vencido (solo si su día de pago ya pasó)
        arr = A + (P < td ? cB : 0);
        mor = flagged ? 0 : Math.max(0, mor0 + mora - mp);
    }
    return out;
};
const cardDue = (c, nm) => { if (c.paid[nm]) return 0; const f = cardFlow(c, nm); return Math.max(0, f.cuota + f.atr + f.ext - f.got); };
const nextPay = p => {
    const n = new Date(), d = new Date(n.getFullYear(), n.getMonth(), Math.min(p, 28));
    if (p > 28) d.setDate(p);
    if (d < new Date(n.getFullYear(), n.getMonth(), n.getDate())) d.setMonth(d.getMonth() + 1);
    return Math.round((d - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
};
// Cupo real: lo que debes menos lo que ya pagaste
const cardUse = (c, nm) => {
    const its = S.items.filter(x => x.k == c.n);
    const f = cardFlow(c, nm), cq = f.cuota, atr = f.atr, ext = f.ext, tot = cq + atr + ext, ab = f.got, us = its.reduce((t, x) => t + pend(x, nm), 0); // ab = pagado que cubre este mes; f.pool = abonos a capital anteriores
    const ok = !!c.paid[nm] || (tot > 0 && tot - ab <= 0);
    const cap = Math.max(0, ab - ext); // la cuota de manejo y la mora no bajan la deuda: solo lo demás libera cupo
    const used = Math.max(0, us + atr - f.pool - (ok ? Math.max(cap, cq + atr) : cap)); // lo vencido sin pagar sigue ocupando cupo (aprox.)
    const raw = c.c ? used / c.c * 100 : 0;
    return { cq, atr, atrLeft: Math.max(0, atr - ab), ext, fee: f.fee, mora: f.mora, us, ab, ok, used, raw, pct: Math.min(100, raw), avail: Math.max(0, (c.c || 0) - used) };
};
const useTone = p => p < 30 ? { bar: "bg-emerald-500", txt: "text-emerald-500", lbl: "Uso saludable" } : p < 70 ? { bar: "bg-amber-500", txt: "text-amber-500", lbl: "Uso moderado" } : { bar: "bg-rose-500", txt: "text-rose-500", lbl: "Uso alto" };

// ---------- Tarjetas: extracto (qué compras entran en cada corte) ----------
// Mes en que cae el pago de un día de pago dado, por si la tarjeta se registró hoy (la cuota de manejo empieza en el próximo pago)
const nextPayYm = p => { const d = midnight(); d.setDate(d.getDate() + nextPay(p)); return ym(d); };
// Extracto que se paga en el mes i (año*12+mes): compras del corte, cuotas de compras anteriores, manejo y mora
function stmt(c, i) {
    const nm = idxYm(i), rows = [];
    let base = 0, news = 0;
    S.items.filter(x => x.k == c.n).forEach(x => {
        const q = x.q > 1 ? x.q : 1, e = me(x, nm);
        if (e < 1 || e > q) return;
        const cu = cm(x, nm); base += cu;
        if (e == 1) news += x.a;
        rows.push({ x, e, q, cu, it: intOf(x, nm) });
    });
    rows.sort((a, b) => (a.e == 1 ? 0 : 1) - (b.e == 1 ? 0 : 1) || b.x.d.localeCompare(a.x.d) || b.x.id - a.x.id);
    const f = cardFlow(c, nm), k = c.k || c.p, cl = i - (c.k && c.p && c.p <= c.k ? 1 : 0); // mes en que cierra (corte)
    const close = payDateIn(k, idxYm(cl)), prev = payDateIn(k, idxYm(cl - 1));
    const from = ymd(new Date(+prev.slice(0, 4), +prev.slice(5, 7) - 1, +prev.slice(8) + 1));
    const total = f.cuota + f.atr + f.ext, flagged = !!c.paid[nm];
    return { nm, rows, news, base, adj: f.cuota - base, atr: f.atr, fee: f.fee, mora: f.mora, total, paid: f.got, flagged,
        pend: flagged ? 0 : Math.max(0, total - f.got), from, close, pay: payDateIn(c.p, nm), open: close >= today() };
}
// Extractos que se pueden recorrer: desde el primer pago de una compra hasta el último, y siempre el que está abierto hoy
function stmtBounds(c) {
    const nowI = mIdx(ym(new Date()));
    let lo = nowI, hi = Math.max(nowI + 1, firstPay({ d: today(), k: c.n }));
    S.items.filter(x => x.k == c.n).forEach(x => { const q = x.q > 1 ? x.q : 1, f = firstPay(x); lo = Math.min(lo, f); hi = Math.max(hi, f + q - 1); });
    return { lo, hi };
}

// ---------- Detalle por categoría (con rango de fechas) ----------
// Atajos de rango. "" en desde/hasta = sin límite.
function catRanges() {
    const n = new Date(), y = n.getFullYear(), m = n.getMonth(), r = (a, b) => [ymd(a), ymd(b)];
    return {
        m0: r(new Date(y, m, 1), new Date(y, m + 1, 0)),
        m1: r(new Date(y, m - 1, 1), new Date(y, m, 0)),
        d30: r(new Date(y, m, n.getDate() - 29), n),
        m3: r(new Date(y, m - 2, 1), new Date(y, m + 1, 0)),
        y0: r(new Date(y, 0, 1), new Date(y, 11, 31)),
        all: ["", ""]
    };
}
// Mismos movimientos que suma "En qué se va la plata": gastos de esa categoría, visibles y dentro del resumen
function catDetail(c, from, to) {
    const all = S.items.filter(x => x.t == "g" && x.c == c && vis(x) && (!from || x.d >= from) && (!to || x.d <= to));
    const rows = all.filter(x => !x.s).sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id);
    const tot = rows.reduce((s, x) => s + x.a, 0);
    return { rows, tot, avg: rows.length ? tot / rows.length : 0, hid: all.length - rows.length, big: rows.reduce((m, x) => x.a > (m ? m.a : 0) ? x : m, null) };
}

// ---------- Deudas ----------
const dbtLeft = d => d.t - (d.p0 || 0) - S.items.filter(x => x.dbt == d.id).reduce((s, x) => s + x.a, 0);

// ---------- Plan para salir de deudas (Avalancha vs Bola de nieve) ----------
// Solo deudas de la pestaña Deudas con saldo. min = cuota mensual (0 si no se registró), r = tasa mensual.
const debtList = () => S.dbt.map(d => ({ id: d.id, n: d.n, bal: Math.max(0, dbtLeft(d)), min: d.cu > 0 ? d.cu : 0, r: (d.ir || 0) / 100 })).filter(d => d.bal > 0.5);
// Simula mes a mes. mode: "av" mayor tasa primero, "bn" menor saldo primero, "min" solo cuotas mínimas sin reasignar.
// Cada mes: se cobra el interés, se pagan las cuotas mínimas y lo que sobra del presupuesto B va a la deuda prioritaria.
// Lo que se libera al terminar una deuda se reasigna solo (el presupuesto no baja).
function debtSim(ds, B, mode) {
    const L = ds.map(d => Object.assign({ paidAt: 0 }, d));
    const prio = () => L.filter(d => d.bal > 0.5).sort(mode == "av" ? (a, b) => b.r - a.r || a.bal - b.bal : (a, b) => a.bal - b.bal || b.r - a.r);
    let m = 0, interest = 0;
    while (L.some(d => d.bal > 0.5) && m < 600) {
        m++;
        L.forEach(d => { if (d.bal > 0.5) { const i = d.bal * d.r; d.bal += i; interest += i; } });
        let pool = B;
        L.forEach(d => { if (d.bal > 0.5) { const p = Math.min(d.min, d.bal); d.bal -= p; pool -= p; } });
        if (mode != "min") prio().forEach(d => { if (pool > 0.5) { const p = Math.min(pool, d.bal); d.bal -= p; pool -= p; } });
        L.forEach(d => { if (d.bal <= 0.5 && !d.paidAt) { d.paidAt = m; d.bal = 0; } });
    }
    const done = !L.some(d => d.bal > 0.5);
    return { done, months: done ? m : null, interest, order: L.slice().sort((a, b) => (a.paidAt || 1e9) - (b.paidAt || 1e9)) };
}
function debtPlan(B) {
    const ds = debtList(), mins = ds.reduce((s, d) => s + d.min, 0), Bf = Math.max(B || 0, mins);
    return { ds, mins, B: Bf, low: B > 0 && B < mins, rates: ds.some(d => d.r > 0), av: debtSim(ds, Bf, "av"), bn: debtSim(ds, Bf, "bn"), mn: debtSim(ds, mins, "min") };
}

// ---------- Metas con fecha límite ----------
const goalStart = a => {
    const ds = S.sv.filter(x => x.a == a.id).map(x => x.d);
    const idd = new Date(a.id);
    if (!isNaN(idd)) ds.push(ymd(idd));
    if (a.s0) ds.push(a.s0);
    return ds.sort()[0] || today();
};
function goalInfo(a) {
    if (!a.dl || !a.g) return null;
    const t = goalTotal(a), falta = a.g - t, t0 = midnight();
    const end = new Date(a.dl + "T00:00:00"), st = new Date(goalStart(a) + "T00:00:00");
    const days = daysBetween(t0, end), total = Math.max(1, daysBetween(st, end)), el = daysBetween(st, t0);
    const pexp = Math.min(1, Math.max(0, el / total)), exp = a.g * pexp;
    const done = falta <= 0, late = !done && days < 0;
    const perMonth = done ? 0 : falta / Math.max(1, days / 30.44);
    return { t, falta, days, pexp, exp, done, late, perMonth, ok: t >= exp * 0.98, gap: Math.max(0, exp - t) };
}

// ---------- Inversiones: rendimiento anualizado ----------
const daysOf = d => Math.max(0, daysBetween(new Date(d + "T00:00:00"), midnight()));
// Rendimiento efectivo anual estimado (sirve desde 30 días; antes exagera mucho)
const annOf = (v, i, d) => { const days = daysOf(d); if (!(i > 0) || !(v > 0) || days < 30) return null; return Math.pow(v / i, 365 / days) - 1; };
const pct1 = r => (r >= 0 ? "+" : "") + (r * 100).toFixed(1).replace(".", ",") + "%";
function invPortfolio() {
    let T = 0, C = 0, w = 0;
    S.inv.forEach(x => { const v = cop(x.v, x.c), i = cop(x.i, x.c); T += v; C += i; w += i * daysOf(x.d); });
    const avg = C ? w / C : 0;
    const ann = C > 0 && T > 0 && avg >= 30 ? Math.pow(T / C, 365 / avg) - 1 : null;
    return { T, C, avg, ann };
}

// ---------- Rebalanceo del portafolio ----------
// Tipos de activo: [clave, nombre, ejemplos]. Una inversión sin tipo (x.k vacío) no entra en el cálculo.
const CL = [["v", "Renta variable", "ETFs, acciones"], ["f", "Renta fija", "CDT, bonos"], ["e", "Efectivo", "liquidez, cuentas"]];
const INV_KINDS = CL.map(c => c[1]).concat("Sin clasificar");
const invK = l => (CL.find(c => c[1] == l) || [])[0] || "";
const invLabel = k => (CL.find(c => c[0] == k) || [])[1] || "Sin clasificar";
// ap = aporte nuevo. Sin aporte: cuánto comprar/vender de cada tipo para llegar al objetivo.
// Con aporte: reparte solo compras (sin vender nada) hacia lo que más se quedó corto.
function rebalance(ap) {
    const val = { v: 0, f: 0, e: 0 }; let un = 0;
    S.inv.forEach(x => { const v = cop(x.v, x.c); if (val[x.k] !== undefined) val[x.k] += v; else un += v; });
    const T = val.v + val.f + val.e, tg = S.rb, sumT = (tg.v || 0) + (tg.f || 0) + (tg.e || 0), ok = Math.abs(sumT - 100) < 0.01;
    const rows = CL.map(([k, n, h]) => ({ k, n, h, cur: val[k], pct: T ? val[k] / T * 100 : 0, tgt: tg[k] || 0, delta: 0, after: val[k], apct: 0 }));
    const tot = T + (ap || 0);
    if (!ok || tot <= 0) return { rows, T, un, ok, sumT, tot: 0, ap: ap || 0 };
    if (ap > 0) {
        const need = rows.map(r => Math.max(0, tot * r.tgt / 100 - r.cur)), ns = need.reduce((a, b) => a + b, 0);
        rows.forEach((r, i) => { r.delta = ns > 0 ? need[i] / ns * ap : 0; });
    } else rows.forEach(r => { r.delta = tot * r.tgt / 100 - r.cur; });
    rows.forEach(r => { r.after = r.cur + r.delta; r.apct = r.after / tot * 100; });
    return { rows, T, un, ok, sumT, tot, ap: ap || 0 };
}

// ---------- Patrimonio neto ----------
function netWorth() {
    const nm = ym(new Date());
    const w = WH.reduce((s, x) => s + bal(x, nm), 0);
    const sv = S.acc.reduce((s, a) => s + goalTotal(a) * (a.u ? S.trm : 1), 0);
    const iv = S.inv.reduce((s, x) => s + cop(x.v, x.c), 0);
    const cd = S.cards.reduce((s, c) => s + cardUse(c, nm).used, 0);
    const db = S.dbt.reduce((s, d) => s + Math.max(0, dbtLeft(d)), 0);
    const act = w + sv + iv, pas = cd + db;
    return { w, sv, iv, cd, db, act, pas, tot: act - pas };
}

// ---------- Comparar meses ----------
const monthKey = off => ym(new Date(cur.getFullYear(), cur.getMonth() - off, 1));
const catTotals = k => G.map(([c]) => [c, S.items.filter(x => x.d.startsWith(k) && x.t == "g" && x.c == c && !x.s && vis(x)).reduce((s, x) => s + x.a, 0)]);
const monLabel = k => new Date(k + "-01T00:00:00").toLocaleDateString("es-CO", { month: "short", year: "numeric" });

// ---------- Buscador ----------
const matchQ = x => {
    if (!sqry) return true;
    const hay = [x.n, x.c, x.k, x.w, x.pc, x.d, x.a, fmt(x.a)].join(" ").toLowerCase();
    return sqry.toLowerCase().trim().split(/\s+/).every(t => hay.includes(t));
};
const baseItems = () => sall ? S.items.filter(vis) : mon();

// ---------- Filtro de Inicio: por billetera o por tarjeta ----------
const fltMatch = x => {
    if (flt.k == "w") { const w = WH[flt.v]; return !x.k && (x.w == w || x.to == w); }
    if (flt.k == "cards") return !!x.k || x.t == "p";
    if (flt.k == "c") { const c = S.cards.find(c => c.id == flt.v); return !c || x.k == c.n || (x.t == "p" && x.pc == c.n); }
    return true;
};

// ---------- Copia de seguridad: recordatorio ----------
const BK_DAYS = 14; // cada cuántos días te lo recuerda
const bkDaysAgo = () => S.bk ? daysBetween(new Date(S.bk + "T00:00:00"), midnight()) : null;
const bkDue = () => {
    if (S.items.length < 3 && !S.acc.length && !S.inv.length) return false; // aún no hay nada que perder
    if (S.bkz && S.bkz > today()) return false;                              // pospuesto
    const d = bkDaysAgo();
    return d === null || d >= BK_DAYS;
};

// ---------- Cuánto puedo gastar hoy ----------
// Reparte lo disponible entre los días que faltan del mes (hoy incluido),
// descontando los gastos fijos que todavía no han "caído" este mes.
function dailyInfo(disp, any) {
    const n = new Date();
    if (!any && ym(n) != ym(cur)) return null; // solo tiene sentido en el mes actual (el simulador lo fuerza con any)
    const nm = ym(n), td = n.getDate(), left = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - td + 1;
    // Lo gastado hoy que salió de una billetera (ya está restado de "disp")
    const spent = S.items.filter(x => x.d == today() && x.t == "g" && !x.k && !x.sav && vis(x)).reduce((s, x) => s + x.a, 0);
    const fixed = (S.rec || []).filter(r => r.last != nm && (r.day > td || r.vr) && !r.k).reduce((s, r) => s + r.a, 0); // los de monto variable pesan con su último valor hasta que los confirmes
    const avail = disp - fixed;                 // lo que realmente te queda, descontando gastos fijos por venir
    const perDay = (avail + spent) / left;      // lo que tocaba por día al empezar hoy
    return { left, spent, fixed, avail, none: avail <= 0, perDay, rest: perDay - spent, later: left > 1 ? avail / (left - 1) : 0 };
}

// ---------- Proyección del mes ----------
// "A este ritmo, ¿con cuánto cierro el mes?" Solo tiene sentido en el mes actual.
// Ritmo = gasto variable que salió de una billetera (sin gastos fijos, deudas ni ahorro) dividido entre los días transcurridos.
// Cierre = disponible de hoy (ya sin cuotas de tarjeta) - gastos fijos por venir - ritmo × días que faltan.
function monthProjection(disp) {
    const n = new Date();
    if (ym(n) != ym(cur)) return null;
    const nm = ym(n), td = n.getDate(), left = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - td;
    const isFixed = x => !!x.rid || (S.rec || []).some(r => r.n == x.n && r.a == x.a && r.c == x.c && x.d == nm + "-" + String(r.day).padStart(2, "0"));
    const spent = S.items.filter(x => x.t == "g" && x.d.startsWith(nm) && x.d <= today() && !x.k && !x.s && !x.sav && !x.dbt && x.c != "Ahorro" && vis(x) && !isFixed(x)).reduce((s, x) => s + x.a, 0);
    const fixed = (S.rec || []).filter(r => r.last != nm && (r.day > td || r.vr) && !r.k).reduce((s, r) => s + r.a, 0); // los de monto variable pesan con su último valor hasta que los confirmes
    const pace = spent / td, proj = pace * left, end = disp - fixed - proj, room = disp - fixed;
    return { few: td < 3, td, left, spent, pace, proj, fixed, end, room, fit: left > 0 ? Math.max(0, room / left) : 0 };
}

// ---------- Simulador "¿Puedo permitírmelo?" ----------
// "Disponible para gastar" de un mes real (misma fórmula que Inicio: en mano - lo que falta de tarjetas)
function dispAt(nm, hw) {
    const hid = n => (S.hide || {})[n];
    let have;
    if (hw) have = WH.filter(w => !hid(w)).reduce((s, w) => s + bal(w, nm), 0);
    else {
        const m = S.items.filter(x => x.d.startsWith(nm) && vis(x));
        have = sum(m, x => x.t == "i") - sum(m, x => x.t == "g") - S.sv.filter(x => x.d.startsWith(nm) && !x.i).reduce((s, x) => s + (x.cp ?? x.v), 0);
    }
    return have - S.cards.filter(c => !hid(c.n)).reduce((s, c) => s + cardSoon(c), 0);
}
// Mete una compra imaginaria de hoy, mide antes y después, y la quita. No guarda nada.
function simulate(a, cat, pay, q, ni) {
    const nm = ym(new Date()), hw = S.items.some(x => x.w) || Object.keys(S.ini).length > 0;
    const card = S.cards.find(c => c.n == pay) || null;
    q = card ? Math.max(1, q) : 1;
    const ir = card && q > 1 && !ni ? (card.ir || 0) : 0;
    const x = { id: -1, d: today(), t: "g", c: cat, n: "", a, k: card ? card.n : "", w: card ? "" : pay, q, ni: ni ? 1 : 0, ir };
    const r = { card, q, ir, x, cat, a, bud: budOf(cat, nm) };
    const snap = () => ({ disp: dispAt(nm, hw), day: dailyInfo(dispAt(nm, hw), true), spent: catSpent(cat, nm), use: card ? cardUse(card, nm) : null });
    if (card) { r.fp = firstPay(x); r.sched = []; for (let e = 0; e < q; e++) { const i = r.fp + e, m = idxYm(i); r.sched.push({ m, pay: payDateIn(card.p, m), cu: cm(x, m), b: cardDue(card, m), af: 0 }); } }
    r.b = snap();
    S.items.push(x);
    try {
        r.f = snap();
        if (card) r.sched.forEach(s => { s.af = cardDue(card, s.m); });
    } finally { S.items.pop(); }
    r.interest = card ? Math.max(0, pmt(a, q, rate(x)) * q - a) : 0;
    return r;
}

// ---------- Presupuestos ----------
// Presupuesto de la categoría c en el mes k ("2026-09"):
//  - base: el del mes puntual si lo hay; si no, el fijo de siempre
//  - carry: lo que sobró de los meses anteriores (solo si la categoría acumula sobrante). Si te pasas, no se descuenta del siguiente.
//  - tot: base + carry (0 = sin presupuesto ese mes)
const budBase = (c, k) => { const o = (S.budm || {})[k]; return o && o[c] > 0 ? o[c] : ((S.bud || {})[c] || 0); };
function budInfo(c, k) {
    const b = budBase(c, k), st = (S.budr || {})[c], ov = !!(((S.budm || {})[k] || {})[c] > 0);
    let carry = 0;
    if (b > 0 && st && k > st) {
        let m = st, n = 0;
        while (m < k && n++ < 120) {
            const bm = budBase(c, m);
            carry = bm > 0 ? Math.max(0, bm + carry - catSpent(c, m)) : 0;
            m = nextMonth(m);
        }
    }
    return { base: b, carry, tot: b > 0 ? b + carry : 0, ov, roll: !!st };
}
const budOf = (c, k) => budInfo(c, k).tot;
const catSpent = (c, k) => S.items.filter(x => x.d.startsWith(k) && x.t == "g" && x.c == c && !x.s && vis(x)).reduce((s, x) => s + x.a, 0);

// ---------- Fechas de pago y avisos ----------
const REM_WIN = { g: 7, c: 3, d: 3 }; // cuántos días antes empieza a avisar: metas, tarjetas, deudas
const daysTo = date => daysBetween(midnight(), new Date(date + "T00:00:00"));
const payDateIn = (p, m) => { const y = +m.slice(0, 4), mo = +m.slice(5) - 1, dim = new Date(y, mo + 1, 0).getDate(); return ymd(new Date(y, mo, Math.min(p, dim))); };
const payDate = p => payDateIn(p, ym(new Date()));
const nextMonth = m => ym(new Date(+m.slice(0, 4), +m.slice(5), 1));
// Próximo pago pendiente de una tarjeta: la cuota de este mes si aún falta; si ya la pagaste, la del mes siguiente
// (ej. con corte 28 y pago 18, el 29 de sept. ya está cerrado el extracto que se paga el 18 de oct.)
const cardNext = c => {
    const nm = ym(new Date()), d = cardDue(c, nm);
    if (d > 0) return { m: nm, due: d };
    // Busca la primera cuota pendiente que viene (puede estar a 2 meses o más si compraste después del corte)
    let m = nm;
    for (let i = 0; i < 24; i++) { m = nextMonth(m); const dd = cardDue(c, m); if (dd > 0) return { m, due: dd }; }
    return { m: nextMonth(nm), due: 0 };
};
// Lo que pesa sobre "Disponible": lo que falta de la cuota de ESTE mes. La cuota del mes siguiente solo se suma
// cuando ya pasó el día de pago de este mes (mientras tanto ya cuenta en el cupo usado, pero no te quita plata para gastar hoy).
// Así: pagas la cuota → queda en $0 → pasa la fecha de pago → recién ahí empieza a contar la siguiente.
const cardSoon = c => {
    const nm = ym(new Date()), d = cardDue(c, nm);
    return dueIn(c.p) < 0 ? Math.max(d, cardDue(c, nextMonth(nm))) : d; // lo que quedó sin pagar ya viaja dentro de la cuota siguiente
};
// Días que faltan para el pago de ESTE mes (negativo = ya pasó)
const dueIn = p => daysTo(payDate(p));
const dueTxt = d => d < 0 ? "venció hace " + (-d) + (d == -1 ? " día" : " días") : d == 0 ? "vence hoy" : "vence en " + d + (d == 1 ? " día" : " días");
// Lo que falta pagar este mes de una deuda con día de pago
const dbtDue = (d, nm) => {
    const left = dbtLeft(d); if (!(left > 0)) return 0;
    const paid = S.items.filter(x => x.dbt == d.id && x.d.startsWith(nm)).reduce((s, x) => s + x.a, 0);
    return d.cu > 0 ? Math.min(left, Math.max(0, d.cu - paid)) : (paid > 0 ? 0 : left);
};
// Todo lo que puede avisar: metas, tarjetas y deudas. La app y el service worker usan esta misma lista.
function reminderEvents() {
    const E = [], nm = ym(new Date());
    S.acc.filter(a => !a.f && a.dl && a.g).forEach(a => {
        const gi = goalInfo(a); if (!gi || gi.done) return;
        E.push({ key: "g" + a.id, title: "Mi Plata · " + a.n, what: "Tu meta", date: a.dl, win: REM_WIN.g, extra: "Faltan " + fm(a, gi.falta) + "." });
    });
    S.cards.filter(c => !(S.hide || {})[c.n]).forEach(c => {
        const nx = cardNext(c); if (!(nx.due > 0)) return;
        E.push({ key: "c" + c.id, title: "Mi Plata · " + c.n, what: "El pago de la tarjeta", date: payDateIn(c.p, nx.m), win: REM_WIN.c, extra: "Te faltan " + fmt(nx.due) + " de la cuota." });
    });
    S.dbt.filter(d => d.dd).forEach(d => {
        const due = dbtDue(d, nm); if (!(due > 0)) return;
        E.push({ key: "d" + d.id, title: "Mi Plata · " + d.n, what: "El pago de la deuda", date: payDate(d.dd), win: REM_WIN.d, extra: d.cu > 0 ? "Te faltan " + fmt(due) + " de la cuota." : "Debes " + fmt(due) + " y aún no abonas este mes." });
    });
    (S.rec || []).filter(r => r.vr && r.last != nm).forEach(r => {
        E.push({ key: "r" + r.id, title: "Mi Plata · " + r.n, what: "Tu gasto fijo", date: payDate(r.day), win: 0, extra: "Confirma cuánto llegó este mes (el último fue " + fmt(r.a) + ")." });
    });
    return E;
}
// Gastos fijos de monto variable a los que ya les llegó la fecha y aún no confirmas el valor de este mes
const recPend = () => { const nm = ym(new Date()), td = new Date().getDate(); return (S.rec || []).filter(r => r.vr && r.last != nm && td >= r.day); };
const remindBody = (e, days) => e.what + " " + dueTxt(days) + ". " + e.extra;

// ---------- Consejos automáticos ----------
function tipsList(by) {
    const m = mon(), nm = ym(new Date()), T = [];
    const ing = sum(m, x => x.t == "i"), aho = svm();
    const gx = m.filter(x => x.t == "g" && !x.s);
    const kind = k => gx.filter(x => ((G.find(g => g[0] == x.c) || [])[1]) == k).reduce((t, x) => t + x.a, 0);
    const gas = gx.reduce((t, x) => t + x.a, 0), nec = kind("n"), gus = kind("g");
    const add = (lv, ic, t, d) => T.push({ lv, ic, t, d });

    // Metas con fecha
    let goodGoal = false;
    S.acc.filter(a => !a.f && a.dl && a.g).forEach(a => {
        const gi = goalInfo(a); if (!gi || gi.done) return;
        if (gi.late) add(0, "fa-flag", "La meta " + a.n + " ya venció", "Faltan " + fm(a, gi.falta) + ". Haz un último empujón o cambia la fecha.");
        else if (gi.days <= 30) add(0, "fa-hourglass-half", a.n + " vence en " + gi.days + (gi.days == 1 ? " día" : " días"), "Faltan " + fm(a, gi.falta) + " (≈ " + fm(a, gi.perMonth) + " al mes).");
        else if (!gi.ok) add(1, "fa-flag-checkered", "Vas atrasado en " + a.n, "Deberías llevar " + fm(a, gi.exp) + " y llevas " + fm(a, gi.t) + ". Necesitas ≈ " + fm(a, gi.perMonth) + " al mes.");
        else if (!goodGoal) { goodGoal = true; add(3, "fa-flag-checkered", "Vas al día con " + a.n, "Para llegar a tiempo, ahorra ≈ " + fm(a, gi.perMonth) + " al mes."); }
    });

    // Tarjetas
    let goodCard = false, intTot = 0;
    S.cards.filter(c => c.c && !(S.hide || {})[c.n]).forEach(c => {
        const u = cardUse(c, nm), pc = Math.round(u.raw), nx = cardNext(c), d = daysTo(payDateIn(c.p, nx.m));
        intTot += cardInt(c, nm);
        if (u.mora > 0) add(0, "fa-triangle-exclamation", c.n + " ya está generando mora", "Van ≈ " + fmt(u.mora) + " de interés de mora. Págala hoy para que no siga subiendo.");
        else if (u.atrLeft > 0) add(0, "fa-triangle-exclamation", c.n + " tiene " + fmt(u.atrLeft) + " vencidos de meses anteriores", "Ponte al día cuanto antes: ese saldo sigue acumulando intereses de mora.");
        if (nx.due > 0 && d <= 5 && d >= -30) add(0, "fa-calendar-day", c.n + " " + dueTxt(d), "Te faltan " + fmt(nx.due) + " de la cuota. " + (d < 0 ? "Págala cuanto antes para frenar los intereses de mora." : "Págala a tiempo y evita intereses de mora."));
        if (u.raw >= 70) add(0, "fa-credit-card", c.n + " está al " + pc + "% del cupo", "Abona para liberar cupo. Lo ideal es mantener cada tarjeta por debajo del 30%.");
        else if (u.raw >= 30) add(1, "fa-credit-card", c.n + " va en " + pc + "% del cupo", "Antes de otra compra a cuotas, abona un poco. Meta: menos del 30% utilizado.");
        else if (!goodCard) { goodCard = true; add(3, "fa-circle-check", "Buen manejo de " + c.n, "Solo usas el " + pc + "% del cupo. Eso cuida tu historial crediticio."); }
    });
    // Deudas con día de pago
    S.dbt.filter(x => x.dd).forEach(x => {
        const due = dbtDue(x, nm), dt = dueIn(x.dd);
        if (due > 0 && dt <= 5 && dt >= -30) add(0, "fa-hand-holding-dollar", x.n + " " + dueTxt(dt), (x.cu > 0 ? "Te faltan " + fmt(due) + " de la cuota. " : "Aún no registras un abono este mes. ") + "Págala a tiempo para evitar intereses de mora.");
    });
    if (intTot > 0) add(1, "fa-percent", "Pagas " + fmt(intTot) + " en intereses este mes", "Comprar sin interés o a una sola cuota te ahorra esa plata.");

    if (ing <= 0 && gas > 0) add(2, "fa-arrow-trend-up", "Aún no registras ingresos este mes", "Anótalos para ver tu distribución real y recibir mejores sugerencias.");
    if (ing > 0) {
        if (gus / ing > 0.3) add(1, "fa-scale-balanced", "Gustos al " + Math.round(gus / ing * 100) + "% de tus ingresos", "La regla 50/30/20 sugiere máximo 30% en ocio, compras y otros. Recorta un poco esta semana.");
        if (nec / ing > 0.5) add(1, "fa-house", "Necesidades al " + Math.round(nec / ing * 100) + "% de tus ingresos", "Supera el 50% ideal. Revisa gastos fijos y servicios que puedas ajustar.");
        if (aho / ing < 0.1) add(2, "fa-piggy-bank", "Págate primero", "Separa entre 10% y 20% apenas recibas el ingreso, antes de gastar.");
        else if (aho / ing >= 0.2) add(3, "fa-piggy-bank", "Estás ahorrando el " + Math.round(aho / ing * 100) + "%", "Vas por encima del 20% recomendado. ¡Sigue así!");
    }
    // Presupuestos: avisa desde el 80% (antes de pasarte) y cuando ya te pasaste. Máx. 2, los más críticos.
    const nowM = ym(cur) == nm, dLeft = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate() - new Date().getDate() + 1;
    by.map(([c, v]) => [c, v, budOf(c, ym(cur))]).filter(x => x[2] > 0).map(([c, v, b]) => [c, v, b, v / b]).filter(x => x[3] >= 0.8).sort((a, b) => b[3] - a[3]).slice(0, 2).forEach(([c, v, b, r]) => {
        if (r >= 1) add(1, "fa-bullseye", "Te pasaste en " + c, "Llevas " + fmt(v) + " de un presupuesto de " + fmt(b) + ". Frena esta categoría lo que queda del mes.");
        else add(1, "fa-gauge-high", "Vas al " + Math.floor(r * 100) + "% de tu presupuesto en " + c, "Te quedan " + fmt(b - v) + (nowM && dLeft > 0 ? " para " + dLeft + (dLeft == 1 ? " día" : " días") + " (≈ " + fmt((b - v) / dLeft) + " por día)." : "."));
    });

    const ah = S.acc.filter(a => !a.f).reduce((t, a) => t + svb(a.id) * (a.u ? S.trm : 1), 0);
    if (gas > 0 && ah < gas * 3) add(2, "fa-shield-halved", "Arma tu fondo de emergencia", "Meta: 3 meses de gastos (≈ " + fmt(gas * 3) + "). Llevas " + Math.round(ah / (gas * 3) * 100) + "%.");
    if (!T.length) add(3, "fa-wand-magic-sparkles", "Todo en orden", "Sigue registrando tus movimientos y aquí aparecerán sugerencias a tu medida.");
    return { list: T.sort((a, b) => a.lv - b.lv).slice(0, 4), ing, nec, gus, aho };
}
const TIP_STY = [
    ["bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400", "Urgente"],
    ["bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", "Ojo"],
    ["bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400", "Idea"],
    ["bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", "Bien"]
];
