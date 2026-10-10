// ===== Mi Plata · pantallas.js =====
// Pantallas nuevas (Calendario, Resumen del año), guía de bienvenida, accesos directos del ícono y confeti al lograr una meta.
// Se carga ANTES de vistas.js: vistas.js necesita vCal y vYear para armar su lista de pantallas.

const MES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_SEM = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
const p2 = n => String(n).padStart(2, "0");

// ---------- Calendario ----------
let calM = new Date(); calM.setDate(1);
let calSel = null; // día elegido ("YYYY-MM-DD")
function calGo(n) { calM.setMonth(calM.getMonth() + n); calSel = null; draw(); }
function calPick(d) { calSel = calSel == d ? null : d; draw(); }
function calToday() { calM = new Date(); calM.setDate(1); calSel = today(); draw(); }

function vCal() {
    const y = calM.getFullYear(), m = calM.getMonth(), nm = ym(calM), dim = new Date(y, m + 1, 0).getDate();
    const off = (new Date(y, m, 1).getDay() + 6) % 7; // la semana empieza el lunes
    const td = today();
    const its = S.items.filter(x => x.d.startsWith(nm) && x.t != "p" && vis(x));
    const byD = {}; its.forEach(x => { (byD[x.d] = byD[x.d] || []).push(x); });
    // Vencimientos: metas con fecha, pagos de tarjetas y deudas (los mismos que avisan las notificaciones)
    const evs = reminderEvents().filter(e => e.k != "r" && e.date && e.date.startsWith(nm));
    const evD = {}; evs.forEach(e => { (evD[e.date] = evD[e.date] || []).push(e); });
    const ing = sum(its, x => x.t == "i"), gas = sum(its, x => x.t == "g");
    const evIc = { g: "fa-flag-checkered", c: "fa-credit-card", d: "fa-hand-holding-dollar" };

    let cells = "";
    for (let i = 0; i < off; i++) cells += "<span></span>";
    for (let d = 1; d <= dim; d++) {
        const k = nm + "-" + p2(d), L = byD[k] || [], hasG = L.some(x => x.t == "g"), hasI = L.some(x => x.t == "i"), hasE = !!evD[k];
        const sel = calSel == k, isT = k == td;
        cells += `<button onclick="calPick('${k}')" aria-label="${d} de ${MES[m]}" class="cal-day ${sel ? "cal-sel" : ""} ${isT ? "cal-today" : ""}">
            <span class="text-[13px] font-medium">${d}</span>
            <span class="cal-dots">${hasI ? '<i style="background:#34C759"></i>' : ""}${hasG ? '<i style="background:#FF3B30"></i>' : ""}${hasE ? '<i style="background:#FF9500"></i>' : ""}</span>
        </button>`;
    }

    const row = (ic, col, tt, sb, am, cl) => `<div class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div class="flex items-center gap-3 min-w-0"><span class="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white text-xs" style="background:${col}"><i class="fa-solid ${ic}"></i></span>
        <div class="min-w-0"><b class="text-xs text-slate-800 dark:text-white block truncate">${tt}</b><small class="text-[11px] text-slate-400">${sb}</small></div></div>
        <b class="text-xs shrink-0 ${cl || ""}">${am}</b></div>`;
    const evRow = e => row(evIc[e.k] || "fa-bell", "#FF9500", esc(e.title.replace("Mi Plata · ", "")), esc(e.what) + " · " + dmy(e.date).slice(0, 5), e.amt || "", "text-amber-500");
    const itRow = x => { const inn = x.t == "i", tr = x.t == "tr"; return row(inn ? "fa-arrow-down" : tr ? "fa-right-left" : catIc(x.c)[0], inn ? "#34C759" : tr ? "#007AFF" : catIc(x.c)[1], esc(x.n || x.c), tr ? "Transferencia" : esc(x.c), (inn ? "+" : tr ? "↔ " : "-") + fmt(x.a), inn ? "text-emerald-500" : ""); };

    let detail;
    if (calSel && calSel.startsWith(nm)) {
        const L = (byD[calSel] || []).slice().sort((a, b) => b.id - a.id), E = evD[calSel] || [];
        detail = `<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">${+calSel.slice(8)} de ${MES[m].toLowerCase()}</h4>`
            + (E.length || L.length ? E.map(evRow).join("") + L.map(itRow).join("") : '<p class="text-xs text-slate-400 text-center py-5">Nada anotado ni por vencer este día.</p>');
    } else {
        const nx = evs.slice().sort((a, b) => a.date.localeCompare(b.date));
        detail = `<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vencimientos del mes</h4>`
            + (nx.length ? nx.map(evRow).join("") : '<p class="text-xs text-slate-400 text-center py-5">No tienes metas, tarjetas ni deudas que venzan este mes. Toca un día para ver sus movimientos.</p>');
    }

    return `
        <section class="${CARD} p-4">
            <div class="flex items-center justify-between mb-3">
                <button onclick="calGo(-1)" aria-label="Mes anterior" class="nav-btn"><i class="fa-solid fa-chevron-left text-xs"></i></button>
                <div class="text-center"><b class="text-[17px] text-slate-800 dark:text-white">${MES[m]} ${y}</b>${nm != ym(new Date()) ? `<button onclick="calToday()" class="block mx-auto text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Ir a hoy</button>` : ""}</div>
                <button onclick="calGo(1)" aria-label="Mes siguiente" class="nav-btn"><i class="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
            <div class="cal-grid text-[11px] text-slate-400 uppercase mb-1">${["L", "M", "M", "J", "V", "S", "D"].map(d => `<span>${d}</span>`).join("")}</div>
            <div class="cal-grid">${cells}</div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span><i class="cal-lg" style="background:#34C759"></i>Ingreso</span><span><i class="cal-lg" style="background:#FF3B30"></i>Gasto</span><span><i class="cal-lg" style="background:#FF9500"></i>Vence</span>
            </div>
        </section>
        <section class="grid grid-cols-2 gap-3">
            <div class="${CARD} p-4"><small class="text-[10px] uppercase tracking-wider text-slate-400 block">Ingresos del mes</small><b class="text-base text-emerald-500">${fmt(ing)}</b></div>
            <div class="${CARD} p-4"><small class="text-[10px] uppercase tracking-wider text-slate-400 block">Gastos del mes</small><b class="text-base text-slate-800 dark:text-white">${fmt(gas)}</b></div>
        </section>
        <section class="${CARD} p-5">${detail}</section>`;
}

// ---------- Resumen del año ----------
let yrSel = new Date().getFullYear();
function yrGo(n) { yrSel += n; draw(); }

function yearStats(y) {
    const P = String(y), its = S.items.filter(x => x.d.startsWith(P) && vis(x));
    const gs = its.filter(x => x.t == "g"), is = its.filter(x => x.t == "i");
    const ing = is.reduce((s, x) => s + x.a, 0), gas = gs.reduce((s, x) => s + x.a, 0);
    const byCat = {}; gs.forEach(x => { if (x.c != "Ahorro") byCat[x.c] = (byCat[x.c] || 0) + x.a; });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const mo = Array.from({ length: 12 }, () => ({ i: 0, g: 0, n: 0 }));
    its.forEach(x => { const k = +x.d.slice(5, 7) - 1; if (x.t == "i") { mo[k].i += x.a; mo[k].n++; } else if (x.t == "g") { mo[k].g += x.a; mo[k].n++; } });
    const act = mo.map((v, i) => ({ i, net: v.i - v.g, g: v.g, n: v.n })).filter(v => v.n > 0);
    const best = act.slice().sort((a, b) => b.net - a.net)[0], priciest = act.slice().sort((a, b) => b.g - a.g)[0];
    const big = gs.filter(x => x.c != "Ahorro" && x.c != "Deudas/Tarjeta").sort((a, b) => b.a - a.a)[0];
    const wd = Array(7).fill(0); gs.forEach(x => { wd[new Date(x.d + "T00:00:00").getDay()] += x.a; });
    const wdTop = wd.indexOf(Math.max(...wd));
    // Racha más larga de días seguidos anotando algo
    const days = [...new Set(its.filter(x => x.t == "g" || x.t == "i").map(x => x.d))].sort();
    let streak = 0, run = 0, prev = null;
    days.forEach(d => { const t = new Date(d + "T00:00:00").getTime(); run = prev !== null && Math.round((t - prev) / 864e5) == 1 ? run + 1 : 1; prev = t; if (run > streak) streak = run; });
    const goals = S.acc.filter(a => !a.f), saved = goals.reduce((s, a) => s + goalAll(a) * (a.u ? S.trm : 1), 0), done = goals.filter(a => a.g && goalAll(a) >= a.g).length;
    return { n: its.filter(x => x.t == "g" || x.t == "i").length, ing, gas, rate: ing > 0 ? (ing - gas) / ing : null, cats, best, priciest, big, wdTop, wdV: wd[wdTop], streak, ndays: days.length, goals: goals.length, saved, done };
}

function yearText(y) {
    const s = yearStats(y); if (!s.n) return "";
    return "Mi año " + y + " en Mi Plata\n"
        + "• Ingresos: " + fmt(s.ing) + " · Gastos: " + fmt(s.gas) + "\n"
        + (s.rate !== null ? "• Ahorré el " + Math.round(s.rate * 100) + "% de lo que ingresó\n" : "")
        + (s.cats[0] ? "• Categoría estrella: " + s.cats[0][0] + " (" + fmt(s.cats[0][1]) + ")\n" : "")
        + (s.best ? "• Mi mejor mes: " + MES[s.best.i].toLowerCase() + "\n" : "")
        + "• Racha más larga anotando: " + s.streak + (s.streak == 1 ? " día" : " días");
}
function yrShare() {
    const t = yearText(yrSel); if (!t) return;
    if (navigator.share) navigator.share({ title: "Mi año en Mi Plata", text: t }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => showToast("Resumen copiado")).catch(() => showToast("No se pudo copiar", true));
}

function vYear() {
    const y = yrSel, s = yearStats(y);
    const nav = `<div class="flex items-center justify-between">
        <button onclick="yrGo(-1)" aria-label="Año anterior" class="nav-btn"><i class="fa-solid fa-chevron-left text-xs"></i></button>
        <b class="text-[17px] text-slate-800 dark:text-white">${y}</b>
        <button onclick="yrGo(1)" aria-label="Año siguiente" class="nav-btn"><i class="fa-solid fa-chevron-right text-xs"></i></button></div>`;
    if (!s.n) return nav + `<section class="${CARD} p-5">${emptyUI("fa-wand-magic-sparkles", "#AF52DE", "Aún no hay nada de " + y, "Anota tus movimientos y aquí aparecerá el resumen de tu año: tu categoría estrella, tu mejor mes y tu racha.", "Anotar un movimiento", "openMov()")}</section>`;
    const card = (bg, ic, kick, big, sub) => `<div class="yr-card" style="background:${bg}">
        <div><span class="yr-ic"><i class="fa-solid ${ic}"></i></span><p class="text-[11px] uppercase tracking-widest opacity-80 mt-4">${kick}</p></div>
        <div><p class="yr-big">${big}</p><p class="text-sm opacity-90 mt-2 leading-snug">${sub}</p></div></div>`;
    const C = [];
    C.push(card("linear-gradient(160deg, rgb(var(--p-500)), rgb(var(--s-700)))", "fa-wand-magic-sparkles", "Tu año " + y, fmt(s.gas), "gastaste en total. Ingresaste " + fmt(s.ing) + (s.rate !== null ? (s.rate >= 0 ? " y te quedó el " + Math.round(s.rate * 100) + "%." : " y gastaste más de lo que entró.") : ".")));
    if (s.cats[0]) C.push(card("linear-gradient(160deg,#FF9500,#FF3B30)", "fa-crown", "Tu categoría estrella", esc(s.cats[0][0]), fmt(s.cats[0][1]) + (s.gas > 0 ? " · el " + Math.round(s.cats[0][1] / s.gas * 100) + "% de tus gastos" : "") + (s.cats[1] ? ". Le sigue " + esc(s.cats[1][0]) + "." : "")));
    if (s.big) C.push(card("linear-gradient(160deg,#AF52DE,#5856D6)", "fa-bolt", "Tu gasto más grande", fmt(s.big.a), esc(s.big.n || s.big.c) + " · " + dmy(s.big.d).slice(0, 5)));
    if (s.best) C.push(card("linear-gradient(160deg,#34C759,#248A3D)", "fa-medal", "Tu mejor mes", MES[s.best.i], (s.best.net >= 0 ? "Te sobraron " : "Quedaste en ") + fmt(s.best.net) + " después de gastar." + (s.priciest && s.priciest.i != s.best.i ? " El más caro fue " + MES[s.priciest.i].toLowerCase() + " (" + fmt(s.priciest.g) + ")." : "")));
    if (s.wdV > 0) C.push(card("linear-gradient(160deg,#007AFF,#5AC8FA)", "fa-calendar-day", "Tu día de gastar", "Los " + DIAS_SEM[s.wdTop], "Es cuando más sale plata: " + fmt(s.wdV) + " en el año."));
    C.push(card("linear-gradient(160deg,#FF2D55,#AF52DE)", "fa-fire", "Tu racha", s.streak + (s.streak == 1 ? " día" : " días"), "seguidos anotando. Anotaste " + s.n + " movimientos en " + s.ndays + " días distintos."));
    if (s.goals) C.push(card("linear-gradient(160deg,#30B0C7,#34C759)", "fa-piggy-bank", "Tus metas", fmt(s.saved), "ahorrados entre " + s.goals + (s.goals == 1 ? " meta" : " metas") + (s.done ? " · " + s.done + (s.done == 1 ? " lograda 🎉" : " logradas 🎉") : "") + "."));
    return `${nav}
        <div class="yr-row no-scrollbar">${C.join("")}</div>
        <p class="text-center text-[11px] text-slate-400 -mt-1"><i class="fa-solid fa-hand-pointer mr-1"></i>Desliza para ver más</p>
        <button onclick="yrShare()" class="w-full py-3 rounded-2xl bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold"><i class="fa-solid fa-share-nodes mr-2"></i>Compartir mi resumen</button>
        <p class="text-[11px] text-slate-400 text-center">Se calcula con lo que anotaste en ${y}. Las cuentas que ocultes en Ajustes no cuentan.</p>`;
}

// Tarjeta de Inicio que muestra un adelanto del resumen del año y lleva a él. Se puede plegar (queda guardado, como las demás secciones de Inicio).
// Si aún no hay movimientos este año, no aparece.
function yearTeaser() {
    const y = new Date().getFullYear(), s = yearStats(y); if (!s.n) return "";
    const bits = [s.cats[0] ? "⭐ " + esc(s.cats[0][0]) : "", s.streak > 1 ? "🔥 " + s.streak + " días seguidos" : "", s.best ? "🏅 " + MES[s.best.i] : ""].filter(Boolean);
    const go = "goTab(" + N.indexOf("Resumen") + ")";
    const head = `<span class="yt-chip">Nuevo · Tu año ${y}</span><h3 class="yt-title">Tu año en Mi Plata</h3>`;
    const peek = `<p class="yt-sub">Gastaste <b>${fmt(s.gas)}</b> · toca para desplegar</p>`;
    const body = `<div class="yt-body" role="button" tabindex="0" aria-label="Ver el resumen de tu año" onclick="${go}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${go}}">
        <div class="yt-txt">
            <p class="yt-sub">Gastaste <b>${fmt(s.gas)}</b> este año${s.rate !== null && s.rate > 0 ? " y te quedó el <b>" + Math.round(s.rate * 100) + "%</b>" : ""}. Mira qué descubrimos.</p>
            ${bits.length ? `<div class="yt-bits">${bits.map(b => `<span>${b}</span>`).join("")}</div>` : ""}
            <span class="yt-go">Ver mi resumen <i class="fa-solid fa-arrow-right"></i></span>
        </div>
        <div class="yt-stack" aria-hidden="true">
            <i style="background:linear-gradient(160deg,#34C759,#248A3D);--r:-14deg;left:0;top:14px"><b class="fa-solid fa-medal"></b></i>
            <i style="background:linear-gradient(160deg,#FF9500,#FF3B30);--r:-2deg;left:26px;top:4px"><b class="fa-solid fa-crown"></b></i>
            <i style="background:linear-gradient(160deg,#AF52DE,#5856D6);--r:11deg;left:52px;top:16px"><b class="fa-solid fa-bolt"></b></i>
        </div>
    </div>`;
    return colSec("yt", head, peek, body, "yt-sec");
}

// ---------- Guía de bienvenida ----------
const WEL = [
    ["fa-plus", "#007AFF", "Anota en segundos", "Toca el botón + para registrar un gasto o un ingreso. Si lo repites seguido, mantén presionado el movimiento para duplicarlo."],
    ["fa-wallet", "#5856D6", "Cuentas y bolsillos", "Crea tus cuentas (efectivo, Nequi, el banco) y aparta plata en bolsillos sin sacarla de ahí."],
    ["fa-piggy-bank", "#34C759", "Metas que se llenan", "Crea una meta, vincúlala a un bolsillo y mira cuánto llevas y a qué ritmo llegas a tiempo."]
];
let welI = 0;
function paintWel() {
    const w = WEL[welI], last = welI == WEL.length - 1;
    document.getElementById("modalContainer").innerHTML = `
        <div class="flex flex-col items-center text-center py-2">
            <span class="w-20 h-20 rounded-[22px] flex items-center justify-center text-3xl text-white mb-5 shadow-lg" style="background:${w[1]}"><i class="fa-solid ${w[0]}"></i></span>
            <h3 class="text-xl font-bold text-slate-800 dark:text-white">${w[2]}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[17rem] leading-relaxed">${w[3]}</p>
            <div class="flex gap-1.5 my-5">${WEL.map((_, i) => `<i class="w-2 h-2 rounded-full ${i == welI ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}"></i>`).join("")}</div>
            <button onclick="welNext()" class="w-full py-3 rounded-2xl bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-sm">${last ? "Empezar" : "Siguiente"}</button>
            ${last ? "" : `<button onclick="welDone()" class="mt-3 text-xs text-slate-400">Saltar</button>`}
        </div>`;
}
function openWelcome() {
    welI = 0; clearTimeout(modalTimer); modalCancel = null;
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    paintWel();
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
}
function welNext() { if (welI < WEL.length - 1) { welI++; paintWel(); } else welDone(); }
function welDone() { S.th.welcomed = 1; save(); closeModal(); }

// ---------- Confeti al lograr una meta ----------
// goalCheck() se llama desde save(): si alguna meta pasó de "en camino" a "lograda", celebra.
const goalsDone = () => S.acc.filter(a => !a.f && a.g && goalAll(a) >= a.g).map(a => a.id);
let _gd = goalsDone();
function goalCheck() {
    const now = goalsDone(), nw = now.filter(id => !_gd.includes(id)); _gd = now;
    if (nw.length) { celebrate(); const a = S.acc.find(x => x.id == nw[0]); try { showToast("¡Meta lograda: " + a.n + "! 🎉"); } catch (e) {} }
}
function celebrate() {
    try { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; buzz(); } catch (e) {}
    const box = document.createElement("div"); box.className = "confetti";
    const cols = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#AF52DE"];
    for (let i = 0; i < 56; i++) {
        const p = document.createElement("i");
        p.style.cssText = "left:" + (Math.random() * 100) + "%;background:" + cols[i % cols.length] + ";animation-delay:" + (Math.random() * .3) + "s;--dx:" + ((Math.random() * 2 - 1) * 120) + "px;--r:" + (Math.random() * 720) + "deg";
        box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2800);
}

// ---------- Accesos directos del ícono (Android/Chrome: mantener presionado el ícono de la app) ----------
function handleLaunch() {
    try {
        const a = new URLSearchParams(location.search).get("a"); if (!a) return;
        history.replaceState(null, "", location.pathname);
        if (a == "gasto" || a == "ingreso") { type = a == "gasto" ? "g" : "i"; openMov(); }
        else if (a == "calendario") goTab(N.indexOf("Calendario"));
        else if (a == "resumen") goTab(N.indexOf("Resumen"));
    } catch (e) {}
}
window.addEventListener("load", () => {
    handleLaunch();
    const vacio = !S.items.length && !S.acc.length && !S.inv.length && !S.cards.length && !S.dbt.length;
    if (vacio && !S.th.welcomed && document.getElementById("generalModal").classList.contains("hidden")) setTimeout(openWelcome, 500);
});
