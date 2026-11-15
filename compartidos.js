// ---------- Me deben y gastos compartidos ----------
// Libreta aparte de tus deudas: a quién le prestaste o quién te debe su parte de una cuenta.
// S.owe = [{ id, p: persona, a: monto, d: fecha, n: nota, ab: [{ id, d, a }] }]
const oweLeft = x => Math.max(0, x.a - (x.ab || []).reduce((s, v) => s + v.a, 0));
const oweTotal = () => (S.owe || []).reduce((s, x) => s + oweLeft(x), 0);
const OWE_NO = "No anotarlo en mis cuentas";

function oweUI() {
    const L = (S.owe || []).slice().sort((a, b) => (oweLeft(b) > 0) - (oweLeft(a) > 0) || b.id - a.id);
    const rows = L.map(x => {
        const left = oweLeft(x), done = x.a - left, p = x.a ? Math.min(100, done / x.a * 100) : 0;
        return `<div class="py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="flex justify-between items-start gap-3"><div class="min-w-0"><b class="text-sm text-slate-800 dark:text-white block truncate">${esc(x.p)}</b><small class="text-[11px] text-slate-400 block truncate">${x.n ? esc(x.n) + " · " : ""}${dmy(x.d)}</small></div>
            <b class="text-sm shrink-0 ${left > 0 ? "text-slate-800 dark:text-white" : "text-emerald-500"}">${left > 0 ? fmt(left) : "Pagado"}</b></div>
            ${done > 0 ? `<div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2"><div class="bg-emerald-500 h-full rounded-full" style="width:${p}%"></div></div><div class="text-[11px] text-slate-400 mt-1">Te han pagado ${fmt(done)} de ${fmt(x.a)}</div>` : ""}
            <div class="flex flex-wrap gap-2 mt-2">
                ${left > 0 ? `<button onclick="payOwe(${x.id})" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">Me pagó</button>` : ""}
                <button onclick="editOwe(${x.id})" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Editar</button>
                <button onclick="delOwe(${x.id})" aria-label="Borrar" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-rose-500 rounded-xl text-xs font-semibold"><i class="fa-solid fa-trash"></i></button>
            </div></div>`;
    }).join("");
    return `<section class="${CARD} p-5 mb-4">
        <div class="flex justify-between items-start gap-3 mb-1"><div><h3 class="text-base font-bold text-slate-800 dark:text-white">Me deben</h3><small class="text-[11px] text-slate-400">Préstamos y cuentas compartidas</small></div><b class="text-lg text-emerald-500 shrink-0">${fmt(oweTotal())}</b></div>
        <div class="flex flex-wrap gap-2 mt-3 mb-3"><button onclick="newOwe()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Alguien me debe</button><button onclick="splitBill()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold">Dividir una cuenta</button></div>
        ${rows || '<p class="text-xs text-slate-400">Nadie te debe nada por ahora. Aquí anotas lo que prestas y lo que tus amigos te deben de una cuenta compartida.</p>'}
    </section>`;
}
// "No anotarlo en mis cuentas" deja solo el apunte aquí; si eliges una cuenta, también queda como movimiento y su saldo se ajusta
function newOwe() {
    openCustomModal("Alguien me debe", [{ l: "¿Quién?", p: "Nombre" }, { l: "Monto", m: "numeric" }, { l: "Nota (opcional)", p: "Ej. almuerzo, arriendo" }, { l: "¿Salió de una de tus cuentas?", o: [OWE_NO].concat(WH) }], v => {
        const a = num(v[1]); if (!v[0]) return "Escribe el nombre."; if (!a) return "Escribe un monto válido.";
        const id = Date.now(); S.owe = (S.owe || []).concat([{ id, p: v[0].slice(0, 40), a, d: today(), n: v[2].slice(0, 60), ab: [] }]);
        if (v[3] != OWE_NO) S.items.push({ id: id + 1, d: today(), t: "g", c: "Otros", n: "Préstamo a " + v[0], a, k: "", w: v[3], q: 1, owe: id });
        save();
    });
}
function payOwe(id) {
    const x = (S.owe || []).find(o => o.id == id); if (!x) return;
    openCustomModal("Me pagó " + esc(x.p), [{ l: "Monto", v: oweLeft(x), m: "numeric" }, { l: "¿Entró a una de tus cuentas?", o: [OWE_NO].concat(WH) }], v => {
        const a = Math.min(num(v[0]), oweLeft(x)); if (!a) return "Escribe un monto válido.";
        x.ab = (x.ab || []).concat([{ id: Date.now(), d: today(), a }]);
        if (v[1] != OWE_NO) S.items.push({ id: Date.now() + 1, d: today(), t: "i", c: "Otro ingreso", n: "Pago de " + x.p, a, k: "", w: v[1], q: 1, owe: x.id });
        save(); showToast(oweLeft(x) > 0 ? "Anotado. Aún te debe " + fmt(oweLeft(x)) : "¡Saldado!");
    });
}
function editOwe(id) {
    const x = (S.owe || []).find(o => o.id == id); if (!x) return;
    openCustomModal("Editar", [{ l: "¿Quién?", v: x.p }, { l: "Monto total", v: x.a, m: "numeric" }, { l: "Nota (opcional)", v: x.n || "" }], v => {
        const a = num(v[1]); if (!v[0]) return "Escribe el nombre."; if (!a) return "Escribe un monto válido.";
        x.p = v[0].slice(0, 40); x.a = a; x.n = v[2].slice(0, 60); save();
    });
}
function delOwe(id) {
    confirmAction("¿Borrar este apunte? Los movimientos que ya anotaste en tus cuentas no se borran.", () => { S.owe = (S.owe || []).filter(o => o.id != id); save(); });
}
// Divide una cuenta en partes iguales. El gasto lo anotas normal en "Anotar movimiento"; aquí solo se apunta quién te debe su parte.
function splitBill() {
    openCustomModal("Dividir una cuenta", [{ l: "Total de la cuenta", m: "numeric" }, { l: "Personas en total (contándote)", v: 2, m: "numeric" }, { l: "¿Quiénes te deben? (separa con comas)", p: "Ana, Luis" }, { l: "Nota (opcional)", p: "Ej. cena del viernes" }], v => {
        const tot = num(v[0]), n = num(v[1]), names = v[2].split(",").map(s => s.trim()).filter(Boolean);
        if (!tot) return "Escribe el total de la cuenta."; if (n < 2) return "Deben ser al menos 2 personas.";
        if (!names.length) return "Escribe al menos un nombre.";
        if (names.length > n - 1) return "Hay más nombres que personas. Recuerda contarte tú.";
        const share = Math.round(tot / n), id = Date.now();
        S.owe = (S.owe || []).concat(names.map((p, i) => ({ id: id + i, p: p.slice(0, 40), a: share, d: today(), n: (v[3] || "Cuenta compartida").slice(0, 60), ab: [] })));
        save(); showToast("Cada uno te debe " + fmt(share));
    });
}
