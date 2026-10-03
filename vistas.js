// ===== Mi Plata · vistas.js =====
// Solo genera HTML. Las acciones (guardar, borrar, modales) están en acciones.js.

const N = ["Inicio", "Ahorro", "Inversión", "Gráficas", "Tarjetas", "Deudas", "Ajustes"];
const V = [vHome, vAho, vInv, vGra, vTar, vDeu, vSet];

// ---------- Piezas de Inicio ----------
function tipsUI(by) {
    const r = tipsList(by), pc = v => r.ing > 0 ? Math.min(100, v / r.ing * 100) : 0;
    const bar = r.ing > 0 ? `
        <div class="mb-4">
            <div class="flex w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <div class="bar-seg bg-indigo-500" style="width:${pc(r.nec)}%"></div><div class="bar-seg bg-amber-400" style="width:${pc(r.gus)}%"></div><div class="bar-seg bg-emerald-500" style="width:${pc(r.aho)}%"></div>
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span><i class="fa-solid fa-circle text-[7px] text-indigo-500 mr-1"></i>Necesidades ${Math.round(r.nec / r.ing * 100)}% <span class="text-slate-400">(ideal 50)</span></span>
                <span><i class="fa-solid fa-circle text-[7px] text-amber-400 mr-1"></i>Gustos ${Math.round(r.gus / r.ing * 100)}% <span class="text-slate-400">(30)</span></span>
                <span><i class="fa-solid fa-circle text-[7px] text-emerald-500 mr-1"></i>Ahorro ${Math.round(r.aho / r.ing * 100)}% <span class="text-slate-400">(20)</span></span>
            </div>
        </div>` : "";
    return `
        <section class="${CARD} p-5">
            <div class="flex items-center justify-between mb-4">
                <div><h3 class="text-sm font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-lightbulb text-amber-400 mr-1.5"></i>Consejos para tu plata</h3>
                <p class="text-xs text-slate-400 mt-0.5">Según tus números de este mes</p></div>
            </div>
            ${bar}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${r.list.map((t, i) => `
                    <div class="tip lift flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800" style="--i:${i}">
                        <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm ${TIP_STY[t.lv][0]} ${t.lv == 0 ? "pulse-ring" : ""}"><i class="fa-solid ${t.ic}"></i></div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-slate-800 dark:text-white leading-snug">${esc(t.t)}</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${esc(t.d)}</p>
                        </div>
                    </div>`).join("")}
            </div>
        </section>`;
}

function nwUI() {
    const n = netWorth();
    const row = (ic, cl, l, v, neg) => `<div class="flex items-center justify-between text-xs py-1.5"><span class="text-slate-500 dark:text-slate-400"><i class="fa-solid ${ic} ${cl} w-4 mr-1.5"></i>${l}</span><b class="${neg ? "text-rose-500" : "text-slate-800 dark:text-white"}">${neg && v > 0 ? "-" : ""}${fmt(v)}</b></div>`;
    return `
        <section class="${CARD} p-5">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patrimonio neto</p>
                    <div class="text-3xl font-extrabold tracking-tight mt-1 ${n.tot < 0 ? "text-rose-500" : "text-slate-800 dark:text-white"}">${fmt(n.tot)}</div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Lo que tienes menos lo que debes, hoy (no depende del mes que estés viendo)</p>
                </div>
                <i class="fa-solid fa-scale-balanced text-indigo-500 text-lg"></i>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p class="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mb-1">Tienes · ${fmt(n.act)}</p>
                    ${row("fa-wallet", "text-indigo-500", "Billeteras y bancos", n.w)}
                    ${row("fa-piggy-bank", "text-emerald-500", "Ahorros y metas", n.sv)}
                    ${row("fa-chart-line", "text-violet-500", "Inversiones", n.iv)}
                </div>
                <div>
                    <p class="text-[10px] uppercase tracking-wider text-rose-500 font-bold mb-1">Debes · ${fmt(n.pas)}</p>
                    ${row("fa-credit-card", "text-amber-500", "Tarjetas (capital pendiente)", n.cd, 1)}
                    ${row("fa-hand-holding-dollar", "text-rose-500", "Deudas", n.db, 1)}
                </div>
            </div>
        </section>`;
}

function fltSummary(m) {
    const tile = (l, v, cl) => `<div class="flex-1 min-w-0 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"><span class="text-[10px] uppercase tracking-wider text-slate-400 block truncate">${l}</span><b class="text-sm ${cl || ""}">${v}</b></div>`;
    const nm = ym(cur);
    let t = "";
    if (flt.k == "w") {
        const w = WH[flt.v], ws = m.filter(x => !x.k && x.w == w);
        t = tile("Saldo actual", fmt(bal(w, nm))) + tile("Ingresos", "+" + fmt(sum(ws, x => x.t == "i")), "text-emerald-500") + tile("Salidas", fmt(sum(ws, x => x.t == "g" || x.t == "p")));
    } else if (flt.k == "cards") {
        const cs = S.cards.filter(c => !(S.hide || {})[c.n]);
        if (!cs.length) return `<p class="text-xs text-slate-400 mb-3">Aún no tienes tarjetas registradas.</p>`;
        let tc = 0, tu = 0;
        cs.forEach(c => { if (c.c) { tc += c.c; tu += cardUse(c, nm).used; } });
        const pc = tc ? tu / tc * 100 : 0;
        t = tile("Compras del mes", fmt(sum(m, x => !!x.k))) + tile("Cuota por pagar", fmt(cs.reduce((a, c) => a + cardDue(c, nm), 0)), "text-indigo-500") + tile("Cupo utilizado", tc ? Math.round(pc) + "%" : "—", tc ? useTone(pc).txt : "");
    } else if (flt.k == "c") {
        const c = S.cards.find(c => c.id == flt.v); if (!c) return "";
        const cu = cardUse(c, nm);
        t = tile("Compras del mes", fmt(sum(m, x => x.k == c.n))) + tile("Cuota a pagar", fmt(cardDue(c, nm)), "text-indigo-500") + tile("Cupo utilizado", c.c ? Math.round(cu.raw) + "%" : "—", c.c ? useTone(cu.raw).txt : "");
    }
    return t ? `<div class="flex gap-2 mb-3">${t}</div>` : "";
}

function fltUI(m) {
    const chip = (on, ic, lbl, act, sm) => `<button onclick="${act}" class="shrink-0 ${sm ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"} rounded-xl font-semibold transition whitespace-nowrap ${on ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}"><i class="fa-solid ${ic} mr-1.5"></i>${lbl}</button>`;
    const nom = ["Efectivo", "Cuenta de ahorros", "Billetera digital"], ics = ["fa-money-bill-wave", "fa-building-columns", "fa-mobile-screen"];
    const inCards = flt.k == "cards" || flt.k == "c";
    const row1 = chip(flt.k == "all", "fa-layer-group", "Todos", "setFlt('all')") + WH.map((w, i) => chip(flt.k == "w" && flt.v == i, ics[i], nom[i], `setFlt('w',${i})`)).join("") + chip(inCards, "fa-credit-card", "Tarjetas", "setFlt('cards')");
    const row2 = inCards && S.cards.length ? `<div class="subchips flex gap-2 overflow-x-auto no-scrollbar pb-1 mt-2">${chip(flt.k == "cards", "fa-layer-group", "Todas", "setFlt('cards')", 1)}${S.cards.map(c => chip(flt.k == "c" && flt.v == c.id, "fa-credit-card", esc(c.n), `setFlt('c',${c.id})`, 1)).join("")}</div>` : "";
    return `<div class="mb-3"><div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">${row1}</div>${row2}</div>${fltSummary(m)}`;
}

