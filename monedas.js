// ===== Mi Plata · monedas.js =====
// 1) Cuentas en dólares / euros (viven en S.fx; los datos y cálculos están en logica.js): tasa propia por cuenta, ganancia o pérdida y cambio a pesos.
// 2) Tasas (TRM y euro) por internet.
// 3) Historial editable de cada meta de ahorro (corregir fecha, monto, cuenta o borrar un aporte).

let fxOpen = null;   // cuenta en moneda extranjera con el detalle abierto
let fxAll = {};      // cuentas con el historial completo desplegado
let hOpen = {};      // metas con el historial desplegado
let hAll = {};       // metas con el historial completo (si no, solo los últimos 6)

const FX_CLS = { USD: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", EUR: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" };
const fxIb = (cl, fn, ic, t) => `<button onclick="${fn}" title="${t}" aria-label="${t}" class="w-8 h-8 ${cl} rounded-lg text-[11px] flex items-center justify-center shrink-0"><i class="fa-solid ${ic}"></i></button>`;
const fxCodeOf = label => String(label).startsWith("EUR") ? "EUR" : "USD";
const fxRateOk = v => v >= 100 && v <= 100000;
const fxPlus = n => (n > 0.5 ? "+" : "") + fmt(n);                 // +$12.000 / -$3.000
const fxPct = (g, c) => c > 0 ? (g >= 0 ? "+" : "-") + Math.abs(g / c * 100).toFixed(1).replace(".", ",") + "%" : "";
const fxGcl = n => n > 0.5 ? "text-emerald-500" : n < -0.5 ? "text-rose-500" : "text-slate-400";
const fxR2 = n => Math.round(n * 100) / 100;

// ---------- Cuentas en dólares / euros: pantalla ----------
function fxCard(a) {
    const b = fxBal(a), r = fxRateOf(a), sel = fxOpen == a.id, C = FXC[a.c], k = r > 0 ? fxCost(a) : null;
    return `
        <button onclick="togFx(${a.id})" class="${CARD} lift p-4 text-left flex flex-col min-w-0 ${sel ? "!border-indigo-500 ring-2 ring-indigo-500/30" : ""}">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${FX_CLS[a.c]}"><i class="fa-solid ${C[2]}"></i></span>
            <span class="text-[11px] uppercase tracking-wider text-slate-400 truncate w-full">${esc(a.n)}</span>
            <b class="text-lg font-extrabold mt-0.5 truncate w-full ${b < 0 ? "text-rose-500" : "text-slate-800 dark:text-white"}">${fxFmt(a.c, b)}</b>
            <small class="text-[11px] text-slate-400 mt-0.5 truncate w-full">${r > 0 ? "≈ " + fmt(b * r) : "Falta la tasa del euro"}</small>
            ${k && k.q > 0 && Math.abs(k.gain) >= 0.5 ? `<small class="text-[11px] font-semibold truncate w-full ${fxGcl(k.gain)}">${fxPlus(k.gain)}</small>` : ""}
        </button>`;
}

