// ===== Mi Plata · monedas.js =====
// 1) Cuentas en dólares / euros (viven en S.fx; los datos y helpers están en logica.js).
// 2) Historial editable de cada meta de ahorro (corregir fecha, monto, cuenta o borrar un aporte).

let fxOpen = null;   // cuenta en moneda extranjera con el detalle abierto
let fxAll = {};      // cuentas con el historial completo desplegado
let hOpen = {};      // metas con el historial desplegado
let hAll = {};       // metas con el historial completo (si no, solo los últimos 6)

const FX_CLS = { USD: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", EUR: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" };
const fxIb = (cl, fn, ic, t) => `<button onclick="${fn}" title="${t}" aria-label="${t}" class="w-8 h-8 ${cl} rounded-lg text-[11px] flex items-center justify-center shrink-0"><i class="fa-solid ${ic}"></i></button>`;
const fxCodeOf = label => String(label).startsWith("EUR") ? "EUR" : "USD";

// ---------- Cuentas en dólares / euros: pantalla ----------
function fxCard(a) {
    const b = fxBal(a), r = fxRate(a.c), sel = fxOpen == a.id, C = FXC[a.c];
    return `
        <button onclick="togFx(${a.id})" class="${CARD} lift p-4 text-left flex flex-col min-w-0 ${sel ? "!border-indigo-500 ring-2 ring-indigo-500/30" : ""}">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${FX_CLS[a.c]}"><i class="fa-solid ${C[2]}"></i></span>
            <span class="text-[11px] uppercase tracking-wider text-slate-400 truncate w-full">${esc(a.n)}</span>
            <b class="text-lg font-extrabold mt-0.5 truncate w-full ${b < 0 ? "text-rose-500" : "text-slate-800 dark:text-white"}">${fxFmt(a.c, b)}</b>
            <small class="text-[11px] text-slate-400 mt-0.5 truncate w-full">${r > 0 ? "≈ " + fmt(b * r) : "Falta la tasa del euro"}</small>
        </button>`;
}