// Lista de movimientos (se redibuja sola mientras escribes en el buscador)
function movListHTML() {
    const rows = baseItems().filter(fltMatch).filter(matchQ).sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id);
    if (!rows.length) return '<p class="text-xs text-slate-400 text-center py-4">' + (flt.k != "all" || sqry ? "No hay movimientos con este filtro." : "Anota tu primer movimiento abajo.") + '</p>';
    const head = sqry || sall ? (() => {
        const g = rows.filter(x => x.t == "g").reduce((s, x) => s + x.a, 0), i = rows.filter(x => x.t == "i").reduce((s, x) => s + x.a, 0);
        return `<p class="text-[11px] text-slate-400 pb-2">${rows.length} resultado${rows.length == 1 ? "" : "s"} · gastos ${fmt(g)} · ingresos ${fmt(i)}</p>`;
    })() : "";
    return head + rows.map(x => {
        const r = rate(x);
        return `
        <div class="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="min-w-0 flex-1 pr-2">
                <strong class="text-sm font-semibold text-slate-800 dark:text-white block truncate">${esc(x.n || x.c)}</strong>
                <small class="text-xs text-slate-400">${x.n ? esc(x.c) + " · " : ""}${x.d.slice(8)}/${x.d.slice(5, 7)}${sall ? "/" + x.d.slice(2, 4) : ""}${x.k ? " · 💳 " + esc(x.k) : ""}${x.sav ? " · 🎯 " + esc((S.acc.find(a => a.id == x.sav) || {}).n || "meta borrada") : ""}${x.w ? " · " + esc(x.w) : ""}${x.q > 1 ? " · " + x.q + " cuotas de " + fmt(pmt(x.a, x.q, r)) + (r > 0 ? " (con interés)" : "") : ""}${x.s ? " · fuera del resumen" : ""}</small>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-sm font-bold ${x.t == "i" ? "text-emerald-500" : "text-slate-800 dark:text-white"}">${x.t == "i" ? "+" : x.t == "tr" ? "↔ " : "-"}${fmt(x.a)}</span>
                <button onclick="editM(${x.id})" class="text-slate-400 hover:text-indigo-600 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
                <button onclick="delMovItem(${x.id})" class="text-slate-400 hover:text-rose-600 p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join("");
}

function destUI() {
    const act = S.acc.filter(a => !a.f), o = [["", "Solo ingreso: queda en la billetera"]];
    if (S.cards.length) o.push(["card", "Pagar una tarjeta"]);
    if (act.length) o.push(["save", "Meter a una meta de ahorro que ya tengo"]);
    if (S.dbt.length) o.push(["debt", "Pagar una deuda"]);
    if (o.length < 2) return "";
    return `<label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Este ingreso va para</label>
        <select id="dest" onchange="setDest(this.value)" class="${INP}">${o.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>
        <select id="payCard" class="${INP} hidden">${S.cards.map(c => `<option>${esc(c.n)}</option>`).join("")}</select>
        <select id="saveAcc" class="${INP} hidden">${act.map(a => `<option value="${a.id}">${esc(a.n)}${a.u ? " (USD)" : ""}</option>`).join("")}</select>
        <select id="debtSel" class="${INP} hidden">${S.dbt.map(d => `<option value="${d.id}">${esc(d.n)} · debes ${fmt(dbtLeft(d))}</option>`).join("")}</select>
        <input id="destAmt" inputmode="numeric" placeholder="¿Cuánto de este ingreso? (vacío = todo o la cuota)" oninput="fa(this)" class="${INP} hidden" autocomplete="off">`;
}

function bkUI() {
    if (!bkDue()) return "";
    const d = bkDaysAgo();
    return `
        <section class="${CARD} p-4 !border-amber-300 dark:!border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5">
            <div class="flex items-start gap-3">
                <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><i class="fa-solid fa-cloud-arrow-down"></i></div>
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-slate-800 dark:text-white">${d === null ? "Aún no has hecho una copia de seguridad" : "Tu última copia fue hace " + d + " días"}</p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Tus datos viven solo en este celular. Si lo pierdes, lo formateas o borras el navegador, se van con él. Descarga la copia y guárdala en Drive o envíatela por WhatsApp.</p>
                    <div class="flex gap-2 mt-3">
                        <button onclick="downloadBackup()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20">Descargar copia</button>
                        <button onclick="snoozeBackup()" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Recordarme luego</button>
                    </div>
                </div>
            </div>
        </section>`;
}

function dailyUI(disp) {
    const dy = dailyInfo(disp);
    if (!dy) return "";
    const over = !dy.none && dy.rest < 0;
    let lbl = "Hoy puedes gastar", val = fmt(Math.max(0, dy.rest)), sub, red = false;
    if (dy.none) {
        val = fmt(0); red = true;
        sub = "Ya no te queda disponible para lo que resta del mes" + (dy.spent > 0 ? " · hoy llevas " + fmt(dy.spent) : "");
    } else if (over) {
        lbl = "Hoy te pasaste por"; val = fmt(-dy.rest); red = true;
        sub = dy.left > 1 ? "Para los " + (dy.left - 1) + (dy.left == 2 ? " día que sigue" : " días que siguen") + " quedan ≈ " + fmt(dy.later) + " por día" : "";
    } else {
        sub = "≈ " + fmt(dy.perDay) + " por día · " + (dy.left == 1 ? "último día del mes" : "quedan " + dy.left + " días");
    }
    return `
        <div class="mt-4 p-3 rounded-2xl bg-white/10 flex items-center justify-between gap-3">
            <div class="min-w-0">
                <small class="text-[10px] text-indigo-200 block uppercase">${lbl}</small>
                <b class="text-xl font-extrabold ${red ? "text-rose-300" : ""}">${val}</b>
            </div>
            <div class="text-right text-[11px] text-indigo-200 leading-snug">${sub}${dy.fixed > 0 ? `<br>ya descontados ${fmt(dy.fixed)} de gastos fijos por venir` : ""}</div>
        </div>`;
}

function projUI(disp) {
    const p = monthProjection(disp);
    if (!p) return "";
    const box = "mt-3 p-3 rounded-2xl bg-white/10 flex items-center justify-between gap-3";
    if (p.few) return `<div class="${box}"><div class="text-[11px] text-indigo-200 leading-snug"><i class="fa-solid fa-chart-line mr-1.5"></i>Proyección del mes: registra tus gastos unos días más y te diré cómo vas a cerrar.</div></div>`;
    const bad = p.end < 0;
    let sub;
    if (p.left == 0) sub = "Hoy es el último día del mes";
    else if (p.room <= 0) sub = "Ya no te alcanza para lo que resta del mes, ni sin gastar más";
    else if (bad) sub = "Gastas ≈ " + fmt(p.pace) + " por día. Para cerrar en $0 baja a ≈ " + fmt(p.fit) + " por día";
    else sub = "Gastas ≈ " + fmt(p.pace) + " por día · tu tope es ≈ " + fmt(p.fit) + " por día";
    return `
        <div class="${box}">
            <div class="min-w-0">
                <small class="text-[10px] text-indigo-200 block uppercase"><i class="fa-solid fa-chart-line mr-1"></i>${bad ? "Te faltarían para cerrar el mes" : "A este ritmo terminas el mes con"}</small>
                <b class="text-xl font-extrabold ${bad ? "text-rose-300" : ""}">${fmt(bad ? -p.end : p.end)}</b>
            </div>
            <div class="text-right text-[11px] text-indigo-200 leading-snug">${sub}<br><span class="opacity-80">sin contar compras con tarjeta${p.fixed > 0 ? "; ya descontados " + fmt(p.fixed) + " de gastos fijos por venir" : ""}</span></div>
        </div>`;
}

function recUI() {
    const P = recPend();
    if (!P.length) return "";
    return `
        <section class="${CARD} p-4 !border-amber-300 dark:!border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5">
            <div class="flex items-start gap-3">
                <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-slate-800 dark:text-white">Confirma tus gastos fijos de este mes</p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Su valor cambia cada mes. Escribe cuánto llegó (te dejé el del mes pasado). Mientras no lo confirmes, ese valor ya se descuenta de lo que te queda para gastar.</p>
                    <div class="space-y-2 mt-3">
                        ${P.map(r => `
                        <div class="flex items-center gap-2">
                            <div class="min-w-0 flex-1"><b class="text-xs text-slate-800 dark:text-white block truncate">${esc(r.n)}</b><small class="text-[10px] text-slate-400">día ${r.day} · ${esc(r.c)}</small></div>
                            <input id="rc${r.id}" inputmode="numeric" value="${Math.round(r.a).toLocaleString("es-CO")}" oninput="fa(this)" onkeydown="if(event.key==='Enter')confirmRec(${r.id})" class="w-28 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right text-slate-800 dark:text-white">
                            <button onclick="confirmRec(${r.id})" class="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Listo</button>
                            <button onclick="skipRec(${r.id})" title="Omitir este mes" class="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs"><i class="fa-solid fa-forward"></i></button>
                        </div>`).join("")}
                    </div>
                </div>
            </div>
        </section>`;
}

// ---------- Inicio ----------
function vHome() {
    if (flt.k == "c" && !S.cards.some(c => c.id == flt.v)) flt = { k: "cards", v: null };
    const m = mon(), ing = sum(m, x => x.t == "i"), aho = svm(), gas = sum(m, x => x.t == "g"), sob = ing - gas - aho;
    const cats = (type == "g" ? G.filter(x => x[0] != "Ahorro").map(x => x[0]) : I).map(c => `<option>${c}</option>`).join("") + (type == "g" ? '<option value="__new">＋ Nueva categoría…</option>' : "");
    const by = G.map(([c]) => [c, sum(m, x => x.t == "g" && x.c == c && !x.s)]).filter(x => x[1] > 0 || budOf(x[0], ym(cur))).sort((a, b) => b[1] - a[1]), mx = (by[0] ? by[0][1] : 1) || 1;

    const hasW = S.items.some(x => x.w) || Object.keys(S.ini).length > 0, nm = ym(cur);
    const have = hasW ? WH.filter(w => !(S.hide || {})[w]).reduce((s, w) => s + bal(w, nm), 0) : sob;
    const due = S.cards.filter(c => !(S.hide || {})[c.n]).reduce((s, c) => s + (nm == ym(new Date()) ? cardSoon(c) : cardDue(c, nm)), 0);
    // Apartado = lo ahorrado + el rendimiento ganado hasta hoy (el rendimiento solo se suma en el mes actual: de meses pasados no hay foto)
    const svt = S.acc.reduce((s, a) => s + (svb(a.id, nm) + (nm == ym(new Date()) ? Math.max(0, yieldOf(a.id, a.r)) : 0)) * (a.u ? S.trm : 1), 0), disp = have - due;
    const P = invPortfolio(), invT = P.T, invC = P.C;
    const totAcc = S.acc.filter(a => !a.f).reduce((s, a) => s + goalTotal(a) * (a.u ? S.trm : 1), 0);

    const MT = S.acc.filter(a => !a.f).map(a => {
        const t = goalTotal(a), p = a.g ? Math.min(100, t / a.g * 100) : 0, gi = goalInfo(a);
        const tag = gi && !gi.done ? `<span class="${gi.late ? "text-rose-500" : gi.days <= 30 || !gi.ok ? "text-amber-500" : "text-slate-400"} ml-1">· ${gi.late ? "venció" : gi.days + " d"}</span>` : "";
        return `<div class="mb-3 last:mb-0"><div class="flex justify-between text-xs mb-1 font-medium"><span>${esc(a.n)}${tag}</span><span>${fm(a, t)}${a.g ? " de " + fm(a, a.g) : ""}</span></div>${a.g ? `<div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden"><div class="bg-emerald-500 h-full rounded-full" style="width:${p}%"></div></div>` : ""}</div>`;
    }).join("") || '<p class="text-xs text-slate-400 text-center py-2">Crea metas en la pestaña Ahorro.</p>';

    const sel = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white";
    return `
        ${bkUI()}
        ${recUI()}
        <section class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 rounded-3xl shadow-xl shadow-indigo-500/10 flex flex-col justify-between">
            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none float-slow"></div>
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-indigo-200">Disponible para gastar</p>
                    <h2 class="text-3xl font-extrabold mt-1 tracking-tight ${disp < 0 ? "text-rose-300" : ""}">${fmt(disp)}</h2>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="go(-1)" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold transition">‹</button>
                    <span class="text-xs font-semibold capitalize">${cur.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}</span>
                    <button onclick="go(1)" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold transition">›</button>
                </div>
            </div>
            ${dailyUI(disp)}
            ${projUI(disp)}
            <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                <div><small class="text-[10px] text-indigo-200 block uppercase">En mano</small><b class="text-xs sm:text-sm font-bold">${fmt(have)}</b></div>
                <div><small class="text-[10px] text-indigo-200 block uppercase">Tarjetas</small><b class="text-xs sm:text-sm font-bold">${fmt(due)}</b></div>
                <div><small class="text-[10px] text-indigo-200 block uppercase">Apartado</small><b class="text-xs sm:text-sm font-bold">${fmt(svt)}</b></div>
            </div>
        </section>

        <button onclick="openSim()" class="${CARD} w-full p-4 flex items-center gap-3 text-left hover:border-indigo-500 transition lift">
            <div class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"><i class="fa-solid fa-circle-question"></i></div>
            <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-slate-800 dark:text-white">¿Puedo permitírmelo?</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Simula una compra y mira cómo cambia tu disponible antes de hacerla</p>
            </div>
            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
        </button>

        ${nwUI()}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div onclick="goTab(1)" class="${CARD} p-4 cursor-pointer hover:border-indigo-500 transition lift">
                <div class="flex justify-between items-center mb-1"><span class="text-xs font-semibold text-slate-500">Ahorros y Metas</span><i class="fa-solid fa-piggy-bank text-indigo-500"></i></div>
                <h4 class="text-lg font-bold text-slate-800 dark:text-white mb-2">${fmt(totAcc)}</h4>
                ${MT}
            </div>
            <div onclick="goTab(2)" class="${CARD} p-4 cursor-pointer hover:border-indigo-500 transition lift">
                <div class="flex justify-between items-center mb-1"><span class="text-xs font-semibold text-slate-500">Inversiones</span><i class="fa-solid fa-chart-line text-emerald-500"></i></div>
                <h4 class="text-lg font-bold text-slate-800 dark:text-white">${show(invT)}</h4>
                <p class="text-xs ${invT >= invC ? "text-emerald-500" : "text-rose-500"} mt-1 font-semibold">${invT >= invC ? "+" : ""}${fmt(invT - invC)} sobre lo invertido${P.ann !== null ? " · " + pct1(P.ann) + " anual" : ""}</p>
            </div>
        </div>

        ${tipsUI(by)}

        <section class="${CARD} p-5">
            <div class="flex justify-between items-center mb-3"><h3 class="text-sm font-bold text-slate-800 dark:text-white">Anotar Movimiento</h3><button onclick="newTransfer()" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">↔ Transferir</button></div>
            <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                <button type="button" onclick="setType('g')" class="py-2 rounded-xl text-xs font-bold transition ${type == 'g' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}">Gasto</button>
                <button type="button" onclick="setType('i')" class="py-2 rounded-xl text-xs font-bold transition ${type == 'i' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}">Ingreso</button>
            </div>
            <div class="space-y-3">
                <input id="amt" inputmode="numeric" placeholder="Monto en pesos" oninput="fa(this);cuotaPreview();metaPreview()" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500" autocomplete="off">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select id="cat" onchange="catChange(this)" class="${sel}">${cats}</select>
                    <input id="date" type="date" value="${today()}" class="${sel}">
                </div>
                ${type == "g" ? `
                    <select id="cardSel" onchange="togCardOpts()" class="${sel}">
                        <optgroup label="Billetera">${WH.map(x => `<option>${esc(x)}</option>`).join("")}</optgroup>
                        ${S.cards.length ? `<optgroup label="Tarjeta">${S.cards.map(c => `<option>${esc(c.n)}</option>`).join("")}</optgroup>` : ""}
                        ${S.acc.filter(a => !a.f).length ? `<optgroup label="Meta de ahorro">${S.acc.filter(a => !a.f).map(a => `<option value="meta:${a.id}">🎯 ${esc(a.n)}</option>`).join("")}</optgroup>` : ""}
                    </select>
                    <div id="cardOpts" class="space-y-3 hidden">
                        <input id="cq" inputmode="numeric" placeholder="Cuotas (ej. 3)" oninput="cuotaPreview()" class="${sel}">
                        <select id="ci" onchange="cuotaPreview()" class="${sel}"><option>Con la tasa de la tarjeta</option><option>Sin interés</option></select>
                        <p id="cqPrev" class="text-[11px] text-indigo-500 font-semibold min-h-[14px]"></p>
                    </div>
                    <p id="metaPrev" class="text-[11px] text-indigo-500 font-semibold min-h-[14px]"></p>` : `
                    <select id="whSel" class="${sel}">${WH.map(w => `<option>${w}</option>`).join("")}</select>${destUI()}`}
                <input id="note" placeholder="Nota o descripción (opcional)" class="${sel}" autocomplete="off">
                <p class="text-rose-500 text-xs" id="msg"></p>
                <button onclick="addMov()" class="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition">Guardar ${type == "g" ? "Gasto" : "Ingreso"}</button>
            </div>
        </section>

        <section class="${CARD} p-5">
            <h3 class="text-sm font-bold text-slate-800 dark:text-white">En qué se va la plata</h3>
            <p class="text-[11px] text-slate-400 mt-0.5 mb-3">Toca una categoría para ver sus compras y filtrar por fechas</p>
            <div class="space-y-3">
                ${by.map(([c, v]) => {
                    const bi = budInfo(c, ym(cur)), b = bi.tot, r = b ? v / b : v / mx;
                    return `<div class="text-xs cursor-pointer rounded-xl -mx-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition" role="button" tabindex="0" onclick="openCat('${esc(c)}')" onkeydown="if(event.key==='Enter')openCat('${esc(c)}')" title="Ver las compras de ${esc(c)}">
                        <div class="flex justify-between mb-1 font-medium"><span>${esc(c)}<i class="fa-solid fa-chevron-right text-[8px] text-slate-300 ml-1.5"></i></span><span>${fmt(v)}${b ? " de " + fmt(b) : ""}</span></div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden"><div class="h-full rounded-full ${b && r >= 1 ? "bg-rose-500" : b && r >= 0.8 ? "bg-amber-500" : "bg-indigo-600"}" style="width:${Math.min(100, r * 100)}%"></div></div>${b && (bi.carry > 0 || bi.ov) ? `<div class="text-[10px] text-slate-400 mt-1">${[bi.ov ? "ajustado solo este mes" : "", bi.carry > 0 ? "incluye " + fmt(bi.carry) + " que sobraron del mes anterior" : ""].filter(Boolean).join(" · ")}</div>` : ""}
                    </div>`;
                }).join("") || '<p class="text-xs text-slate-400 text-center py-4">Aún no hay gastos este mes.</p>'}
            </div>
        </section>

        <section class="${CARD} p-5">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-sm font-bold text-slate-800 dark:text-white">Movimientos ${sall ? "de todos los meses" : "del mes"}</h3>
            </div>
            ${fltUI(m)}
            <div class="relative mb-2">
                <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input id="q" placeholder="Buscar por nota, categoría, monto, tarjeta…" value="${esc(sqry)}" oninput="setQ(this.value)" class="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white" autocomplete="off">
                ${sqry ? `<button onclick="clearQ()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"><i class="fa-solid fa-xmark"></i></button>` : ""}
            </div>
            <label class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-3"><input type="checkbox" ${sall ? "checked" : ""} onchange="togAll(this.checked)" class="w-3.5 h-3.5 accent-indigo-600">Buscar en todos los meses</label>
            <div id="movList" class="space-y-1">${movListHTML()}</div>
        </section>
    `;
}

// ---------- Ahorro ----------
function arcUI() {
    const r = S.acc.filter(a => a.f).map(a => `<div class="flex items-center justify-between p-3 ${CARD} mb-2 text-xs"><span class="font-medium truncate pr-2">${esc(a.n)} · ${fm(a, goalTotal(a))}</span><span class="flex gap-3 shrink-0"><button onclick="archAcc(${a.id})" class="text-indigo-600 font-semibold">Restaurar</button><button onclick="delAcc(${a.id})" class="text-rose-500 font-semibold">Borrar</button></span></div>`).join("");
    return r ? '<h3 class="text-sm font-bold mt-6 mb-2 text-slate-500">Metas archivadas</h3>' + r : "";
}

function goalBlock(a, p) {
    const gi = goalInfo(a);
    const bar = `<div class="relative w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-1"><div class="bg-emerald-500 h-full rounded-full" style="width:${p}%"></div>${gi && !gi.done && !gi.late && gi.pexp > 0 ? `<div class="goal-marker" style="left:calc(${gi.pexp * 100}% - 1px)" title="Dónde deberías ir hoy"></div>` : ""}</div>`;
    const t = gi ? gi.t : goalTotal(a);
    let info = "";
    if (gi && !gi.done) {
        info = `<div class="mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
            <div class="flex justify-between"><span class="text-slate-400"><i class="fa-regular fa-calendar mr-1"></i>Fecha límite</span><b>${dmy(a.dl)} · ${gi.late ? `<span class="text-rose-500">venció hace ${-gi.days} d</span>` : gi.days == 0 ? "hoy" : "en " + gi.days + " d"}</b></div>
            <div class="flex justify-between"><span class="text-slate-400">Para llegar a tiempo</span><b>${fm(a, gi.perMonth)} al mes</b></div>
            <div class="flex justify-between"><span class="text-slate-400">Ritmo</span>${gi.late ? `<b class="text-rose-500">Faltan ${fm(a, gi.falta)}</b>` : gi.ok ? `<b class="text-emerald-500">Vas al día ✓</b>` : `<b class="text-amber-500">Atrasado por ${fm(a, gi.gap)}</b>`}</div>
        </div>`;
    }
    return { bar, info };
}

function vAho() {
    let T = 0, Y = 0;
    const A = S.acc.filter(a => !a.f).map(a => {
        const s = svb(a.id), y = Math.max(0, yieldOf(a.id, a.r)), gy = goalYield(a);
        T += a.u ? s * S.trm : s; Y += a.u ? y * S.trm : y;
        const t = s + y, p = a.g ? Math.min(100, t / a.g * 100) : 0, gb = goalBlock(a, p);
        return `
            <div class="${CARD} p-5 mb-4">
                <div class="flex justify-between items-center mb-2">
                    <b class="text-sm font-bold text-slate-800 dark:text-white">${esc(a.n)}</b>
                    <span class="text-xs text-slate-400">${a.u ? "USD · " : ""}${a.r ? a.r + "% E.A." : "sin rendimiento"}</span>
                </div>
                <div class="text-2xl font-extrabold text-slate-800 dark:text-white mb-1">${fm(a, t)}</div>
                ${a.u ? `<small class="text-xs text-slate-400 block mb-2">≈ ${fmt(t * S.trm)} (TRM ${fmt(S.trm)})</small>` : ""}
                ${a.r > 0 ? `<div class="grid grid-cols-3 gap-2 mb-1">${[["Hoy", gy.daily], ["Este mes", gy.month], ["Total ganado", gy.total]].map(([l, v]) => `<div class="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10"><span class="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block leading-tight">${l}</span><b class="text-xs text-emerald-600 dark:text-emerald-400">+${fm(a, v)}</b></div>`).join("")}</div><p class="text-[10px] text-slate-400 mb-3"><i class="fa-solid fa-seedling mr-1"></i>Rendimiento estimado, ya incluido en el saldo. Crece cada día con interés compuesto (${tf(a.r)}% E.A.).</p>` : ""}
                ${a.g ? `${gb.bar}<div class="flex justify-between text-[11px] text-slate-400 mb-3"><span>${p.toFixed(0)}% de ${fm(a, a.g)}</span><span>${t >= a.g ? "¡Meta lograda!" : "Faltan " + fm(a, a.g - t)}</span></div>${gb.info}` : ""}
                <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onclick="mov(${a.id}, 1)" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">＋ Meter</button>
                    <button onclick="mov(${a.id}, -1)" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">－ Sacar</button>
                    ${t > 0.5 ? `<button onclick="mov(${a.id}, -1, 1)" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">Sacar todo</button>` : ""}
                    <button onclick="editAcc(${a.id})" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Editar</button>
                    <button onclick="archAcc(${a.id})" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Archivar</button>
                    <button onclick="delAcc(${a.id})" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-rose-500 rounded-xl text-xs font-semibold">Borrar</button>
                </div>
            </div>`;
    }).join("");

    return `
        <section class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl shadow-emerald-500/10 mb-6">
            <small class="text-xs text-emerald-100 font-medium uppercase tracking-wider">Total Ahorrado</small>
            <div class="text-3xl font-extrabold mt-1">${fmt(T + Y)}</div>
            ${Y > 0.5 ? `<p class="text-xs text-emerald-100 mt-1">Incluye ${fmt(Y)} de rendimiento ganado (estimado)</p>` : ""}
        </section>
        <div class="flex justify-between items-center mb-4"><h3 class="text-base font-bold">Mis Metas</h3><button onclick="newAcc()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">+ Nueva meta</button></div>
        ${A || '<p class="text-xs text-slate-400 text-center py-6">Crea tu primera meta de ahorro.</p>'}${arcUI()}
    `;
}

// ---------- Inversión ----------
function vInv() {
    const P = invPortfolio();
    const R = S.inv.map(x => {
        const g = x.v - x.i, tot = x.i ? g / x.i : 0, ann = annOf(x.v, x.i, x.d), days = daysOf(x.d);
        const annTxt = ann !== null
            ? `<span class="${ann >= 0 ? "text-emerald-500" : "text-rose-500"} font-semibold">${pct1(ann)} anual</span>`
            : `<span class="text-slate-400">${days < 30 ? "anual: muy pronto (" + days + " d)" : "sin datos"}</span>`;
        return `
            <div class="p-4 ${CARD} mb-3">
                <div class="flex items-center justify-between">
                    <div class="min-w-0 pr-2">
                        <strong class="text-sm font-semibold text-slate-800 dark:text-white block truncate">${esc(x.n)}</strong>
                        <small class="text-xs text-slate-400">${x.c} · Invertido ${x.c == "USD" ? fu(x.i) : fmt(x.i)}${x.k ? " · " + invLabel(x.k) : ""}</small>
                    </div>
                    <div class="text-right shrink-0">
                        <b class="text-sm font-bold text-slate-800 dark:text-white block">${x.c == "USD" ? fu(x.v) : fmt(x.v)}</b>
                        <small class="text-xs ${g >= 0 ? "text-emerald-500" : "text-rose-500"}">${pct1(tot)} total</small>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div class="text-[11px] text-slate-400">Desde ${dmy(x.d)} · ${days} d · ${annTxt}</div>
                    <div class="flex space-x-2 shrink-0">
                        <button onclick="upInv(${x.id})" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs" title="Actualizar valor"><i class="fa-solid fa-rotate"></i></button>
                        <button onclick="editInv(${x.id})" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="delInv(${x.id})" class="p-2 bg-rose-50 text-rose-600 rounded-xl text-xs" title="Borrar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
    }).join("");

    return `
        <section class="bg-gradient-to-br from-violet-600 to-purple-800 text-white p-6 rounded-3xl shadow-xl shadow-purple-500/10 mb-6">
            <small class="text-xs text-purple-200 font-medium uppercase tracking-wider">Portafolio Total de Inversión</small>
            <div class="text-3xl font-extrabold mt-1">${show(P.T)}</div>
            <p class="text-xs text-purple-100 mt-1">${P.T >= P.C ? "+" : ""}${fmt(P.T - P.C)} sobre lo invertido${P.ann !== null ? ` · ≈ ${pct1(P.ann)} anual (estimado)` : ""}</p>
            <button onclick="togUsd()" class="mt-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold">Ver en ${usd ? "COP" : "USD"}</button>
        </section>
        <div class="${CARD} p-5 mb-6">
            <h3 class="text-sm font-bold mb-3">Tasa de Cambio (TRM) y Moneda</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <input id="trmInput" inputmode="decimal" value="${tf(S.trm)}" class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                <button onclick="setTrmVal()" class="py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs shadow-md">Actualizar TRM</button>
            </div>
        </div>
        <div class="flex justify-between items-center mb-4"><h3 class="text-base font-bold">Mis Inversiones</h3><button onclick="newInv()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">+ Nueva Inversión</button></div>
        ${R || '<p class="text-xs text-slate-400 text-center py-6">Agrega tu primera inversión.</p>'}
        ${rbUI()}
        <p class="text-[11px] text-slate-400 mt-2">El rendimiento anual se calcula con la fecha de inicio y el valor actual, y solo aparece después de 30 días (antes exagera). Es una estimación: no descuenta comisiones ni impuestos.</p>
    `;
}