let fxHO = {};
function fxPanel(a) {
    const b = fxBal(a), ref = fxRate(a.c), r = fxRateOf(a), C = FXC[a.c], all = !!fxAll[a.id], k = fxCost(a), unit = a.c == "EUR" ? "€" : "US$";
    const act = (cl, fn, t) => `<button onclick="${fn}" class="px-3 py-1.5 ${cl} rounded-xl text-xs font-semibold">${t}</button>`;
    const box = (l, v, cl, nt) => `<div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 min-w-0"><span class="text-[10px] uppercase tracking-wider text-slate-400 block truncate">${l}</span><b class="text-xs ${cl || ""}">${v}</b>${nt ? `<small class="text-[10px] block ${cl || "text-slate-400"}">${nt}</small>` : ""}</div>`;
    const L = a.h.slice().sort((p, q) => q.d.localeCompare(p.d) || q.id - p.id), shown = all ? L : L.slice(0, 8);
    const rows = shown.map(x => {
        const cv = x.cv ? S.items.find(y => y.id == x.it) : null, rl = k.rl[x.id];
        const lab = x.cv ? "Cambio a pesos" : x.n || (x.v >= 0 ? "Entrada" : "Salida");
        const sub = [dmy(x.d), x.cv ? "→ " + (cv ? wlabel(cv.to) : "") : "", x.r > 0 ? "tasa " + fmtD(x.r) : ""].filter(Boolean).join(" · ");
        return `
        <div class="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="min-w-0"><span class="text-xs font-medium text-slate-700 dark:text-slate-200 block truncate">${esc(lab)}</span><small class="text-[11px] text-slate-400 block">${sub}</small>${x.cv ? `<small class="text-[11px] text-slate-500 block">Recibiste ${fmt(x.cv)}</small>${rl !== undefined && Math.abs(rl) >= 0.5 ? `<small class="text-[11px] font-semibold block ${fxGcl(rl)}">${rl > 0 ? "Ganancia" : "Pérdida"} ${fmt(Math.abs(rl))}</small>` : ""}` : ""}</div>
            <div class="flex items-center gap-1.5 shrink-0">
                <b class="text-xs mr-1 ${x.v >= 0 ? "text-emerald-500" : ""}">${x.v >= 0 ? "+" : "-"}${fxFmt(a.c, Math.abs(x.v))}</b>
                ${fxIb("bg-slate-100 dark:bg-slate-800", `fxEntryEdit(${a.id},${x.id})`, "fa-pen", "Editar")}
                ${fxIb("bg-slate-100 dark:bg-slate-800 text-rose-500", `fxEntryDel(${a.id},${x.id})`, "fa-trash", "Borrar")}
            </div>
        </div>`;
    }).join("");
    return `
        <section class="${CARD} p-5 mb-4">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${FX_CLS[a.c]}"><i class="fa-solid ${C[2]}"></i></span>
                <div class="min-w-0"><b class="text-sm font-bold text-slate-800 dark:text-white block truncate">${esc(a.n)}</b><small class="text-[11px] text-slate-400">${a.c == "EUR" ? "Cuenta en euros" : "Cuenta en dólares"}</small></div>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-2">
                ${box("Saldo", fxFmt(a.c, b), b < 0 ? "text-rose-500" : "")}
                ${box("En pesos", r > 0 ? fmt(b * r) : "—")}
                ${box("Tasa de la cuenta", r > 0 ? fmtD(r) : "Sin tasa", "", a.sp ? (ref > 0 ? (a.c == "EUR" ? "Euro " : "TRM ") + fmtD(ref) + " " + (a.sp > 0 ? "+" : "-") + " " + fmtD(Math.abs(a.sp)) : "") : "")}
            </div>
            ${r > 0 ? sdet("Ver detalle de ganancia", `<div class="grid grid-cols-3 gap-2 mb-2">
                ${box("Lo que pagaste", k.q > 0 ? fmt(k.cost) : "—")}
                ${box("Ganancia o pérdida", k.q > 0 ? fxPlus(k.gain) : "—", k.q > 0 ? fxGcl(k.gain) : "", k.q > 0 ? fxPct(k.gain, k.cost) : "")}
                ${box("Ya cobrado", Math.abs(k.real) >= 0.5 ? fxPlus(k.real) : "—", Math.abs(k.real) >= 0.5 ? fxGcl(k.real) : "")}
            </div>`) : `<p class="text-[11px] text-amber-500 mb-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Escribe cuántos pesos vale 1 euro (botón «Editar») o actualiza las tasas para ver esta cuenta en pesos y sumarla a tu patrimonio.</p>`}
            <div class="mb-3 text-[11px] text-slate-400">Cuenta en tu patrimonio y en «Disponible para gastar».${hq(`${k.q > 0 && r > 0 ? "La ganancia compara lo que vale hoy con la tasa de cada vez que metiste plata. " : ""}Esta plata suma a tu patrimonio y cuenta como «Disponible para gastar», ya convertida a pesos. Cuando gastes, anótalo con «Sacar».`)}</div>
            <div class="flex flex-wrap gap-2 mb-4">
                ${act("bg-emerald-50 text-emerald-600", `fxMove(${a.id},1)`, "＋ Meter")}
                ${act("bg-rose-50 text-rose-600", `fxMove(${a.id},-1)`, "－ Sacar")}
                ${act("bg-sky-50 text-sky-600", `fxCash(${a.id})`, "Cambiar a pesos")}
                ${mxMenu(act("bg-indigo-50 text-indigo-600", `fxAdj(${a.id})`, "Ajustar saldo") + act("bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300", `fxEdit(${a.id})`, "Editar") + act("bg-slate-100 dark:bg-slate-800 text-rose-500", `fxDel(${a.id})`, "Borrar"))}
            </div>
            <details class="sdet" ${fxHO[a.id] ? "open" : ""} ontoggle="fxHO[${a.id}]=this.open?1:0"><summary>Historial (${L.length})</summary><div class="sdet-b">
            ${rows || '<p class="text-xs text-slate-400 text-center py-4">Todavía no hay movimientos en esta cuenta.</p>'}
            ${L.length > 8 ? `<button onclick="fxAll[${a.id}]=${all ? 0 : 1};draw()" class="w-full mt-2 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">${all ? "Ver menos" : "Ver los " + L.length + " movimientos"}</button>` : ""}</div></details>
        </section>`;
}

// Sección que vCue (vistas.js) pinta debajo de las cuentas en pesos
function fxSection() {
    if (fxOpen && !S.fx.some(a => a.id == fxOpen)) fxOpen = null;
    const open = S.fx.find(a => a.id == fxOpen);
    return `
        <div class="flex justify-between items-center mb-3 mt-6"><h3 class="text-base font-bold">Dólares y euros</h3><button onclick="fxFetchRates()" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold"><i class="fa-solid fa-rotate mr-1.5"></i>Actualizar tasas</button></div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            ${S.fx.map(fxCard).join("")}
            <button onclick="newFx()" class="min-h-[140px] rounded-[20px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-indigo-500 transition px-2 text-center">
                <span class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center"><i class="fa-solid fa-plus"></i></span>
                <span class="text-xs font-semibold">Cuenta en USD / EUR</span>
            </button>
        </div>
        ${open ? fxPanel(open) : S.fx.length ? '' : '<p class="text-[11px] text-slate-400 mb-4">Guarda aquí plata en dólares o euros y mira cuánto ganas o pierdes por la tasa.</p>'}`;
}

function togFx(id) { fxOpen = fxOpen == id ? null : id; walOpen = null; draw(); }

// ---------- Cuentas en dólares / euros: acciones ----------
function fxErr(n, own) {
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .\/-]{0,19}$/u.test(n)) return "Usa hasta 20 letras o números (sin comillas ni símbolos raros).";
    const taken = S.wal.map(a => a.n).concat(S.cards.map(c => c.n), S.fx.map(a => a.n)).filter(x => x != own).map(x => x.toLowerCase());
    if (taken.includes(n.toLowerCase())) return "Ya existe una cuenta o tarjeta con ese nombre.";
    return "";
}
// Diferencia con la referencia (en pesos, puede ser negativa): vacío = 0
function spOf(txt, ref) {
    const sp = fxR2(pr(txt));
    if (Math.abs(sp) > 5000) return { e: "La diferencia debe ser pequeña, por ejemplo -50 o 30 pesos." };
    if (ref > 0 && ref + sp < 100) return { e: "Con esa diferencia la tasa quedaría muy baja." };
    return { sp };
}
function newFx() {
    openCustomModal("Nueva cuenta en dólares o euros", [
        { l: "Nombre", p: "Ej. Wise, Cuenta en dólares" },
        { l: "Moneda", o: ["USD (dólares)", "EUR (euros)"] },
        { l: "¿Cuánto tiene hoy?", m: "decimal", p: "0" },
        { l: "Tasa a la que los compraste (pesos por 1 dólar o euro, opcional)", m: "decimal", p: "Si la dejas vacía, la de hoy" },
        { l: "Diferencia con la TRM en pesos (opcional, ej. -50 o 30)", m: "decimal", p: "0" },
        { l: "Si es en euros: pesos por 1 euro hoy", m: "decimal", v: S.eur ? tf(S.eur) : "", p: "Ej. 4600" }
    ], v => {
        const e = fxErr(v[0]); if (e) return e;
        const c = fxCodeOf(v[1]), amt = fxR2(pr(v[2]));
        if (amt < 0) return "El saldo no puede ser negativo.";
        let eur = S.eur;
        if (c == "EUR" && v[5]) { const r = pr(v[5]); if (!fxRateOk(r)) return "Escribe cuántos pesos vale 1 euro, por ejemplo 4600."; eur = fxR2(r); }
        const ref = c == "EUR" ? eur : S.trm, s = spOf(v[4], ref); if (s.e) return s.e;
        let r = v[3] ? fxR2(pr(v[3])) : 0;
        if (v[3] && !fxRateOk(r)) return "Escribe la tasa en pesos por unidad, por ejemplo 3950.";
        if (c == "EUR") S.eur = eur || 0;
        const a = { id: Date.now(), n: v[0], c, sp: s.sp, h: [] };
        if (amt > 0) { if (!r) r = fxRateOf(a); a.h.push(Object.assign({ id: a.id + 1, d: today(), v: amt, n: "Saldo inicial" }, r > 0 ? { r } : {})); }
        S.fx.push(a); fxOpen = a.id; walOpen = null; save();
    });
}
function fxEdit(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    const fields = [{ l: "Nombre", v: esc(a.n) }, { l: a.c == "EUR" ? "Diferencia con la tasa del euro en pesos (ej. -50 o 30)" : "Diferencia con la TRM en pesos (ej. -50 o 30)", m: "decimal", v: a.sp ? tf(a.sp) : "" }];
    if (a.c == "EUR") fields.push({ l: "Pesos por 1 euro hoy", m: "decimal", v: S.eur ? tf(S.eur) : "" });
    openCustomModal(a.c == "EUR" ? "Editar cuenta en euros" : "Editar cuenta en dólares", fields, v => {
        if (v[0] != a.n) { const e = fxErr(v[0], a.n); if (e) return e; }
        let eur = S.eur;
        if (a.c == "EUR") { const r = pr(v[2]); if (v[2] && !fxRateOk(r)) return "Escribe cuántos pesos vale 1 euro, por ejemplo 4600."; eur = v[2] ? fxR2(r) : 0; }
        const s = spOf(v[1], a.c == "EUR" ? eur : S.trm); if (s.e) return s.e;
        a.n = v[0]; a.sp = s.sp; if (a.c == "EUR") S.eur = eur; save();
    });
}
function fxDel(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    const b = fxBal(a), conv = a.h.filter(x => x.cv).length;
    confirmAction("¿Borrar la cuenta " + esc(a.n) + "?" + (Math.abs(b) > 0.004 ? " Tiene " + fxFmt(a.c, b) + " que dejarán de sumar a tu patrimonio." : "") + (conv ? (conv > 1 ? " Los pesos de sus " + conv + " cambios a pesos siguen en tus cuentas." : " Los pesos de su cambio a pesos siguen en tus cuentas.") : ""), () => {
        S.items.forEach(x => { if (x.fx && x.fx.a == id) delete x.fx; if (x.fxa == id) { delete x.fxa; delete x.fxe; } }); // los pesos que ya recibiste se quedan como una transferencia normal
        S.fx = S.fx.filter(x => x.id != id); if (fxOpen == id) fxOpen = null; save();
    });
}
const fxUnitMsg = a => a.c == "EUR" ? "Tasa de ese día (pesos por 1 euro)" : "Tasa de ese día (pesos por 1 dólar)";
const fxAmtLbl = a => a.c == "EUR" ? "Monto en euros" : "Monto en dólares";
function fxMove(id, s) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    const rt = fxRateOf(a), f = [{ l: fxAmtLbl(a), m: "decimal" }];
    if (s > 0) f.push({ l: fxUnitMsg(a), m: "decimal", v: rt > 0 ? tf(fxR2(rt)) : "" });
    f.push({ l: "Fecha", t: "date", v: today() }, { l: "Nota (opcional)", p: s > 0 ? "Ej. Pago de cliente" : "Ej. Compra en línea" });
    const j = s > 0 ? 1 : 0; // los que vienen después de la tasa se corren un lugar cuando hay tasa
    openCustomModal(s > 0 ? "Meter a " + esc(a.n) : "Sacar de " + esc(a.n), f, v => {
        const n = fxR2(pr(v[0]));
        if (!(n > 0)) return "Escribe un monto mayor a cero.";
        const d = v[1 + j];
        if (!d || d > today()) return "Elige una fecha de hoy o anterior.";
        if (s < 0 && n > fxBal(a) + 0.004) return "Solo tienes " + fxFmt(a.c, fxBal(a)) + " en esta cuenta.";
        const e = { id: Date.now(), d, v: s * n, n: v[2 + j] };
        if (s > 0) { const r = v[1] ? fxR2(pr(v[1])) : rt; if (v[1] && !fxRateOk(r)) return "Escribe la tasa en pesos por unidad, por ejemplo 3950."; if (r > 0) e.r = r; }
        a.h.push(e); save();
    });
}
// "Ajustar saldo": dices cuánto hay de verdad y se guarda la diferencia como un movimiento (queda en el historial)
function fxAdj(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    openCustomModal("Ajustar saldo de " + esc(a.n), [{ l: "¿Cuánto hay en la cuenta hoy?", m: "decimal", v: tf(fxBal(a)) }], v => {
        if (v[0] === "") return "Escribe el saldo.";
        const t = fxR2(pr(v[0]));
        if (t < 0) return "El saldo no puede ser negativo.";
        const d = fxR2(t - fxBal(a)), rt = fxRateOf(a);
        if (d) a.h.push(Object.assign({ id: Date.now(), d: today(), v: d, n: "Ajuste de saldo" }, d > 0 && rt > 0 ? { r: rt } : {}));
        save();
    });
}
// Cambiar a pesos: sale de la cuenta en dólares/euros y entra a una cuenta en pesos como transferencia (no cuenta como ingreso)
function fxCash(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    if (fxBal(a) <= 0) return showToast("Esta cuenta no tiene saldo para cambiar.", true);
    const rt = fxRateOf(a);
    openCustomModal("Cambiar a pesos desde " + esc(a.n), [
        { l: a.c == "EUR" ? "¿Cuántos euros cambias?" : "¿Cuántos dólares cambias?", m: "decimal", v: tf(fxBal(a)) },
        { l: a.c == "EUR" ? "Tasa a la que te los cambiaron (pesos por 1 euro)" : "Tasa a la que te los cambiaron (pesos por 1 dólar)", m: "decimal", v: rt > 0 ? tf(fxR2(rt)) : "" },
        { l: "¿A qué cuenta entran los pesos?", o: WH.slice() },
        { l: "Fecha", t: "date", v: today() }
    ], v => {
        const n = fxR2(pr(v[0])), r = fxR2(pr(v[1])), w = WH.find(x => x == v[2]), d = v[3];
        if (!(n > 0)) return "Escribe un monto mayor a cero.";
        if (n > fxBal(a) + 0.004) return "Solo tienes " + fxFmt(a.c, fxBal(a)) + " en esta cuenta.";
        if (!fxRateOk(r)) return "Escribe la tasa en pesos por unidad, por ejemplo 3950.";
        if (!w) return "Elige la cuenta donde entran los pesos.";
        if (!d || d > today()) return "Elige una fecha de hoy o anterior.";
        const pesos = Math.round(n * r), it = Date.now(), eid = it + 1;
        S.items.push({ id: it, d, t: "tr", c: "Transferencia", n: a.n + " → " + wlabel(w), a: pesos, k: "", w: "", to: w, q: 1, fx: { a: a.id, e: eid } });
        a.h.push({ id: eid, d, v: -n, n: "Cambio a pesos", cv: pesos, it });
        const g = fxCost(a).rl[eid];
        save();
        showToast("Cambiaste " + fxFmt(a.c, n) + " y recibiste " + fmt(pesos) + "." + (g !== undefined && Math.abs(g) >= 0.5 ? " " + (g > 0 ? "Ganancia" : "Pérdida") + ": " + fmt(Math.abs(g)) : ""));
    });
}
function fxEntryEdit(aid, eid) {
    const a = S.fx.find(x => x.id == aid), x = a && a.h.find(y => y.id == eid); if (!x) return;
    if (x.cv) return showToast("Es un cambio a pesos: bórralo y vuelve a hacerlo con los datos correctos.", true);
    if (x.it) return showToast("Es un gasto anotado en Inicio: bórralo y vuelve a anotarlo.", true);
    openCustomModal("Corregir movimiento", [
        { l: "Tipo", o: ["Entrada", "Salida"], v: x.v < 0 ? "Salida" : "Entrada" },
        { l: fxAmtLbl(a), m: "decimal", v: tf(Math.abs(x.v)) },
        { l: fxUnitMsg(a) + " · solo entradas", m: "decimal", v: x.r > 0 ? tf(x.r) : "" },
        { l: "Fecha", t: "date", v: x.d },
        { l: "Nota", v: esc(x.n || "") }
    ], v => {
        const n = fxR2(pr(v[1]));
        if (!(n > 0)) return "Escribe un monto mayor a cero.";
        if (!v[3] || v[3] > today()) return "Elige una fecha de hoy o anterior.";
        const nv = v[0] == "Salida" ? -n : n;
        if (fxBal(a) - x.v + nv < -0.004) return "Con ese cambio la cuenta quedaría en negativo.";
        const r = v[2] ? fxR2(pr(v[2])) : 0;
        if (nv > 0 && v[2] && !fxRateOk(r)) return "Escribe la tasa en pesos por unidad, por ejemplo 3950.";
        x.v = nv; x.d = v[3]; x.n = v[4];
        if (nv > 0 && r > 0) x.r = r; else delete x.r;
        save();
    });
}
function fxEntryDel(aid, eid) {
    const a = S.fx.find(x => x.id == aid), x = a && a.h.find(y => y.id == eid); if (!x) return;
    if (fxBal(a) - x.v < -0.004) return showToast("Si borras eso la cuenta quedaría en negativo. Corrige o borra primero la salida.", true);
    const it = x.it ? S.items.find(y => y.id == x.it) : null;
    confirmAction(!x.cv && it ? "¿Borrar este gasto de " + fxFmt(a.c, Math.abs(x.v)) + "? También se quita de tus movimientos y la plata vuelve a esta cuenta." : x.cv ? "¿Borrar este cambio a pesos? Los " + fmt(x.cv) + " dejan de entrar a " + esc(it ? wlabel(it.to) : "tu cuenta") + " y los " + fxFmt(a.c, Math.abs(x.v)) + " vuelven a esta cuenta."
        : "¿Borrar este movimiento de " + (x.v >= 0 ? "+" : "-") + fxFmt(a.c, Math.abs(x.v)) + "?", () => {
        if (x.it) S.items = S.items.filter(y => y.id != x.it); // el cambio a pesos o el gasto ligado a esta entrada
        a.h = a.h.filter(y => y.id != eid); save();
    });
}

// ---------- Tasas por internet ----------
// TRM oficial: datos.gov.co (Superfinanciera). Euro: tasa de mercado de open.er-api.com. Si falla la TRM oficial se usa la de mercado.
let fxFetching = false;
async function fxFetchRates() {
    if (fxFetching) return; fxFetching = true;
    const J = async url => { const c = new AbortController(), tm = setTimeout(() => c.abort(), 12000); try { const r = await fetch(url, { signal: c.signal, cache: "no-store" }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(tm); } };
    showToast("Consultando tasas…");
    let trm = 0, eur = 0;
    try {
        const j = await J("https://www.datos.gov.co/resource/32sa-8pi3.json?" + new URLSearchParams({ "$select": "valor,vigenciadesde", "$where": "vigenciadesde <= '" + today() + "T23:59:59.000'", "$order": "vigenciadesde DESC", "$limit": "1" }));
        trm = parseFloat(j[0].valor);
    } catch (e) {}
    try { const j = await J("https://open.er-api.com/v6/latest/EUR"); eur = +j.rates.COP; } catch (e) {}
    if (!fxRateOk(trm)) { trm = 0; try { const j = await J("https://open.er-api.com/v6/latest/USD"); if (fxRateOk(+j.rates.COP)) trm = +j.rates.COP; } catch (e) {} }
    fxFetching = false;
    if (!trm && !fxRateOk(eur)) return showToast("No se pudieron consultar las tasas. Revisa tu internet y vuelve a intentarlo.", true);
    if (trm) S.trm = fxR2(trm);
    if (fxRateOk(eur)) S.eur = fxR2(eur);
    S.rAt = Date.now(); save(); draw();
    showToast("Tasas actualizadas · TRM " + fmtD(S.trm) + (S.eur ? " · Euro " + fmtD(S.eur) : ""));
}
// Tasa del euro (pestaña Inversión), igual que setTrmVal
function setEurVal() {
    const v = pr(document.getElementById("eurInput").value);
    if (!fxRateOk(v)) return showToast("Escribe cuántos pesos vale 1 euro, por ejemplo 4600", true);
    S.eur = fxR2(v); save(); showToast("Tasa del euro actualizada: " + fmtD(S.eur)); draw();
}
const rAtTxt = () => { const d = new Date(S.rAt); return d.toLocaleDateString(DLOC, { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString(DLOC, { hour: "2-digit", minute: "2-digit" }); };

// ---------- Metas de ahorro: historial editable ----------
// Cada aporte o retiro de una meta es una entrada de S.sv: { id, a: meta, d: fecha, v: monto en la moneda de la meta (con signo), cp: lo mismo en pesos, w: cuenta, i: 1 si es el «ya tenía ahorrado» }.
// Los gastos pagados directo desde la meta (sin cuenta) están ligados a un movimiento de Inicio, así que se corrigen allá.
const svLocked = x => !x.i && !x.w;
function goalHist(a) {
    const L = S.sv.filter(x => x.a == a.id).sort((p, q) => q.d.localeCompare(p.d) || q.id - p.id);
    if (!L.length) return "";
    const open = !!hOpen[a.id], all = !!hAll[a.id], shown = all ? L : L.slice(0, 6);
    const head = `<button onclick="hOpen[${a.id}]=${open ? 0 : 1};draw()" class="w-full flex items-center justify-between py-2 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><span><i class="fa-solid fa-clock-rotate-left mr-1.5"></i>Historial de aportes (${L.length})</span><i class="fa-solid fa-chevron-${open ? "up" : "down"} text-[10px]"></i></button>`;
    if (!open) return head;
    const rows = shown.map(x => {
        const lab = x.i ? "Ya tenía ahorrado" : x.v > 0 ? "Aporte" : svLocked(x) ? "Gasto desde la meta" : "Retiro";
        return `<div class="flex items-center justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="min-w-0"><span class="text-xs font-medium text-slate-700 dark:text-slate-200 block truncate">${lab}</span><small class="text-[11px] text-slate-400">${dmy(x.d)}${x.w ? " · " + esc(wlabel(x.w)) : ""}</small></div>
            <div class="flex items-center gap-1.5 shrink-0">
                <b class="text-xs mr-1 ${x.v > 0 ? "text-emerald-500" : ""}">${x.v > 0 ? "+" : "-"}${fm(a, Math.abs(x.v))}</b>
                ${svLocked(x) ? `<span class="w-8 h-8 text-slate-300 text-[11px] flex items-center justify-center" title="Es un gasto: edítalo desde el movimiento en Inicio"><i class="fa-solid fa-lock"></i></span>` : fxIb("bg-slate-100 dark:bg-slate-800", `svEdit(${a.id},${x.id})`, "fa-pen", "Corregir") + fxIb("bg-slate-100 dark:bg-slate-800 text-rose-500", `svDel(${a.id},${x.id})`, "fa-trash", "Borrar")}
            </div>
        </div>`;
    }).join("");
    return `<div class="mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">${head.replace("mb-2", "mb-1")}${rows}${L.length > 6 ? `<button onclick="hAll[${a.id}]=${all ? 0 : 1};draw()" class="w-full mt-1 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">${all ? "Ver menos" : "Ver los " + L.length}</button>` : ""}</div>`;
}
function svEdit(aid, sid) {
    const a = S.acc.find(g => g.id == aid), x = a && S.sv.find(y => y.id == sid && y.a == aid); if (!x) return;
    if (svLocked(x)) return showToast("Es un gasto pagado desde la meta: edítalo desde el movimiento en Inicio.", true);
    const U = !!a.u, fields = [{ l: "Fecha", t: "date", v: x.d }];
    if (!x.i) fields.push({ l: "Tipo", o: ["Meter", "Sacar"], v: x.v < 0 ? "Sacar" : "Meter" }, { l: "Cuenta", o: WH.slice(), v: WH.includes(x.w) ? x.w : WH[0] });
    const ia = fields.length; fields.push({ l: U ? "Monto en USD" : "Monto", m: "decimal", v: tf(Math.abs(x.v)) });
    openCustomModal("Corregir en " + esc(a.n), fields, v => {
        const d = v[0]; if (!d) return "Elige una fecha."; if (d > today()) return "La fecha no puede ser futura.";
        const n = U ? Math.round(pr(v[ia]) * 100) / 100 : num(v[ia]);
        if (!(n > 0)) return "Escribe un monto mayor a cero.";
        const nv = x.i || v[1] == "Meter" ? n : -n;
        if (svb(a.id) - x.v + nv < -0.005) return "Con ese cambio la meta quedaría en negativo.";
        if (!x.i) { // se conserva la tasa con la que se anotó; si no hay, la TRM de hoy
            const k = x.v && x.cp && isFinite(x.cp / x.v) && x.cp / x.v > 0 ? x.cp / x.v : (U ? S.trm : 1);
            x.cp = Math.round(nv * k); x.w = v[2];
        }
        x.d = d; x.v = nv; save();
    });
}
function svDel(aid, sid) {
    const a = S.acc.find(g => g.id == aid), x = a && S.sv.find(y => y.id == sid && y.a == aid); if (!x) return;
    if (svLocked(x)) return showToast("Es un gasto pagado desde la meta: bórralo desde el movimiento en Inicio.", true);
    if (svb(a.id) - x.v < -0.005) return showToast("Si borras eso la meta quedaría en negativo. Corrige o borra primero el retiro.", true);
    confirmAction("¿Borrar este " + (x.i ? "saldo" : x.v > 0 ? "aporte" : "retiro") + " de " + fm(a, Math.abs(x.v)) + "?" + (!x.i && x.w ? " La plata " + (x.v > 0 ? "vuelve a" : "deja de salir de") + " la cuenta " + esc(wlabel(x.w)) + "." : ""), () => { S.sv = S.sv.filter(y => y.id != sid); save(); });
}