function fxPanel(a) {
    const b = fxBal(a), r = fxRate(a.c), C = FXC[a.c], all = !!fxAll[a.id];
    const act = (cl, fn, t) => `<button onclick="${fn}" class="px-3 py-1.5 ${cl} rounded-xl text-xs font-semibold">${t}</button>`;
    const L = a.h.slice().sort((p, q) => q.d.localeCompare(p.d) || q.id - p.id), shown = all ? L : L.slice(0, 8);
    const rows = shown.map(x => `
        <div class="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="min-w-0"><span class="text-xs font-medium text-slate-700 dark:text-slate-200 block truncate">${esc(x.n || (x.v >= 0 ? "Entrada" : "Salida"))}</span><small class="text-[11px] text-slate-400">${dmy(x.d)}</small></div>
            <div class="flex items-center gap-1.5 shrink-0">
                <b class="text-xs mr-1 ${x.v >= 0 ? "text-emerald-500" : ""}">${x.v >= 0 ? "+" : "-"}${fxFmt(a.c, Math.abs(x.v))}</b>
                ${fxIb("bg-slate-100 dark:bg-slate-800", `fxEntryEdit(${a.id},${x.id})`, "fa-pen", "Editar")}
                ${fxIb("bg-slate-100 dark:bg-slate-800 text-rose-500", `fxEntryDel(${a.id},${x.id})`, "fa-trash", "Borrar")}
            </div>
        </div>`).join("");
    return `
        <section class="${CARD} p-5 mb-4">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${FX_CLS[a.c]}"><i class="fa-solid ${C[2]}"></i></span>
                <div class="min-w-0"><b class="text-sm font-bold text-slate-800 dark:text-white block truncate">${esc(a.n)}</b><small class="text-[11px] text-slate-400">Cuenta en ${C[0].toLowerCase()}</small></div>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-2">
                ${[["Saldo", fxFmt(a.c, b), b < 0 ? "text-rose-500" : ""], ["En pesos", r > 0 ? fmt(b * r) : "—", ""], [a.c == "EUR" ? "Pesos por €1" : "TRM", r > 0 ? fmtD(r) : "Sin tasa", ""]].map(([l, v, cl]) => `<div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 min-w-0"><span class="text-[10px] uppercase tracking-wider text-slate-400 block truncate">${l}</span><b class="text-xs ${cl}">${v}</b></div>`).join("")}
            </div>
            ${r > 0 ? "" : `<p class="text-[11px] text-amber-500 mb-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Escribe cuántos pesos vale 1 euro (botón «Editar») para ver esta cuenta en pesos y sumarla a tu patrimonio.</p>`}
            <p class="text-[11px] text-slate-400 mb-3">${a.c == "EUR" ? "La tasa del euro la cambias en «Editar» o en la pestaña Inversión." : "Usa la misma TRM de la pestaña Inversión."} Esta plata suma a tu patrimonio, pero no entra en «Disponible para gastar».</p>
            <div class="flex flex-wrap gap-2 mb-4">
                ${act("bg-emerald-50 text-emerald-600", `fxMove(${a.id},1)`, "＋ Meter")}
                ${act("bg-rose-50 text-rose-600", `fxMove(${a.id},-1)`, "－ Sacar")}
                ${act("bg-indigo-50 text-indigo-600", `fxAdj(${a.id})`, "Ajustar saldo")}
                ${act("bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300", `fxEdit(${a.id})`, "Editar")}
                ${act("bg-slate-100 dark:bg-slate-800 text-rose-500", `fxDel(${a.id})`, "Borrar")}
            </div>
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider pt-3 border-t border-slate-100 dark:border-slate-800">Historial · toca el lápiz para corregir</h4>
            ${rows || '<p class="text-xs text-slate-400 text-center py-4">Todavía no hay movimientos en esta cuenta.</p>'}
            ${L.length > 8 ? `<button onclick="fxAll[${a.id}]=${all ? 0 : 1};draw()" class="w-full mt-2 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">${all ? "Ver menos" : "Ver los " + L.length + " movimientos"}</button>` : ""}
        </section>`;
}

// Sección que vCue (vistas.js) pinta debajo de las cuentas en pesos
function fxSection() {
    if (fxOpen && !S.fx.some(a => a.id == fxOpen)) fxOpen = null;
    const open = S.fx.find(a => a.id == fxOpen);
    return `
        <div class="flex justify-between items-center mb-3 mt-6"><h3 class="text-base font-bold">Dólares y euros</h3></div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            ${S.fx.map(fxCard).join("")}
            <button onclick="newFx()" class="min-h-[140px] rounded-[20px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-indigo-500 transition px-2 text-center">
                <span class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center"><i class="fa-solid fa-plus"></i></span>
                <span class="text-xs font-semibold">Cuenta en USD / EUR</span>
            </button>
        </div>
        ${open ? fxPanel(open) : S.fx.length ? '<p class="text-[11px] text-slate-400 text-center mb-4">Toca una cuenta para ver y corregir su historial.</p>' : '<p class="text-[11px] text-slate-400 mb-4">Guarda aquí plata que tengas en dólares o euros. Se convierte a pesos con la TRM (o la tasa del euro) para el patrimonio.</p>'}`;
}

function togFx(id) { fxOpen = fxOpen == id ? null : id; walOpen = null; draw(); }

// ---------- Cuentas en dólares / euros: acciones ----------
function fxErr(n, own) {
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .\/-]{0,19}$/u.test(n)) return "Usa hasta 20 letras o números (sin comillas ni símbolos raros).";
    const taken = S.wal.map(a => a.n).concat(S.cards.map(c => c.n), S.fx.map(a => a.n)).filter(x => x != own).map(x => x.toLowerCase());
    if (taken.includes(n.toLowerCase())) return "Ya existe una cuenta o tarjeta con ese nombre.";
    return "";
}
const fxRateOk = v => v >= 100 && v <= 100000;
function newFx() {
    openCustomModal("Nueva cuenta en dólares o euros", [
        { l: "Nombre", p: "Ej. Wise, Cuenta en dólares" },
        { l: "Moneda", o: ["USD (dólares)", "EUR (euros)"] },
        { l: "¿Cuánto tiene hoy?", m: "decimal", p: "0" },
        { l: "Si es en euros: pesos por 1 euro", m: "decimal", v: S.eur ? tf(S.eur) : "", p: "Ej. 4600" }
    ], v => {
        const e = fxErr(v[0]); if (e) return e;
        const c = fxCodeOf(v[1]), amt = Math.round(pr(v[2]) * 100) / 100;
        if (amt < 0) return "El saldo no puede ser negativo.";
        if (c == "EUR") {
            const r = pr(v[3]);
            if (v[3] && !fxRateOk(r)) return "Escribe cuántos pesos vale 1 euro, por ejemplo 4600.";
            if (v[3]) S.eur = Math.round(r * 100) / 100;
        }
        const a = { id: Date.now(), n: v[0], c, h: [] };
        if (amt > 0) a.h.push({ id: a.id + 1, d: today(), v: amt, n: "Saldo inicial" });
        S.fx.push(a); fxOpen = a.id; walOpen = null; save();
    });
}
function fxEdit(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    const fields = [{ l: "Nombre", v: esc(a.n) }];
    if (a.c == "EUR") fields.push({ l: "Pesos por 1 euro", m: "decimal", v: S.eur ? tf(S.eur) : "" });
    openCustomModal("Editar cuenta en " + FXC[a.c][0].toLowerCase(), fields, v => {
        if (v[0] != a.n) { const e = fxErr(v[0], a.n); if (e) return e; }
        if (a.c == "EUR") { const r = pr(v[1]); if (v[1] && !fxRateOk(r)) return "Escribe cuántos pesos vale 1 euro, por ejemplo 4600."; S.eur = v[1] ? Math.round(r * 100) / 100 : 0; }
        a.n = v[0]; save();
    });
}
function fxDel(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    const b = fxBal(a);
    confirmAction("¿Borrar la cuenta " + esc(a.n) + "?" + (Math.abs(b) > 0.004 ? " Tiene " + fxFmt(a.c, b) + " que dejarán de sumar a tu patrimonio." : ""), () => {
        S.fx = S.fx.filter(x => x.id != id); if (fxOpen == id) fxOpen = null; save();
    });
}
function fxMove(id, s) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    openCustomModal((s > 0 ? "Meter a " : "Sacar de ") + esc(a.n), [
        { l: "Monto en " + (a.c == "EUR" ? "euros" : "dólares"), m: "decimal" },
        { l: "Fecha", t: "date", v: today() },
        { l: "Nota (opcional)", p: s > 0 ? "Ej. Pago de cliente" : "Ej. Compra en línea" }
    ], v => {
        const n = Math.round(pr(v[0]) * 100) / 100;
        if (!(n > 0)) return "Escribe un monto mayor a cero.";
        if (!v[1] || v[1] > today()) return "Elige una fecha de hoy o anterior.";
        if (s < 0 && n > fxBal(a) + 0.004) return "Solo tienes " + fxFmt(a.c, fxBal(a)) + " en esta cuenta.";
        a.h.push({ id: Date.now(), d: v[1], v: s * n, n: v[2] }); save();
    });
}
// "Ajustar saldo": dices cuánto hay de verdad y se guarda la diferencia como un movimiento (queda en el historial)
function fxAdj(id) {
    const a = S.fx.find(x => x.id == id); if (!a) return;
    openCustomModal("Ajustar saldo de " + esc(a.n), [{ l: "¿Cuánto hay en la cuenta hoy?", m: "decimal", v: tf(fxBal(a)) }], v => {
        if (v[0] === "") return "Escribe el saldo.";
        const t = Math.round(pr(v[0]) * 100) / 100;
        if (t < 0) return "El saldo no puede ser negativo.";
        const d = Math.round((t - fxBal(a)) * 100) / 100;
        if (d) a.h.push({ id: Date.now(), d: today(), v: d, n: "Ajuste de saldo" });
        save();
    });
}
function fxEntryEdit(aid, eid) {
    const a = S.fx.find(x => x.id == aid), x = a && a.h.find(y => y.id == eid); if (!x) return;
    openCustomModal("Corregir movimiento", [
        { l: "Tipo", o: ["Entrada", "Salida"], v: x.v < 0 ? "Salida" : "Entrada" },
        { l: "Monto en " + (a.c == "EUR" ? "euros" : "dólares"), m: "decimal", v: tf(Math.abs(x.v)) },
        { l: "Fecha", t: "date", v: x.d },
        { l: "Nota", v: esc(x.n || "") }
    ], v => {
        const n = Math.round(pr(v[1]) * 100) / 100;
        if (!(n > 0)) return "Escribe un monto mayor a cero.";
        if (!v[2] || v[2] > today()) return "Elige una fecha de hoy o anterior.";
        const nv = v[0] == "Salida" ? -n : n;
        if (fxBal(a) - x.v + nv < -0.004) return "Con ese cambio la cuenta quedaría en negativo.";
        x.v = nv; x.d = v[2]; x.n = v[3]; save();
    });
}
function fxEntryDel(aid, eid) {
    const a = S.fx.find(x => x.id == aid), x = a && a.h.find(y => y.id == eid); if (!x) return;
    if (fxBal(a) - x.v < -0.004) return showToast("Si borras eso la cuenta quedaría en negativo. Corrige o borra primero la salida.", true);
    confirmAction("¿Borrar este movimiento de " + (x.v >= 0 ? "+" : "-") + fxFmt(a.c, Math.abs(x.v)) + "?", () => { a.h = a.h.filter(y => y.id != eid); save(); });
}
// Tasa del euro (Ajustes), igual que setTrmVal
function setEurVal() {
    const v = pr(document.getElementById("eurInput").value);
    if (!fxRateOk(v)) return showToast("Escribe cuántos pesos vale 1 euro, por ejemplo 4600", true);
    S.eur = Math.round(v * 100) / 100; save(); showToast("Tasa del euro actualizada: " + fmtD(S.eur)); draw();
}

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
    confirmAction("¿Borrar este " + (x.i ? "saldo" : x.v > 0 ? "aporte" : "retiro") + " de " + fm(a, Math.abs(x.v)) + " (" + dmy(x.d) + ")?" + (!x.i && x.w ? " La plata " + (x.v > 0 ? "vuelve a" : "deja de salir de") + " la cuenta " + esc(wlabel(x.w)) + "." : ""), () => { S.sv = S.sv.filter(y => y.id != sid); save(); });
}