// ---------- Rebalanceo del portafolio ----------
function rbUI() {
    if (!S.inv.length) return "";
    const inp = ([k, n]) => `<div><label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 truncate">${n} %</label><input inputmode="decimal" value="${tf(S.rb[k] ?? 0)}" onchange="setRb('${k}', this.value)" class="${INP} pct text-right"></div>`;
    return `
        <section class="${CARD} p-5 mt-6">
            <h3 class="text-sm font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-scale-balanced text-violet-500 mr-1.5"></i>Rebalanceo del portafolio</h3>
            <p class="text-[11px] text-slate-400 mt-0.5 mb-3">Elige cuánto quieres en cada tipo de activo. Clasifica cada inversión con el lápiz (campo «Tipo de activo») y aquí verás cuánto comprar o vender.</p>
            <div class="grid grid-cols-3 gap-2 mb-3">${CL.map(inp).join("")}</div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Aporte nuevo (opcional)</label>
            <input id="rbAp" inputmode="numeric" placeholder="Si vas a invertir más y no quieres vender nada" oninput="fa(this);rbCalc()" class="${INP} mb-3" autocomplete="off">
            <div id="rbRes">${rbResUI(0)}</div>
        </section>`;
}
function rbResUI(ap) {
    const r = rebalance(ap);
    if (!r.ok) return `<p class="text-xs text-amber-500 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Tus porcentajes suman ${tf(Math.round(r.sumT * 100) / 100)}%. Deben sumar 100%.</p>`;
    const un = r.un > 0 ? `<p class="text-[11px] text-amber-500 mb-2"><i class="fa-solid fa-circle-info mr-1"></i>${fmt(r.un)} en inversiones sin clasificar no entran en este cálculo.</p>` : "";
    if (!r.tot) return un + '<p class="text-xs text-slate-400 text-center py-3">Clasifica al menos una inversión (lápiz → Tipo de activo) o escribe un aporte para ver la sugerencia.</p>';
    const rows = r.rows.map(x => {
        let act, cl;
        if (r.ap > 0) { act = x.delta > 0.5 ? "Comprar " + fmt(x.delta) : "Nada"; cl = x.delta > 0.5 ? "text-emerald-500" : "text-slate-400"; }
        else if (x.delta > 0.5) { act = "Comprar " + fmt(x.delta); cl = "text-emerald-500"; }
        else if (x.delta < -0.5) { act = "Vender " + fmt(-x.delta); cl = "text-rose-500"; }
        else { act = "En su objetivo ✓"; cl = "text-slate-400"; }
        return `<div class="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
            <div class="min-w-0"><b class="text-slate-800 dark:text-white">${x.n}</b><small class="text-[11px] text-slate-400 block">${fmt(x.cur)} · hoy ${Math.round(x.pct)}% · objetivo ${tf(x.tgt)}%${r.ap > 0 ? " · quedaría " + Math.round(x.apct) + "%" : ""}</small></div>
            <b class="shrink-0 ${cl}">${act}</b></div>`;
    }).join("");
    return `${un}<div>${rows}</div>
        <p class="text-[11px] text-slate-400 mt-2">Sugerencia matemática sobre lo que tienes clasificado (${fmt(r.T)}${r.ap > 0 ? " + aporte " + fmt(r.ap) : ""}). No incluye comisiones ni impuestos por vender, ni es asesoría financiera.</p>`;
}

