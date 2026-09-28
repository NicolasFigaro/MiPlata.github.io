// ===== Mi Plata · logica.js =====
// Datos, utilidades y cálculos. No toca la pantalla (eso está en vistas.js y acciones.js).

const G = [["Vivienda","n"],["Comida","n"],["Transporte","n"],["Servicios","n"],["Deudas/Tarjeta","n"],["Ocio","g"],["Compras","g"],["Otros","g"],["Ahorro","a"]];
const I = ["Sueldo","Extra","Otro ingreso"];
const WH = ["Efectivo","Cuenta de ahorros","Billetera digital (Nequi, Daviplata)"];
const KEY = "miplata_advanced_v2"; // misma clave: tus datos actuales siguen funcionando

// ---------- Utilidades ----------
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = n => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n || 0)).toLocaleString("es-CO");
const fu = n => "US$" + (n || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });
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
S.th = S.th || { m: "auto", p: 0, pv: false };
S.hide = S.hide || {};
S.ini = S.ini || {};
S.nwh = S.nwh || {};   // historial del patrimonio neto (una foto por mes)
S.nt = S.nt || {};     // avisos de metas ya mostrados (para no repetir el mismo día)
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
// Meses transcurridos desde la compra (1 = mes de la compra)
const me = (x, nm) => (+nm.slice(0, 4) * 12 + +nm.slice(5)) - (+x.d.slice(0, 4) * 12 + +x.d.slice(5, 7)) + 1;
// Tasa mensual con la que se hizo esa compra (guardada al comprar). Sin tasa guardada = sin interés.
const rate = x => (x.k && x.q > 1 && !x.ni ? (x.ir || 0) : 0) / 100;
// Cuota fija (sistema francés). Con tasa 0 es dividir en partes iguales.
const pmt = (P, q, i) => i > 0 ? P * i / (1 - Math.pow(1 + i, -q)) : P / q;
const cm = (x, nm) => { const q = x.q > 1 ? x.q : 1, e = me(x, nm); return e >= 1 && e <= q ? pmt(x.a, q, rate(x)) : 0; };
// Capital que aún debes al empezar ese mes (lo que ocupa cupo)
const pend = (x, nm) => {
    const q = x.q > 1 ? x.q : 1, e = me(x, nm);
    if (!(e >= 1 && e <= q)) return 0;
    const i = rate(x), C = pmt(x.a, q, i);
    return i > 0 ? x.a * Math.pow(1 + i, e - 1) - C * (Math.pow(1 + i, e - 1) - 1) / i : x.a - C * (e - 1);
};
// Parte de la cuota de ese mes que son intereses
const intOf = (x, nm) => { const i = rate(x); return i > 0 ? i * pend(x, nm) : 0; };
const cardInt = (c, nm) => S.items.filter(x => x.k == c.n).reduce((t, x) => t + intOf(x, nm), 0);
const cardPaid = (c, nm) => S.items.filter(x => x.t == "p" && x.pc == c.n && x.d.startsWith(nm)).reduce((s, x) => s + x.a, 0);
const cardDue = (c, nm) => c.paid[nm] ? 0 : Math.max(0, S.items.filter(x => x.k == c.n).reduce((t, x) => t + cm(x, nm), 0) - cardPaid(c, nm));
const nextPay = p => {
    const n = new Date(), d = new Date(n.getFullYear(), n.getMonth(), Math.min(p, 28));
    if (p > 28) d.setDate(p);
    if (d < new Date(n.getFullYear(), n.getMonth(), n.getDate())) d.setMonth(d.getMonth() + 1);
    return Math.round((d - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
};
// Cupo real: lo que debes menos lo que ya pagaste
const cardUse = (c, nm) => {
    const its = S.items.filter(x => x.k == c.n);
    const cq = its.reduce((t, x) => t + cm(x, nm), 0), us = its.reduce((t, x) => t + pend(x, nm), 0), ab = cardPaid(c, nm);
    const ok = !!c.paid[nm] || (cq > 0 && cq - ab <= 0);
    const used = Math.max(0, us - (ok ? Math.max(ab, cq) : ab));
    const raw = c.c ? used / c.c * 100 : 0;
    return { cq, us, ab, ok, used, raw, pct: Math.min(100, raw), avail: Math.max(0, (c.c || 0) - used) };
};
const useTone = p => p < 30 ? { bar: "bg-emerald-500", txt: "text-emerald-500", lbl: "Uso saludable" } : p < 70 ? { bar: "bg-amber-500", txt: "text-amber-500", lbl: "Uso moderado" } : { bar: "bg-rose-500", txt: "text-rose-500", lbl: "Uso alto" };

// ---------- Deudas ----------
const dbtLeft = d => d.t - (d.p0 || 0) - S.items.filter(x => x.dbt == d.id).reduce((s, x) => s + x.a, 0);

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
        const u = cardUse(c, nm), pc = Math.round(u.raw), d = nextPay(c.p);
        intTot += cardInt(c, nm);
        if (!u.ok && u.cq - u.ab > 0 && d <= 5) add(0, "fa-calendar-day", c.n + " vence en " + d + (d == 1 ? " día" : " días"), "Te faltan " + fmt(u.cq - u.ab) + " de la cuota. Págala a tiempo y evita intereses de mora.");
        if (u.raw >= 70) add(0, "fa-credit-card", c.n + " está al " + pc + "% del cupo", "Abona para liberar cupo. Lo ideal es mantener cada tarjeta por debajo del 30%.");
        else if (u.raw >= 30) add(1, "fa-credit-card", c.n + " va en " + pc + "% del cupo", "Antes de otra compra a cuotas, abona un poco. Meta: menos del 30% utilizado.");
        else if (!goodCard) { goodCard = true; add(3, "fa-circle-check", "Buen manejo de " + c.n, "Solo usas el " + pc + "% del cupo. Eso cuida tu historial crediticio."); }
    });
    if (intTot > 0) add(1, "fa-percent", "Pagas " + fmt(intTot) + " en intereses este mes", "Comprar sin interés o a una sola cuota te ahorra esa plata.");

    if (ing <= 0 && gas > 0) add(2, "fa-arrow-trend-up", "Aún no registras ingresos este mes", "Anótalos para ver tu distribución real y recibir mejores sugerencias.");
    if (ing > 0) {
        if (gus / ing > 0.3) add(1, "fa-scale-balanced", "Gustos al " + Math.round(gus / ing * 100) + "% de tus ingresos", "La regla 50/30/20 sugiere máximo 30% en ocio, compras y otros. Recorta un poco esta semana.");
        if (nec / ing > 0.5) add(1, "fa-house", "Necesidades al " + Math.round(nec / ing * 100) + "% de tus ingresos", "Supera el 50% ideal. Revisa gastos fijos y servicios que puedas ajustar.");
        if (aho / ing < 0.1) add(2, "fa-piggy-bank", "Págate primero", "Separa entre 10% y 20% apenas recibas el ingreso, antes de gastar.");
        else if (aho / ing >= 0.2) add(3, "fa-piggy-bank", "Estás ahorrando el " + Math.round(aho / ing * 100) + "%", "Vas por encima del 20% recomendado. ¡Sigue así!");
    }
    by.filter(([c, v]) => (S.bud || {})[c] && v > S.bud[c]).slice(0, 1).forEach(([c, v]) => add(1, "fa-bullseye", "Te pasaste en " + c, "Llevas " + fmt(v) + " de un presupuesto de " + fmt(S.bud[c]) + ". Frena esta categoría lo que queda del mes."));

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