// ---------- Interfaz más limpia: menú ⋯, ayuda "?" y bloques plegables ----------
// Usan <details>, así que no necesitan estado. mxMenu(botones): lo secundario va dentro de un ⋯.
function mxMenu(inner) {
    return `<details class="mx"><summary aria-label="Más opciones">⋯</summary><div class="mx-b">${inner}</div></details>`;
}
// hq(texto): icono ? que despliega la explicación solo si lo tocas.
function hq(txt) {
    return `<details class="hq"><summary aria-label="Ayuda">?</summary><p>${txt}</p></details>`;
}
// sdet(titulo, contenido): bloque plegado por defecto.
function sdet(title, inner, cls) {
    return `<details class="sdet ${cls || ""}"><summary>${title}</summary><div class="sdet-b">${inner}</div></details>`;
}

// Tasas y precios: antes estaban en Inversión, ahora viven en Ajustes
function ratesUI(card) {
    const inpc = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs";
    return `
        <section class="${card}"><h3 class="text-base font-bold">Tasas y precios${hq("Cada cuenta en dólares o euros puede tener su propia diferencia en pesos. Puedes escribir los decimales con coma o con punto.")}</h3>
            <div>
                <label class="block text-[11px] font-semibold text-slate-500 mb-1">Pesos por 1 dólar (TRM)</label>
                <div class="flex gap-2"><input id="trmInput" inputmode="decimal" value="${tf(S.trm)}" placeholder="Ej. 3221,56" onkeydown="if(event.key==='Enter')setTrmVal()" class="${inpc}" autocomplete="off"><button onclick="setTrmVal()" class="px-4 bg-indigo-600 text-white font-semibold rounded-xl text-xs shrink-0">Guardar</button></div>
            </div>
            <div>
                <label class="block text-[11px] font-semibold text-slate-500 mb-1">Pesos por 1 euro</label>
                <div class="flex gap-2"><input id="eurInput" inputmode="decimal" value="${S.eur ? tf(S.eur) : ""}" placeholder="Ej. 4600" onkeydown="if(event.key==='Enter')setEurVal()" class="${inpc}" autocomplete="off"><button onclick="setEurVal()" class="px-4 bg-indigo-600 text-white font-semibold rounded-xl text-xs shrink-0">Guardar</button></div>
            </div>
            <button onclick="fxFetchRates()" class="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs"><i class="fa-solid fa-rotate mr-1.5"></i>Actualizar tasas por internet</button>
            ${S.rAt ? `<p class="text-[11px] text-slate-400">Última consulta: <b>${rAtTxt()}</b></p>` : ""}
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button onclick="fkModal()" class="w-full py-2.5 bg-slate-100 dark:bg-slate-800 font-semibold rounded-xl text-xs"><i class="fa-solid fa-key mr-1.5"></i>Clave API de precios en vivo</button>
                <p class="text-[11px] text-slate-400 mt-1.5">Pon ticker y cantidad en cada inversión (lápiz) y pega tu clave gratis de finnhub.io.</p>
            </div>
        </section>`;
}

// Tarjeta plegable que recuerda si la dejaste abierta (se usa en Gráficas)
let sdOpen = {};
function sdk(key, title, inner) {
    return `<section class="${CARD} p-5"><details class="sdet sdh" style="margin:0" ${sdOpen[key] ? "open" : ""} ontoggle="sdOpen['${key}']=this.open?1:0;if(this.open&&typeof charts!='undefined')setTimeout(()=>charts.forEach(c=>c.resize()),30)"><summary>${title}</summary><div class="sdet-b pt-3">${inner}</div></details></section>`;
}