// ---------- Plan para salir de deudas ----------
function planUI() {
    const ds = debtList();
    if (!ds.length) return "";
    const mins = ds.reduce((s, d) => s + d.min, 0), B = S.dp.b || 0;
    return `
        <section class="${CARD} p-5 mt-6">
            <h3 class="text-sm font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-route text-rose-500 mr-1.5"></i>Plan para salir de deudas</h3>
            <p class="text-[11px] text-slate-400 mt-0.5 mb-3"><b>Avalancha</b> paga primero la de mayor tasa (menos intereses). <b>Bola de nieve</b> paga primero la de menor saldo (logros rápidos). Cuenta solo las deudas de esta pestaña, no las tarjetas. Para que Avalancha tenga sentido, añade la tasa mensual en cada deuda (Editar).</p>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">¿Cuánto puedes pagar al mes en total?</label>
            <input id="dpB" inputmode="numeric" value="${B ? B.toLocaleString("es-CO") : ""}" placeholder="${mins ? "Mínimo: " + fmt(mins) : "Ej. 500.000"}" oninput="fa(this);dpCalc()" onchange="setDp(this.value)" class="${INP} mb-3" autocomplete="off">
            <div id="dpRes">${planResUI(B)}</div>
        </section>`;
}
function planResUI(B) {
    const p = debtPlan(B);
    if (!(p.B > 0)) return '<p class="text-xs text-slate-400 text-center py-3">Escribe cuánto puedes pagar al mes (o registra la cuota mensual de tus deudas) para ver el plan.</p>';
    const n0 = new Date(), when = m => monLabel(ym(new Date(n0.getFullYear(), n0.getMonth() + m, 1)));
    const cell = s => s.done ? `<b class="capitalize">${when(s.months)}</b><small class="text-[10px] text-slate-400 block">${s.months} ${s.months == 1 ? "mes" : "meses"}</small>` : '<b class="text-rose-500">No se paga</b>';
    const intr = s => s.done ? fmt(s.interest) : "—";
    const save = s => s.done && p.mn.done ? fmt(p.mn.interest - s.interest) : "—";
    const both = p.av.done && p.bn.done, diff = both ? p.bn.interest - p.av.interest : 0;
    const best = both && diff > 1 ? "av" : "";
    const head = (t, k) => `<span class="font-bold text-[10px] uppercase tracking-wider ${best == k ? "text-emerald-500" : "text-slate-400"}">${t}${best == k ? " ★" : ""}</span>`;
    const row = (l, a, b, c) => `<div class="grid grid-cols-4 gap-2 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] items-start"><span class="text-slate-400">${l}</span><span class="text-right">${a}</span><span class="text-right">${b}</span><span class="text-right">${c}</span></div>`;
    const names = s => s.order.map(d => d.n).join("|");
    const ord = (t, s) => `<div><p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">${t}</p>${s.order.map((d, i) => `<div class="flex justify-between gap-2 text-xs py-1"><span class="truncate">${i + 1}. ${esc(d.n)}</span><b class="shrink-0 capitalize">${d.paidAt ? when(d.paidAt) : "—"}</b></div>`).join("")}</div>`;
    let note = "";
    if (p.low) note += `<p class="text-[11px] text-amber-500 mb-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Lo que escribiste es menos que la suma de tus cuotas (${fmt(p.mins)}); usé esa suma.</p>`;
    if (!p.rates) note += '<p class="text-[11px] text-slate-400 mb-2">Ninguna deuda tiene tasa registrada, así que ambas estrategias salen con $0 de intereses y solo cambia el orden. Edita cada deuda y añade su tasa mensual para ver la diferencia real.</p>';
    if (p.ds.some(d => !d.min)) note += '<p class="text-[11px] text-slate-400 mb-2">Alguna deuda no tiene cuota mensual: recibe pagos solo cuando le toca por prioridad.</p>';
    const verdict = both && p.rates ? (diff > 1 ? `Avalancha te ahorra ${fmt(diff)} en intereses frente a Bola de nieve.` : "Con tus números las dos estrategias cuestan casi lo mismo: elige la que más te motive.") : "";
    return `${note}
        <div class="grid grid-cols-4 gap-2 pb-2 border-b border-slate-100 dark:border-slate-800"><span></span><span class="text-right">${head("Avalancha", "av")}</span><span class="text-right">${head("Bola de nieve", "bn")}</span><span class="text-right">${head("Solo cuotas", "mn")}</span></div>
        ${row("Libre de deudas", cell(p.av), cell(p.bn), cell(p.mn))}
        ${row("Intereses", intr(p.av), intr(p.bn), intr(p.mn))}
        ${row("Ahorro vs. solo cuotas", save(p.av), save(p.bn), "—")}
        ${verdict ? `<p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3"><i class="fa-solid fa-circle-check mr-1"></i>${verdict}</p>` : ""}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">${names(p.av) == names(p.bn) ? ord("Orden de pago (igual en ambas)", p.av) : ord("Orden · Avalancha", p.av) + ord("Orden · Bola de nieve", p.bn)}</div>
        <p class="text-[11px] text-slate-400 mt-3">Estimado: asume que pagas el total cada mes y que el dinero de una deuda ya pagada pasa a la siguiente. «Solo cuotas» no reasigna nada. Las fechas cuentan desde el próximo mes.</p>`;
}

// ---------- Gráficas ----------
function vGra() {
    const mk = ym(cur), ok = monthKey(cmp);
    const A = catTotals(mk), B = catTotals(ok);
    const rows = G.map(([c], i) => ({ c, a: A[i][1], b: B[i][1] })).filter(r => r.a > 0 || r.b > 0);
    const ta = rows.reduce((s, r) => s + r.a, 0), tb = rows.reduce((s, r) => s + r.b, 0);
    const delta = (a, b) => {
        const d = a - b, cl = d > 0 ? "text-rose-500" : d < 0 ? "text-emerald-500" : "text-slate-400";
        const p = b > 0 ? " (" + (d >= 0 ? "+" : "") + Math.round(d / b * 100) + "%)" : a > 0 ? " (nuevo)" : "";
        return `<span class="${cl} font-semibold">${d > 0 ? "+" : ""}${fmt(d)}${p}</span>`;
    };
    const opts = [[1, "Mes anterior"], [2, "Hace 2 meses"], [3, "Hace 3 meses"], [6, "Hace 6 meses"], [12, "Hace 1 año"]];
    const hasNW = Object.keys(S.nwh).length >= 2;
    return `
        <section class="${CARD} p-5">
            <div class="flex justify-between items-center mb-4"><h3 class="text-sm font-bold">Gastos por categoría</h3>
            <div class="flex items-center space-x-2"><button onclick="go(-1)" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800">‹</button><span class="text-xs font-semibold capitalize">${cur.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}</span><button onclick="go(1)" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800">›</button></div></div>
            <div class="max-w-xs mx-auto"><canvas id="chCat"></canvas></div>
            <p class="text-[11px] text-slate-400 text-center mt-3">Toca una porción para ver esas compras</p>
        </section>

        <section class="${CARD} p-5">
            <div class="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 class="text-sm font-bold">Comparar gastos entre meses</h3>
                <select onchange="setCmp(this.value)" class="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">${opts.map(([v, l]) => `<option value="${v}" ${v == cmp ? "selected" : ""}>${l}</option>`).join("")}</select>
            </div>
            ${rows.length ? `
            <canvas id="chCmp"></canvas>
            <div class="mt-4 text-xs">
                <div class="grid grid-cols-4 gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold"><span>Categoría</span><span class="text-right capitalize">${monLabel(ok)}</span><span class="text-right capitalize">${monLabel(mk)}</span><span class="text-right">Cambio</span></div>
                ${rows.map(r => `<div onclick="openCat('${esc(r.c)}')" class="grid grid-cols-4 gap-2 py-2 border-b border-slate-100 dark:border-slate-800 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><span class="font-medium truncate">${esc(r.c)}</span><span class="text-right">${fmt(r.b)}</span><span class="text-right">${fmt(r.a)}</span><span class="text-right text-[11px]">${delta(r.a, r.b)}</span></div>`).join("")}
                <div class="grid grid-cols-4 gap-2 pt-2 font-bold items-center"><span>Total</span><span class="text-right">${fmt(tb)}</span><span class="text-right">${fmt(ta)}</span><span class="text-right text-[11px]">${delta(ta, tb)}</span></div>
            </div>` : '<p class="text-xs text-slate-400 text-center py-6">No hay gastos en esos dos meses para comparar.</p>'}
        </section>

        <section class="${CARD} p-5"><h3 class="text-sm font-bold mb-4">Ingresos vs gastos (6 meses)</h3><canvas id="chMon"></canvas></section>

        <section class="${CARD} p-5"><h3 class="text-sm font-bold mb-1">Patrimonio neto mes a mes</h3>
            <p class="text-[11px] text-slate-400 mb-4">Se guarda una foto cada vez que usas la app.</p>
            ${hasNW ? '<canvas id="chNW"></canvas>' : '<p class="text-xs text-slate-400 text-center py-6">Aparecerá cuando tengas al menos dos meses de datos.</p>'}
        </section>`;
}

function drawCharts() {
    charts.forEach(c => c.destroy()); charts = [];
    if (typeof Chart == "undefined") return;
    const dark = document.documentElement.classList.contains("dark");
    Chart.defaults.color = dark ? "#94a3b8" : "#64748b";
    // Modo incógnito: sin cifras en los ejes ni en los globos al tocar
    Chart.defaults.plugins.tooltip.enabled = !masked();
    const hy = masked() ? { scales: { y: { ticks: { display: false } } } } : {};
    const m = mon(), by = G.map(([c]) => [c, sum(m, x => x.t == "g" && x.c == c && !x.s)]).filter(x => x[1] > 0);
    charts.push(new Chart(document.getElementById("chCat"), { type: "doughnut", options: { onClick: (ev, els) => { if (els.length) openCat(by[els[0].index][0]); } }, data: { labels: by.map(x => x[0]), datasets: [{ data: by.map(x => x[1]), backgroundColor: by.map((_, i) => [accent(500),accent(500,1,"s"),"#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#64748b","#84cc16","#f97316","#14b8a6","#a855f7","#0ea5e9","#e11d48","#65a30d","#78716c"][i % 16]) }] } }));

    const cc = document.getElementById("chCmp");
    if (cc) {
        const mk = ym(cur), ok = monthKey(cmp), A = catTotals(mk), B = catTotals(ok);
        const idx = G.map((_, i) => i).filter(i => A[i][1] > 0 || B[i][1] > 0);
        charts.push(new Chart(cc, { type: "bar", options: hy, data: { labels: idx.map(i => G[i][0]), datasets: [{ label: monLabel(ok), data: idx.map(i => B[i][1]), backgroundColor: "#94a3b8" }, { label: monLabel(mk), data: idx.map(i => A[i][1]), backgroundColor: accent(500) }] } }));
    }

    const ms = [...Array(6)].map((_, i) => ym(new Date(cur.getFullYear(), cur.getMonth() - 5 + i, 1)));
    const tot = (k, t) => S.items.filter(x => x.d.startsWith(k) && x.t == t && vis(x)).reduce((s, x) => s + x.a, 0);
    charts.push(new Chart(document.getElementById("chMon"), { type: "bar", options: hy, data: { labels: ms, datasets: [{ label: "Ingresos", data: ms.map(k => tot(k, "i")), backgroundColor: "#10b981" }, { label: "Gastos", data: ms.map(k => tot(k, "g")), backgroundColor: accent(500) }] } }));

    const nw = document.getElementById("chNW");
    if (nw) {
        const ks = Object.keys(S.nwh).sort().slice(-12);
        charts.push(new Chart(nw, { type: "line", options: hy, data: { labels: ks, datasets: [{ label: "Patrimonio neto", data: ks.map(k => S.nwh[k]), borderColor: accent(500), backgroundColor: accent(500, .15), fill: true, tension: .3 }] } }));
    }
}

// ---------- Tarjetas ----------
function vTar() {
    const m = monAll(), n = ym(new Date());
    let tc = 0, tu = 0;
    const cardsList = S.cards.map(c => {
        const u = sum(m, x => x.k == c.n), cu = cardUse(c, n), d = dueIn(c.p), tn = useTone(cu.raw), it = cardInt(c, n);
        const pv = lastPct[c.id], ch = pv && (pv.b !== cu.pct || pv.n !== cu.raw);
        const fb = pv && (!anim || ch) ? pv.b : 0, fn = pv && (!anim || ch) ? pv.n : 0;
        lastPct[c.id] = { b: cu.pct, n: cu.raw };
        const pop = cu.ok && lastOk[c.id] === false; lastOk[c.id] = cu.ok;
        if (c.c) { tc += c.c; tu += cu.used; }
        const cn = cardNext(c), owe = cu.cq + cu.atr + cu.ext - cu.ab, late = !cu.ok && owe > 0 && (d < 0 || cu.atrLeft > 0), nd = cn.due > 0 ? daysTo(payDateIn(c.p, cn.m)) : nextPay(c.p), over = cu.ab - (cu.cq + cu.atr + cu.ext);
        return `
            <div class="lift ${CARD} p-5 mb-4">
                <div class="flex justify-between items-center mb-2">
                    <div><b class="text-sm font-bold text-slate-800 dark:text-white">💳 ${esc(c.n)}</b>${c.ir > 0 ? `<span class="text-[11px] text-slate-400 ml-2">${tf(c.ir)}% mensual</span>` : ""}</div>
                    <span class="text-xs font-semibold ${cu.ok ? "text-emerald-500" : late || (cn.due > 0 && nd <= 5) ? "text-rose-500" : "text-slate-400"}">${cu.ok ? `<span class="${pop ? "pop" : ""}">Pagada ✓</span>` : late ? (d < 0 ? "Venció hace " + (-d) + " d" : "Con saldo vencido") : cn.due > 0 ? "Vence en " + nd + " d" : "Sin cuota pendiente"}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div><span class="text-slate-400 block">Compras este mes</span><b>${fmt(u)}</b></div>
                    <div><span class="text-slate-400 block">Cuota a pagar</span><b class="text-indigo-600">${fmt(cu.ok ? 0 : Math.max(0, owe))}</b></div>
                    <div><span class="text-slate-400 block">Abonado este mes</span><b class="text-emerald-600">${fmt(cu.ab)}</b></div>
                    <div><span class="text-slate-400 block">Intereses en la cuota</span><b class="${it > 0 ? "text-amber-500" : ""}">${fmt(it)}</b></div>
                </div>
                ${c.mf > 0 || c.mr > 0 ? `<div class="grid grid-cols-2 gap-2 text-xs mb-4 -mt-1">
                    ${c.mf > 0 ? `<div><span class="text-slate-400 block">Cuota de manejo (${c.mt == "a" ? "anual" : "mensual"})</span><b>${fmt(c.mf)}</b>${cu.fee > 0 ? `<span class="text-[10px] text-amber-500 ml-1.5">va en esta cuota</span>` : ""}</div>` : ""}
                    ${c.mr > 0 ? `<div><span class="text-slate-400 block">Interés de mora (${tf(c.mr)}% mensual)</span><b class="${cu.mora > 0 ? "text-rose-500" : ""}">${fmt(cu.mora)}</b>${cu.mora > 0 ? `<span class="text-[10px] text-rose-400 ml-1.5">estimado</span>` : ""}</div>` : ""}
                </div>` : ""}
                ${(cu.ext > 0 || cu.atrLeft > 0) && !cu.ok ? `<p class="text-[11px] ${cu.atrLeft > 0 ? "text-rose-500" : "text-slate-400"} -mt-2 mb-3">La cuota a pagar incluye ${[cu.atrLeft > 0 ? fmt(cu.atrLeft) + " vencidos de meses anteriores" : "", cu.fee > 0 ? fmt(cu.fee) + " de cuota de manejo" : "", cu.mora > 0 ? fmt(cu.mora) + " de mora" : ""].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " y $1")}.</p>` : ""}
                ${over > 0.5 && !c.paid[n] ? `<p class="text-[11px] text-emerald-600 dark:text-emerald-400 -mt-2 mb-3"><i class="fa-solid fa-circle-check mr-1"></i>Pagaste ${fmt(over)} por encima de la cuota de este mes: se aplica a la cuota siguiente (y lo que sobre, a capital).</p>` : ""}
                ${cn.m != n && cn.due > 0 ? `<p class="text-[11px] text-slate-400 -mt-2 mb-3"><i class="fa-regular fa-calendar mr-1"></i>Próximo pago: <b class="text-slate-600 dark:text-slate-300">${dmy(payDateIn(c.p, cn.m))}</b> · ${fmt(cn.due)}</p>` : ""}
                ${c.c ? `
                <div class="flex items-end justify-between mb-1.5">
                    <div><span class="cupo-pct text-2xl font-extrabold ${tn.txt}" data-from="${fn}" data-to="${cu.raw}">${Math.round(fn)}%</span><span class="text-xs text-slate-400 ml-1.5">del cupo utilizado</span></div>
                    <span class="text-[11px] font-semibold ${tn.txt}">${tn.lbl}</span>
                </div>
                <div class="relative w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2"><div class="cupo-bar ${tn.bar} h-full rounded-full" data-to="${cu.pct}" style="width:${fb}%"></div><div class="absolute top-0 bottom-0 w-px bg-slate-400/70" style="left:30%" title="Ideal: menos del 30%"></div></div>
                <div class="flex justify-between text-[11px] text-slate-400 mb-3">
                    <span>Usado ${fmt(cu.used)}</span><span>Disponible <b class="text-emerald-500">${fmt(cu.avail)}</b></span><span>Cupo ${fmt(c.c)}</span>
                </div>` : `<p class="text-[11px] text-slate-400 mb-3">Esta tarjeta no tiene cupo registrado.</p>`}
                <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onclick="payCard(${c.id})" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">Abonar</button>
                    <button onclick="paidCard(${c.id})" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold">${cu.ok ? "Desmarcar pago" : "Marcar pagada"}</button>
                    <button onclick="openExtract(${c.id})" class="px-3 py-1.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-semibold"><i class="fa-solid fa-receipt mr-1"></i>Extracto</button>
                    <button onclick="editCard(${c.id})" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Editar</button>
                    <button onclick="delCard(${c.id})" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">Borrar</button>
                </div>
            </div>`;
    }).join("");

    const gp = tc ? tu / tc * 100 : 0, gt = useTone(gp);
    const pg = lastPct.all, chg = pg && (pg.b !== Math.min(100, gp) || pg.n !== gp);
    const gfb = pg && (!anim || chg) ? pg.b : 0, gfn = pg && (!anim || chg) ? pg.n : 0;
    lastPct.all = { b: Math.min(100, gp), n: gp };
    const summary = S.cards.length > 1 && tc ? `
        <section class="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-5 rounded-3xl shadow-xl shadow-indigo-500/10 mb-4">
            <div class="flex items-end justify-between">
                <div><small class="text-[10px] text-indigo-200 uppercase tracking-wider block">Cupo total utilizado</small><span class="cupo-pct text-3xl font-extrabold" data-from="${gfn}" data-to="${gp}">${Math.round(gfn)}%</span></div>
                <div class="text-right text-xs"><span class="text-indigo-200 block">Disponible</span><b>${fmt(Math.max(0, tc - tu))}</b></div>
            </div>
            <div class="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-3"><div class="cupo-bar bg-white h-full rounded-full" data-to="${Math.min(100, gp)}" style="width:${gfb}%"></div></div>
            <p class="text-[11px] text-indigo-200 mt-2">${fmt(tu)} de ${fmt(tc)} · ${gt.lbl.toLowerCase()} (ideal: menos del 30%)</p>
        </section>` : "";

    return `
        <div class="flex justify-between items-center mb-4"><h3 class="text-base font-bold">Mis Tarjetas de Crédito</h3><button onclick="newCard()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">+ Agregar tarjeta</button></div>
        ${summary}
        ${cardsList || '<p class="text-xs text-slate-400 text-center py-6">Aún no tienes tarjetas registradas.</p>'}
    `;
}

// ---------- Extracto de una tarjeta (contenido del modal) ----------
function extractUI(c, i, b) {
    const s = stmt(c, i);
    const nw = s.rows.filter(r => r.e == 1), old = s.rows.filter(r => r.e > 1);
    const row = r => {
        const x = r.x;
        return `<div class="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="min-w-0">
                <strong class="text-xs font-semibold text-slate-800 dark:text-white block truncate">${esc(x.n || x.c)}</strong>
                <small class="text-[11px] text-slate-400">${dmy(x.d)}${x.n ? " · " + esc(x.c) : ""}${r.q > 1 ? " · compra de " + fmt(x.a) + " · cuota " + r.e + " de " + r.q : ""}${r.it > 0 ? " · intereses " + fmt(r.it) : ""}</small>
            </div>
            <b class="text-xs shrink-0">${fmt(r.cu)}</b>
        </div>`;
    };
    const line = (l, v, cl) => `<div class="flex justify-between text-xs py-1.5"><span class="text-slate-500 dark:text-slate-400">${l}</span><b class="${cl || ""}">${v}</b></div>`;
    const sec = (t, n, body) => body ? `<div class="mb-4"><p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">${t} · ${n}</p>${body}</div>` : "";
    let badge;
    if (s.open) badge = ["bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400", "Abierto · cierra el " + dmy(s.close).slice(0, 5)];
    else if (s.total <= 0) badge = ["bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", "Sin cuotas"];
    else if (s.pend <= 0) badge = ["bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", "Pagado ✓"];
    else if (s.pay < today()) badge = ["bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400", "Vencido"];
    else badge = ["bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", "Por pagar"];
    const nav = (dis, to, ic) => `<button onclick="openExtract(${c.id}, ${to})" ${dis ? "disabled" : ""} class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold ${dis ? "opacity-30" : ""}">${ic}</button>`;
    return `
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">💳 ${esc(c.n)} · Extracto</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex items-center justify-between gap-2 mb-1">
            ${nav(i <= b.lo, i - 1, "‹")}
            <div class="text-center min-w-0">
                <p class="text-sm font-bold text-slate-800 dark:text-white">Se paga el ${dmy(s.pay)}</p>
                <p class="text-[11px] text-slate-400">Compras del ${dmy(s.from).slice(0, 5)} al ${dmy(s.close).slice(0, 5)} (corte ${dmy(s.close)})</p>
            </div>
            ${nav(i >= b.hi, i + 1, "›")}
        </div>
        <div class="text-center mb-4"><span class="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold ${badge[0]}">${badge[1]}</span></div>
        <div class="grid grid-cols-3 gap-2 mb-4">
            ${[["Compras del corte", fmt(s.news), ""], ["Total del extracto", fmt(s.total), ""], [s.pend > 0 ? "Falta pagar" : "Pagado", fmt(s.pend > 0 ? s.pend : s.paid), s.pend > 0 ? "text-indigo-500" : "text-emerald-500"]].map(([l, v, cl]) => `<div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"><span class="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">${l}</span><b class="text-xs ${cl}">${v}</b></div>`).join("")}
        </div>
        ${s.open ? `<p class="text-[11px] text-slate-400 mb-3"><i class="fa-regular fa-clock mr-1"></i>Este corte todavía está abierto: entran las compras que hagas hasta el ${dmy(s.close)}.</p>` : ""}
        ${sec("Compras de este corte", nw.length, nw.map(row).join(""))}
        ${sec("Cuotas de compras anteriores", old.length, old.map(row).join(""))}
        ${!s.rows.length && !s.fee && !s.mora && !s.atr ? '<p class="text-xs text-slate-400 text-center py-4">No hay compras ni cuotas en este extracto.</p>' : ""}
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            ${line("Suma de cuotas", fmt(s.base))}
            ${Math.abs(s.adj) > 0.5 ? line("Abonos a capital anteriores (acortan el plazo)", fmt(s.adj), "text-emerald-500") : ""}
            ${s.fee > 0 ? line("Cuota de manejo", fmt(s.fee)) : ""}
            ${s.atr > 0 ? line("Vencido de extractos anteriores", fmt(s.atr), "text-rose-500") : ""}
            ${s.mora > 0 ? line("Interés de mora (estimado)", fmt(s.mora), "text-rose-500") : ""}
            ${line("Total del extracto", fmt(s.total), "text-slate-800 dark:text-white")}
            ${s.paid > 0 ? line("Pagos aplicados", "-" + fmt(s.paid), "text-emerald-500") : ""}
        </div>
        <button onclick="closeModal()" class="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">Cerrar</button>`;
}

// ---------- Simulador "¿Puedo permitírmelo?" (contenido del modal) ----------
function simUI() {
    const cats = G.filter(g => g[0] != "Ahorro").map(g => `<option>${esc(g[0])}</option>`).join("");
    const pays = `<optgroup label="Billetera">${WH.map(w => `<option>${esc(w)}</option>`).join("")}</optgroup>${S.cards.length ? `<optgroup label="Tarjeta">${S.cards.map(c => `<option>${esc(c.n)}</option>`).join("")}</optgroup>` : ""}`;
    return `
        <div class="flex justify-between items-center mb-1">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">¿Puedo permitírmelo?</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-[11px] text-slate-400 mb-3">Simula una compra de hoy. No se guarda nada.</p>
        <div class="space-y-2.5">
            <input id="sAmt" inputmode="numeric" placeholder="Valor de la compra" oninput="fa(this);simCalc()" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500" autocomplete="off">
            <div class="grid grid-cols-2 gap-2">
                <select id="sCat" onchange="simCalc()" class="${INP}">${cats}</select>
                <select id="sPay" onchange="simPay()" class="${INP}">${pays}</select>
            </div>
            <div id="sCardOpts" class="grid grid-cols-2 gap-2 hidden">
                <input id="sQ" inputmode="numeric" placeholder="Cuotas (ej. 3)" oninput="simCalc()" class="${INP}" autocomplete="off">
                <select id="sI" onchange="simCalc()" class="${INP}"><option>Con la tasa de la tarjeta</option><option>Sin interés</option></select>
            </div>
        </div>
        <div id="simRes" class="mt-4"></div>
        <button onclick="closeModal()" class="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">Cerrar</button>`;
}

function simResUI(r) {
    const b = r.b, f = r.f, nm = ym(new Date());
    const per = s => s.day ? Math.max(0, s.day.avail) / s.day.left : 0;
    const R = []; let lv = 0;
    const up = (l, t) => { lv = Math.max(lv, l); R.push(t); };
    if (f.disp < 0) up(2, f.disp < b.disp - 0.5 ? "Quedarías con " + fmt(-f.disp) + " en negativo este mes" : "Ya estás en negativo este mes");
    if (r.card && r.card.c) {
        if (r.a > b.use.avail) up(2, "Supera el cupo disponible de la tarjeta (" + fmt(b.use.avail) + ")");
        else if (f.use.raw >= 70) up(1, "Dejarías la tarjeta al " + Math.round(f.use.raw) + "% del cupo (ideal: menos del 30%)");
    }
    if (f.disp >= 0 && b.day && b.day.avail > 0 && per(f) < per(b) * 0.5) up(1, "Tu promedio diario bajaría a menos de la mitad");
    if (r.bud > 0 && f.spent > r.bud) up(1, "Te pasarías del presupuesto de " + r.cat);
    if (r.interest > 0) up(1, "Pagarías " + fmt(r.interest) + " en intereses");
    const sty = [
        ["bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", "fa-circle-check", "Sí, te alcanza"],
        ["bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", "fa-triangle-exclamation", "Te alcanza, pero queda justo"],
        ["bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400", "fa-circle-xmark", "No te conviene ahora"]
    ][lv];
    const sub = R.length ? R.join(". ") + "." : (r.card ? "Cabe en el cupo y no aprieta tu disponible de este mes." : "Después de comprar te quedarían " + fmt(f.disp) + " disponibles.");
    const line = (l, a, c, bad) => `<div class="flex justify-between items-center text-xs py-1.5 gap-2"><span class="text-slate-500 dark:text-slate-400">${l}</span><span class="text-right shrink-0"><span class="text-slate-400">${a}</span><i class="fa-solid fa-arrow-right text-[8px] mx-1.5 text-slate-300"></i><b class="${bad ? "text-rose-500" : "text-slate-800 dark:text-white"}">${c}</b></span></div>`;
    let h = `
        <div class="flex items-start gap-3 p-3.5 rounded-2xl ${sty[0]} mb-3">
            <i class="fa-solid ${sty[1]} text-lg mt-0.5"></i>
            <div class="min-w-0"><p class="text-sm font-bold">${sty[2]}</p><p class="text-[11px] leading-relaxed mt-0.5 opacity-90">${esc(sub)}</p></div>
        </div>
        <div class="pt-1 border-t border-slate-100 dark:border-slate-800">
            ${line("Disponible para gastar", fmt(b.disp), fmt(f.disp), f.disp < 0)}
            ${b.day ? line("Promedio por día hasta fin de mes", fmt(per(b)), fmt(per(f)), per(f) < per(b) * 0.5) : ""}
            ${r.bud > 0 ? line("Presupuesto de " + esc(r.cat), Math.round(b.spent / r.bud * 100) + "%", Math.round(f.spent / r.bud * 100) + "%", f.spent > r.bud) : ""}`;
    if (r.card && r.card.c) h += line("Cupo utilizado", Math.round(b.use.raw) + "%", Math.round(f.use.raw) + "%", f.use.raw >= 70) + line("Cupo disponible", fmt(b.use.avail), fmt(f.use.avail), r.a > b.use.avail);
    h += `</div>`;
    if (r.card) {
        const rows = r.sched.slice(0, 6).map(s => `<div class="flex justify-between items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
            <div class="min-w-0"><b class="capitalize text-slate-800 dark:text-white">${monLabel(s.m)}</b><small class="text-[11px] text-slate-400 block">paga el ${dmy(s.pay).slice(0, 5)} · extracto ${fmt(s.b)} → ${fmt(s.af)}</small></div>
            <b class="shrink-0 text-indigo-500">+${fmt(s.cu)}</b></div>`).join("");
        h += `
        <div class="mt-3">
            <p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">${r.q > 1 ? r.q + " cuotas con " + esc(r.card.n) : "Una cuota con " + esc(r.card.n)}${r.ir > 0 ? " · " + tf(r.ir) + "% mensual" : ""}</p>
            ${rows}
            ${r.sched.length > 6 ? `<p class="text-[11px] text-slate-400 pt-1">y ${r.sched.length - 6} cuotas más</p>` : ""}
            <p class="text-[11px] text-slate-400 mt-2">El presupuesto de ${esc(r.cat)} cuenta la compra completa en el mes en que la haces; en los meses siguientes lo que cambia es la cuota de la tarjeta.</p>
        </div>`;
    }
    return h;
}

// ---------- Detalle de una categoría (contenido del modal) ----------
function catUI() {
    const d = cdet, r = catDetail(d.c, d.from, d.to), R = catRanges();
    const chip = (k, l) => `<button onclick="catQuick('${k}')" class="shrink-0 px-3 py-1.5 text-[11px] rounded-xl font-semibold whitespace-nowrap transition ${R[k][0] == d.from && R[k][1] == d.to ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}">${l}</button>`;
    const oneMonth = d.from && d.to && d.from.slice(0, 7) == d.to.slice(0, 7) && d.from.slice(8) == "01" && d.to == ymd(new Date(+d.to.slice(0, 4), +d.to.slice(5, 7), 0));
    const bud = oneMonth ? budOf(d.c, d.from.slice(0, 7)) : 0;
    const bad = d.from && d.to && d.from > d.to;
    const tile = (l, v, cl) => `<div class="flex-1 min-w-0 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"><span class="text-[10px] uppercase tracking-wider text-slate-400 block truncate">${l}</span><b class="text-xs ${cl || ""}">${v}</b></div>`;
    const list = r.rows.map(x => `
        <div class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="min-w-0">
                <strong class="text-xs font-semibold text-slate-800 dark:text-white block truncate">${esc(x.n || x.c)}</strong>
                <small class="text-[11px] text-slate-400">${dmy(x.d)}${x.k ? " · 💳 " + esc(x.k) : x.w ? " · " + esc(x.w) : ""}${x.sav ? " · 🎯 meta" : ""}${x.q > 1 ? " · " + x.q + " cuotas" : ""}</small>
            </div>
            <b class="text-xs shrink-0">${fmt(x.a)}</b>
        </div>`).join("");
    return `
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">${esc(d.c)}</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3">
            ${chip("m0", "Este mes")}${chip("m1", "Mes pasado")}${chip("d30", "30 días")}${chip("m3", "3 meses")}${chip("y0", "Este año")}${chip("all", "Todo")}
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div><label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Desde</label><input id="cdFrom" type="date" value="${d.from}" onchange="setCatDates()" class="${INP}"></div>
            <div><label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Hasta</label><input id="cdTo" type="date" value="${d.to}" onchange="setCatDates()" class="${INP}"></div>
        </div>
        ${bad ? '<p class="text-xs text-rose-500 mb-3">La fecha «desde» es posterior a «hasta».</p>' : ""}
        <div class="flex gap-2 mb-3">
            ${tile("Total", fmt(r.tot))}${tile("Compras", r.rows.length)}${tile("Promedio", fmt(r.avg))}
        </div>
        ${oneMonth && bud ? `<p class="text-[11px] mb-3 ${r.tot > bud ? "text-rose-500 font-semibold" : "text-slate-500 dark:text-slate-400"}"><i class="fa-solid fa-bullseye mr-1"></i>${Math.round(r.tot / bud * 100)}% de tu presupuesto de ${fmt(bud)}</p>` : ""}
        ${r.big && r.rows.length > 1 ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Mayor gasto: <b>${esc(r.big.n || r.big.c)}</b> · ${fmt(r.big.a)}</p>` : ""}
        <div>${list || '<p class="text-xs text-slate-400 text-center py-6">No hay compras en esta categoría para ese rango.</p>'}</div>
        ${r.hid ? `<p class="text-[11px] text-slate-400 mt-2">${r.hid} movimiento${r.hid == 1 ? "" : "s"} marcado${r.hid == 1 ? "" : "s"} como «fuera del resumen» no se muestra${r.hid == 1 ? "" : "n"}.</p>` : ""}
        <button onclick="closeModal()" class="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">Cerrar</button>`;
}

// ---------- Deudas ----------
function vDeu() {
    let T = 0;
    const L = S.dbt.map(d => {
        const left = dbtLeft(d), done = d.t - left, p = d.t ? Math.max(0, Math.min(100, done / d.t * 100)) : 0;
        T += Math.max(0, left);
        return `<div class="${CARD} p-5 mb-4">
            <div class="flex justify-between items-center mb-2"><b class="text-sm font-bold">${esc(d.n)}</b><span class="text-xs font-semibold ${left <= 0 ? "text-emerald-500" : "text-slate-400"}">${left <= 0 ? "Pagada ✓" : p.toFixed(0) + "% pagado"}</span></div>
            <div class="text-2xl font-extrabold mb-1">${fmt(Math.max(0, left))}</div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1"><div class="bg-rose-500 h-full rounded-full" style="width:${p}%"></div></div>
            <div class="text-[11px] text-slate-400 ${d.dd && left > 0 ? "mb-1" : "mb-3"}">Pagado ${fmt(done)} de ${fmt(d.t)}${d.ir > 0 ? " · " + tf(d.ir) + "% mensual" : ""}</div>
            ${d.dd && left > 0 ? (() => { const due = dbtDue(d, ym(new Date())), dt = dueIn(d.dd); return `<div class="text-[11px] mb-3 ${due > 0 && dt <= 3 ? "text-rose-500 font-semibold" : "text-slate-400"}">${d.cu > 0 ? "Cuota " + fmt(d.cu) + " · " : ""}pago el día ${d.dd} · ${due > 0 ? dueTxt(dt) : "al día este mes ✓"}</div>`; })() : ""}
            <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                ${left > 0 ? `<button onclick="payDbt(${d.id})" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">Abonar</button>` : ""}
                <button onclick="editDbt(${d.id})" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Editar</button>
                <button onclick="delDbt(${d.id})" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">Borrar</button>
            </div></div>`;
    }).join("");
    return `<section class="bg-gradient-to-br from-rose-600 to-red-800 text-white p-6 rounded-3xl shadow-xl shadow-rose-500/10 mb-6"><small class="text-xs text-rose-100 font-medium uppercase tracking-wider">Total que debo</small><div class="text-3xl font-extrabold mt-1">${fmt(T)}</div></section>
        <div class="flex justify-between items-center mb-4"><h3 class="text-base font-bold">Mis Deudas</h3><button onclick="newDbt()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">+ Nueva deuda</button></div>
        ${L || '<p class="text-xs text-slate-400 text-center py-6">Aquí anotas préstamos y deudas que no son de tarjeta.</p>'}
        ${planUI()}`;
}

// ---------- Ajustes ----------
const hideNames = () => WH.concat(S.cards.map(c => c.n));
function hidUI() { return hideNames().map((n, i) => `<label class="flex items-center justify-between text-xs"><span class="font-medium">${esc(n)}</span><input type="checkbox" ${S.hide[n] ? "checked" : ""} onchange="togHide(${i})" class="w-4 h-4 accent-indigo-600"></label>`).join(""); }

// Apariencia: modo (claro/oscuro/automático) + tema de color + color propio
function themeUI() {
    const cur = S.th.t || "indigo", md = S.th.m || "auto", on = "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10", off = "border-transparent bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600";
    const mb = (v, l, ic) => `<button onclick="setMode('${v}')" class="flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${md == v ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}"><i class="fa-solid ${ic} mr-1.5"></i>${l}</button>`;
    const sw = t => `<button onclick="setTheme('${t.id}')" class="p-2.5 rounded-2xl border-2 transition text-center ${cur == t.id ? on : off}"><span class="block h-9 rounded-xl" style="background:linear-gradient(135deg,${t.p},${t.s})"></span><span class="block text-[11px] font-semibold mt-1.5 text-slate-700 dark:text-slate-200">${t.n}</span></button>`;
    const ct = customTheme(S.th.c);
    return `
        <section class="${CARD} p-6 space-y-4">
            <div><h3 class="text-base font-bold">Apariencia</h3><p class="text-xs text-slate-400 mt-1">Elige claro u oscuro y el tema de color de toda la app. Se guarda en este dispositivo.</p></div>
            <div class="flex gap-2">${mb("auto", "Automático", "fa-circle-half-stroke")}${mb("light", "Claro", "fa-sun")}${mb("dark", "Oscuro", "fa-moon")}</div>
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                ${THEMES.map(sw).join("")}
                <label class="relative p-2.5 rounded-2xl border-2 transition text-center cursor-pointer ${cur == "custom" ? on : off}">
                    <span class="block h-9 rounded-xl" style="background:${cur == "custom" ? "linear-gradient(135deg," + ct.p + "," + ct.s + ")" : "conic-gradient(#ef4444,#f59e0b,#10b981,#06b6d4,#6366f1,#d946ef,#ef4444)"}"></span>
                    <span class="block text-[11px] font-semibold mt-1.5 text-slate-700 dark:text-slate-200">Tu color</span>
                    <input type="color" value="${S.th.c || "#4f46e5"}" oninput="previewCustom(this.value)" onchange="setCustom(this.value)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Elegir un color propio">
                </label>
            </div>
        </section>`;
}

function vSet() {
    const card = CARD + " p-6 space-y-4";
    const inp = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono";
    const bmk = ym(new Date()), mlab = new Date().toLocaleDateString("es-CO", { month: "long" });
    const bud = G.filter(g => g[0] != "Ahorro").map(([c]) => {
        const has = S.bud[c] > 0, ov = ((S.budm || {})[bmk] || {})[c], on = !!(S.budr || {})[c];
        return `<div class="text-xs">
            <div class="flex items-center justify-between gap-3"><span class="font-medium">${c}</span><input inputmode="numeric" value="${S.bud[c] ? Number(S.bud[c]).toLocaleString("es-CO") : ""}" placeholder="Sin límite" oninput="fa(this)" onchange="setBud('${c}', this.value)" class="w-36 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right"></div>
            ${has || ov ? `<div class="flex items-center justify-between gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <label class="flex items-center gap-1.5"><input type="checkbox" ${on ? "checked" : ""} onchange="togBudRoll('${c}')" class="w-3.5 h-3.5 accent-indigo-600">Acumular lo que sobre</label>
                <span class="flex items-center gap-1.5">Solo ${mlab}<input inputmode="numeric" value="${ov ? Number(ov).toLocaleString("es-CO") : ""}" placeholder="igual" oninput="fa(this)" onchange="setBudMonth('${c}', this.value)" class="w-24 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right"></span>
            </div>` : ""}
        </div>`;
    }).join("");
    const ini = WH.map((w, i) => `<div class="flex items-center justify-between gap-3 text-xs"><span class="font-medium">${w}</span><input inputmode="numeric" value="${S.ini[w] ? Number(S.ini[w]).toLocaleString("es-CO") : ""}" placeholder="0" oninput="fa(this)" onchange="setIni(${i}, this.value)" class="w-36 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right"></div>`).join("");
    const rec = S.rec.map(r => `<div class="flex justify-between items-center gap-2 text-xs py-1"><span class="min-w-0">${esc(r.n)} · día ${r.day} · ${r.vr ? "≈ " : ""}${fmt(r.a)}${r.vr ? ' <span class="text-amber-500">· cambia cada mes</span>' : ""}</span><span class="flex gap-3 shrink-0"><button onclick="editRec(${r.id})" class="text-indigo-600 font-semibold">Editar</button><button onclick="delRec(${r.id})" class="text-rose-500 font-semibold">Borrar</button></span></div>`).join("") || '<p class="text-xs text-slate-400">Sin gastos fijos.</p>';
    const np = typeof Notification == "undefined" ? "no" : Notification.permission;
    const bgOk = typeof ServiceWorkerRegistration != "undefined" && "periodicSync" in ServiceWorkerRegistration.prototype;
    const cats = S.cat.map(c => `<div class="flex justify-between items-center text-xs py-1"><span>${esc(c.n)} · <span class="text-slate-400">${c.k == "n" ? "Necesidad" : "Gusto"}</span></span><span class="flex gap-3"><button onclick="editCat(${c.id})" class="text-indigo-600 font-semibold">Editar</button><button onclick="delCat(${c.id})" class="text-rose-500 font-semibold">Borrar</button></span></div>`).join("") || '<p class="text-xs text-slate-400">Aún no has creado categorías propias.</p>';
    return `
        ${themeUI()}
        <section class="${card}"><div class="flex justify-between items-center"><h3 class="text-base font-bold">Mis categorías</h3><button onclick="newCat()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">+ Nueva</button></div>
            <p class="text-xs text-slate-400">Además de las 8 de siempre. El tipo (necesidad o gusto) define en qué parte de la regla 50/30/20 cuenta. También puedes crearlas desde Inicio, al anotar un gasto.</p>${cats}</section>
        <section class="${card}"><h3 class="text-base font-bold">Presupuestos mensuales</h3><p class="text-xs text-slate-400">El valor de arriba se repite cada mes. «Solo ${mlab}» lo cambia únicamente este mes. «Acumular» suma al mes siguiente lo que no gastes (si te pasas, no se descuenta).</p>${bud}</section>
        <section class="${card}"><div class="flex justify-between items-center"><h3 class="text-base font-bold">Gastos fijos</h3><button onclick="newRec()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">+ Agregar</button></div>${rec}</section>
        <section class="${card}"><h3 class="text-base font-bold">Saldos iniciales</h3><p class="text-xs text-slate-400">Lo que ya tenías en cada billetera antes de empezar a anotar.</p>${ini}</section>
        <section class="${card}"><h3 class="text-base font-bold">Ocultar del resumen</h3><p class="text-xs text-slate-400">Lo que ocultes no suma en “En mano” ni en “Tarjetas”, y sus gastos no salen en el resumen ni en las gráficas.</p>${hidUI()}</section>
        <section class="${card}"><h3 class="text-base font-bold">Avisos de metas</h3>
            <p class="text-xs text-slate-400">Te avisa de metas (7 días antes), tarjetas y deudas con día de pago (3 días antes) y hasta 7 días después si siguen pendientes. Siempre lo ves también en los Consejos de Inicio.</p>
            <p class="text-xs text-slate-400">${bgOk ? "Si instalaste la app en Chrome (Android), también intenta avisarte en segundo plano sin que la abras. El sistema decide cuándo, así que no es exacto ni está garantizado." : "En este navegador los avisos solo llegan cuando abres la app. Para recibirlos sin abrirla se necesita Chrome en Android con la app instalada."}</p>
            ${np == "no" ? '<p class="text-xs text-slate-400">Este navegador no permite notificaciones.</p>'
              : np == "granted" ? '<p class="text-xs text-emerald-500 font-semibold">Avisos activados ✓</p><button onclick="testNotif()" class="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs">Enviar aviso de prueba</button>'
              : np == "denied" ? '<p class="text-xs text-rose-500">Los bloqueaste en el navegador. Actívalos desde los permisos del sitio.</p>'
              : '<button onclick="askNotif()" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">Activar avisos</button>'}
        </section>
        <section class="${card}"><h3 class="text-base font-bold">Bloqueo con PIN</h3><p class="text-xs text-slate-400">Bloquea la pantalla al abrir la app. No cifra los datos.</p><button onclick="setPin()" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">${S.pin ? "Cambiar o quitar PIN" : "Crear PIN"}</button></section>
        <section class="${card}"><h3 class="text-base font-bold">Copia de seguridad</h3>
            <p class="text-xs ${bkDue() ? "text-amber-500 font-semibold" : "text-slate-400"}">${S.bk ? "Última copia: " + dmy(S.bk) + " (hace " + bkDaysAgo() + " d). Te lo recuerdo cada " + BK_DAYS + " días." : "Aún no has hecho ninguna copia. Tus datos solo están en este celular."}</p>
            <button onclick="downloadBackup()" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">Descargar copia (.json)</button>
            <button onclick="exportCsv()" class="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs">Descargar CSV</button>
            <label class="block text-xs font-semibold text-slate-500 uppercase pt-2">Restaurar desde archivo</label>
            <input type="file" accept=".json,application/json" onchange="importFile(this)" class="block w-full text-xs text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-slate-800 file:text-white file:font-semibold file:text-xs">
            <details class="pt-2"><summary class="text-xs font-semibold text-slate-500 cursor-pointer">Copiar o pegar como texto</summary>
                <div class="space-y-3 pt-3">
                    <textarea id="ex" readonly rows="4" class="${inp}">${esc(JSON.stringify(S))}</textarea>
                    <button onclick="copyBackup()" class="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs">Copiar datos</button>
                    <label class="block text-xs font-semibold text-slate-500 uppercase pt-2">Restaurar copia (pega el JSON)</label>
                    <textarea id="imp" rows="3" class="${inp}"></textarea>
                    <button onclick="importBackup()" class="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs">Restaurar</button>
                </div>
            </details>
        </section>`;
}
