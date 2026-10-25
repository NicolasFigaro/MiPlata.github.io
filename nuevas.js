// ===== Mi Plata · nuevas.js =====
// Funciones nuevas: 1) importar extracto del banco (CSV), 2) dividendos, ventas y evolución del portafolio, 3) Asistente (mini chat con IA).
// Se carga al final (después de respaldo.js). Usa las utilidades de logica.js / acciones.js (S, fmt, pr, save, draw, showModal, openCustomModal…).

S.invd = S.invd || [];   // dividendos: { id, inv, n, c, d, a }
S.invs = S.invs || [];   // ventas:     { id, inv, n, c, d, rec, cost, gain, f }
S.invh = S.invh || {};   // foto diaria del portafolio: { "2026-10-24": [valorCOP, invertidoCOP] }
S.csvm = S.csvm || {};   // lo que aprendió de tus categorías al importar: { "rappi restaurante": "Comida" }
S.ai = S.ai || {};       // { ok: true } = ya aceptaste que el resumen de tus datos se envía a la IA

const r2 = n => Math.round(n * 100) / 100;
const normTxt = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* =====================================================================
   1) IMPORTAR EXTRACTO DEL BANCO (CSV)
   ===================================================================== */
const CSV = { src: null, rows: [], acc: "", name: "", posExp: true, learned: 0 };
const CSV_G = [
    ["Comida", /rappi|restaur|corral|kfc|mcdonald|burger|pizza|exito|carulla|jumbo|\bd1\b|\bara\b|justo y bueno|olimpica|alkosto|panader|cafe|starbucks|juan valdez|domicilio|supermerc|frisby|crepes|sushi|helad|oxxo|tostao|almuerzo|mercado/],
    ["Transporte", /uber|didi|cabify|indrive|taxi|tullave|transmilenio|metro|gasolin|terpel|primax|esso|texaco|peaje|parqueader|beat|\bmio\b|soat/],
    ["Servicios", /claro|movistar|tigo|\bwom\b|\betb\b|\bepm\b|codensa|enel|emcali|acueduc|gas natural|vanti|internet|recarga|efigas|celsia|servicio publico/],
    ["Ocio", /netflix|spotify|disney|hbo|\bmax\b|cine|cinemark|royal films|steam|playstation|xbox|youtube|prime video|apple\.com|google play|twitch|discoteca|concierto|tuboleta|bar\b/],
    ["Compras", /amazon|mercadolibre|mercado libre|falabella|zara|h&m|nike|adidas|temu|shein|aliexpress|homecenter|decathlon|ikea|ktronix|alkomprar|tienda online/],
    ["Vivienda", /arriendo|administracion|predial|alquiler|inmobiliaria/],
    ["Deudas/Tarjeta", /cuota|tarjeta|credito|prestamo|pago tc|abono tc|intereses|cuota de manejo|cuota manejo/]
];
const CSV_I = [["Sueldo", /nomina|salario|sueldo|pago empleador/], ["Extra", /freelance|honorarios|consignacion|transferencia recibida/]];
const csvKey = s => normTxt(s).replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 2).slice(0, 2).join(" ");
function csvGuess(desc, t) {
    const k = csvKey(desc);
    if (k && S.csvm[k]) { const c = S.csvm[k], ok = t == "g" ? G.some(g => g[0] == c && c != "Ahorro") : I.includes(c); if (ok) return c; }
    const n = normTxt(desc);
    const hit = (t == "g" ? CSV_G : CSV_I).find(r => r[1].test(n));
    return hit ? hit[0] : t == "g" ? "Otros" : "Otro ingreso";
}
const csvText = buf => { let t = new TextDecoder("utf-8").decode(buf); if (t.indexOf("\uFFFD") >= 0) t = new TextDecoder("windows-1252").decode(buf); return t.replace(/^\uFEFF/, ""); };
// Texto → filas (detecta ; , tab o | y respeta las comillas)
function csvParse(t) {
    const lines = t.split(/\r?\n/).filter(l => l.trim()).slice(0, 15);
    const cnt = (ch, s) => s.split(ch).length - 1;
    const d = [";", ",", "\t", "|"].map(ch => [ch, lines.reduce((s, l) => s + cnt(ch, l), 0)]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (q) { if (c == '"') { if (t[i + 1] == '"') { cell += '"'; i++; } else q = false; } else cell += c; }
        else if (c == '"') q = true;
        else if (c == d) { row.push(cell); cell = ""; }
        else if (c == "\n" || c == "\r") { if (c == "\r" && t[i + 1] == "\n") i++; row.push(cell); cell = ""; if (row.some(x => x.trim())) rows.push(row); row = []; }
        else cell += c;
    }
    row.push(cell); if (row.some(x => x.trim())) rows.push(row);
    return rows;
}
function csvDate(s) {
    s = String(s || "").trim(); let m, y, mo, da;
    const MS = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
    if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) { y = +m[1]; mo = +m[2]; da = +m[3]; }
    else if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) { y = +m[3]; if (y < 100) y += 2000; da = +m[1]; mo = +m[2]; if (mo > 12 && da <= 12) { const z = da; da = mo; mo = z; } } // Colombia: día/mes/año
    else if ((m = normTxt(s).match(/^(\d{1,2})\s*(?:de\s+)?([a-z]{3})[a-z]*\.?\s*(?:de\s+)?(\d{4})/)) && MS[m[2]]) { da = +m[1]; mo = MS[m[2]]; y = +m[3]; }
    else return "";
    if (mo < 1 || mo > 12 || da < 1 || da > 31 || y < 2000 || y > 2100) return "";
    return y + "-" + String(mo).padStart(2, "0") + "-" + String(da).padStart(2, "0");
}
function csvAmt(s) {
    s = String(s == null ? "" : s).trim(); if (!/\d/.test(s)) return NaN;
    let v = pr(s); if ((/^\(.*\)$/.test(s) || /-\s*$/.test(s)) && v > 0) v = -v;
    return v;
}
// Filas → movimientos en bruto { d, desc, v (con signo), h ("g"/"i" si el archivo lo dice) }
function csvExtract(rows) {
    const re = { d: /fecha|date/, desc: /descrip|detalle|concepto|referencia|transac|comercio|merchant|movimiento|nota/, amt: /^(valor|monto|importe|amount|total)\b|^valor|^monto|^importe/, deb: /debito|retiro|cargo|egreso|salida|gasto/, cre: /credito|deposito|abono|ingreso|entrada/, typ: /^tipo|naturaleza|d\/c|^dc$|signo/ };
    let hi = rows.slice(0, 25).findIndex(r => r.some(c => re.d.test(normTxt(c))) && r.some(c => /valor|monto|importe|amount|debito|credito|retiro|deposito|cargo|abono/.test(normTxt(c))));
    let C = { d: -1, desc: -1, amt: -1, deb: -1, cre: -1, typ: -1 }, body;
    if (hi >= 0) {
        const H = rows[hi].map(c => normTxt(c).trim()); body = rows.slice(hi + 1);
        H.forEach((h, i) => { if (/saldo|balance/.test(h)) return; for (const k of ["d", "desc", "deb", "cre", "typ", "amt"]) if (C[k] < 0 && re[k].test(h)) { C[k] = i; break; } });
    } else { // sin encabezado: se adivina por el contenido
        body = rows; const n = Math.max(...rows.slice(0, 10).map(r => r.length)), sample = rows.slice(0, 10);
        C.d = [...Array(n).keys()].find(i => sample.some(r => csvDate(r[i]))) ?? -1;
        const nums = [...Array(n).keys()].filter(i => i != C.d && sample.filter(r => !isNaN(csvAmt(r[i]))).length >= Math.min(3, sample.length));
        C.amt = nums.length ? nums[nums.length > 1 ? nums.length - 2 : 0] : -1;
        C.desc = [...Array(n).keys()].filter(i => i != C.d && !nums.includes(i)).sort((a, b) => sample.reduce((s, r) => s + String(r[b] || "").length, 0) - sample.reduce((s, r) => s + String(r[a] || "").length, 0))[0] ?? -1;
    }
    if (C.d < 0 || (C.amt < 0 && C.deb < 0 && C.cre < 0)) return null;
    const out = [];
    body.forEach(r => {
        const d = csvDate(r[C.d]); if (!d) return;
        const desc = String(C.desc >= 0 ? r[C.desc] : "").replace(/\s+/g, " ").trim();
        let v = NaN, h = "";
        if (C.amt >= 0) v = csvAmt(r[C.amt]);
        if (C.deb >= 0 || C.cre >= 0) {
            const dv = C.deb >= 0 ? csvAmt(r[C.deb]) : NaN, cv = C.cre >= 0 ? csvAmt(r[C.cre]) : NaN;
            if (!isNaN(dv) && Math.abs(dv) > 0) { v = Math.abs(dv); h = "g"; } else if (!isNaN(cv) && Math.abs(cv) > 0) { v = Math.abs(cv); h = "i"; }
        }
        if (C.typ >= 0 && !h && !isNaN(v)) { const tp = normTxt(r[C.typ]); h = /deb|retiro|egreso|salida|compra|pago|cargo|^d$|^-$/.test(tp) ? "g" : /cred|deposito|abono|ingreso|entrada|^c$|^\+$/.test(tp) ? "i" : ""; if (h) v = Math.abs(v); }
        if (isNaN(v) || Math.round(Math.abs(v)) < 1) return;
        out.push({ d, desc: desc || "Movimiento del banco", v, h });
    });
    return out;
}
// Convierte lo extraído en filas de la vista previa (tipo, categoría, duplicados)
function csvBuild() {
    const src = CSV.src, allPos = src.every(x => x.h || x.v > 0);
    CSV.allPos = allPos && src.some(x => !x.h); // si el archivo ya separa débitos y créditos, no hace falta preguntar
    const have = {}; S.items.forEach(x => { const k = x.d + "|" + x.t + "|" + x.a; have[k] = (have[k] || 0) + 1; });
    CSV.rows = src.map(x => {
        const t = x.h || (allPos ? (CSV.posExp ? "g" : "i") : x.v < 0 ? "g" : "i"), a = Math.round(Math.abs(x.v)), k = x.d + "|" + t + "|" + a;
        const dup = have[k] > 0; if (dup) have[k]--;
        return { d: x.d, desc: x.desc, a, t, cat: csvGuess(x.desc, t), key: csvKey(x.desc), dup, sel: !dup };
    }).sort((p, q) => q.d.localeCompare(p.d));
    const isCard = S.cards.some(c => c.n == CSV.acc);
    if (isCard) CSV.rows.forEach(r => { if (r.t == "i") r.sel = false; });
}
function csvPick(inp) {
    const f = inp.files && inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
        try {
            const rows = csvParse(csvText(rd.result)), src = csvExtract(rows);
            if (!src || !src.length) { showToast("No pude leer ese archivo. Debe tener columnas de fecha y valor.", true); return; }
            CSV.src = src; CSV.name = f.name; CSV.posExp = true; CSV.acc = WH[0] || "";
            csvBuild(); showModal(csvUI());
        } catch (e) { showToast("No pude leer ese archivo", true); }
        inp.value = "";
    };
    rd.readAsArrayBuffer(f);
}
function csvUI() {
    const R = CSV.rows, isCard = S.cards.some(c => c.n == CSV.acc), sel = R.filter(r => r.sel);
    const g = sel.filter(r => r.t == "g").reduce((s, r) => s + r.a, 0), inc = sel.filter(r => r.t == "i").reduce((s, r) => s + r.a, 0), nd = R.filter(r => r.dup).length;
    const catsG = G.filter(x => x[0] != "Ahorro").map(x => x[0]);
    const op = (l, c) => l.map(x => `<option ${x == c ? "selected" : ""}>${esc(x)}</option>`).join("");
    const body = R.map((r, i) => `
        <div class="flex items-start gap-2.5 py-2.5 border-b border-slate-100 dark:border-slate-800 ${r.sel ? "" : "opacity-50"}">
            <input type="checkbox" ${r.sel ? "checked" : ""} ${r.t == "i" && isCard ? "disabled" : ""} onchange="csvTog(${i},this.checked)" class="mt-1 w-4 h-4 shrink-0 accent-indigo-600">
            <div class="min-w-0 flex-1">
                <div class="flex justify-between gap-2 text-xs"><span class="font-medium truncate">${esc(r.desc)}</span><b class="shrink-0 ${r.t == "i" ? "text-emerald-500" : ""}">${r.t == "i" ? "+" : "-"}${fmt(r.a)}</b></div>
                <div class="flex items-center justify-between gap-2 mt-1.5">
                    <span class="text-[11px] text-slate-400">${dmy(r.d)}${r.dup ? ' · <span class="text-amber-500 font-semibold">ya está registrado</span>' : ""}</span>
                    <select onchange="csvCat(${i},this.value)" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] max-w-[9.5rem]">${op(r.t == "g" ? catsG : I, r.cat)}</select>
                </div>
            </div>
        </div>`).join("");
    return `
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">Importar extracto</h3>
            <button onclick="closeModal()" aria-label="Cerrar" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-[11px] text-slate-400 mb-3 truncate">${esc(CSV.name)} · ${R.length} movimientos${nd ? " · " + nd + " ya registrados (desmarcados)" : ""}</p>
        <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">¿De qué cuenta o tarjeta es?</label>
        <select onchange="csvAcc(this.value)" class="${INP} mb-3"><optgroup label="Cuenta">${WH.map(w => `<option ${w == CSV.acc ? "selected" : ""}>${esc(w)}</option>`).join("")}</optgroup>${S.cards.length ? `<optgroup label="Tarjeta">${S.cards.map(c => `<option ${c.n == CSV.acc ? "selected" : ""}>${esc(c.n)}</option>`).join("")}</optgroup>` : ""}</select>
        ${CSV.allPos ? `<label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-3"><input type="checkbox" ${CSV.posExp ? "checked" : ""} onchange="csvFlip(this.checked)" class="w-4 h-4 accent-indigo-600">Todos los valores del archivo son gastos (desmarca si son ingresos)</label>` : ""}
        ${isCard ? '<p class="text-[11px] text-amber-500 mb-2">En una tarjeta solo se importan compras. Los pagos a la tarjeta anótalos con «Abonar» en Tarjetas.</p>' : ""}
        <div class="max-h-[42vh] overflow-y-auto -mx-1 px-1">${body}</div>
        <div class="flex justify-between text-xs pt-3 mt-1"><span class="text-slate-500">${sel.length} seleccionados</span><span class="font-semibold">${inc ? '<span class="text-emerald-500">+' + fmt(inc) + "</span> · " : ""}-${fmt(g)}</span></div>
        <button onclick="csvGo()" class="w-full mt-3 py-3 rounded-[14px] bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-sm ${sel.length ? "" : "opacity-50"}">Importar ${sel.length} movimiento${sel.length == 1 ? "" : "s"}</button>`;
}
const csvRedraw = () => { const c = document.getElementById("modalContainer"), l = c.querySelector(".overflow-y-auto"), y = l ? l.scrollTop : 0; c.innerHTML = csvUI(); const n = c.querySelector(".overflow-y-auto"); if (n) n.scrollTop = y; };
function csvTog(i, on) { CSV.rows[i].sel = on; csvRedraw(); }
function csvCat(i, c) { CSV.rows[i].cat = c; }
function csvAcc(v) { CSV.acc = v; if (S.cards.some(c => c.n == v)) CSV.rows.forEach(r => { if (r.t == "i") r.sel = false; }); csvRedraw(); }
function csvFlip(on) { CSV.posExp = on; csvBuild(); csvRedraw(); }
function csvGo() {
    const rows = CSV.rows.filter(r => r.sel); if (!rows.length) return showToast("No hay movimientos marcados", true);
    const isCard = S.cards.some(c => c.n == CSV.acc), base = Date.now() * 1000, ids = [];
    rows.forEach((r, i) => {
        const id = base + i; ids.push(id);
        S.items.push({ id, d: r.d, t: r.t, c: r.cat, n: r.desc.slice(0, 60), a: r.a, k: isCard ? CSV.acc : "", w: isCard ? "" : CSV.acc, q: 1 });
        if (r.key) S.csvm[r.key] = r.cat;
    });
    save();
    const last = rows.map(r => r.d).sort().pop(); cur = new Date(last + "T00:00:00"); cur.setDate(1);
    closeModal(); draw();
    showToast(rows.length + " movimientos importados", false, { label: "Deshacer", fn: () => { S.items = S.items.filter(x => !ids.includes(x.id)); save(); draw(); } });
}

/* =====================================================================
   2) INVERSIONES: dividendos, ventas (ganancia realizada) y evolución
   ===================================================================== */
const depositOpts = ["No anotar en mis cuentas"];
function divInv(id) {
    const x = S.inv.find(y => y.id == id); if (!x) return;
    openCustomModal("Dividendo de " + esc(x.n), [
        { l: "Monto recibido en " + x.c, m: "decimal" },
        { l: "Fecha", v: today(), t: "date" },
        { l: "¿Entró a una de tus cuentas?", o: depositOpts.concat(WH) }
    ], v => {
        const a = pr(v[0]); if (!(a > 0)) return "Escribe el monto del dividendo.";
        if (v[1] > today()) return "La fecha no puede ser futura.";
        const d = v[1] || today(), ev = { id: Date.now(), inv: x.id, n: x.n, c: x.c, d, a: r2(a) };
        S.invd.push(ev);
        if (WH.includes(v[2])) S.items.push({ id: Date.now() + 1, d, t: "i", c: "Otro ingreso", n: "Dividendo " + x.n, a: Math.max(1, Math.round(cop(a, x.c))), k: "", w: v[2], q: 1 });
        save(); showToast("Dividendo registrado");
    });
}
function sellInv(id) {
    const x = S.inv.find(y => y.id == id); if (!x) return;
    const byShares = !!(x.t && x.q > 0);
    openCustomModal("Vender " + esc(x.n), [
        { l: "Monto que recibiste en " + x.c, m: "decimal" },
        { l: "Fecha de la venta", v: today(), t: "date" },
        byShares ? { l: "Acciones vendidas (vacío = todas)", m: "decimal", p: "Tienes " + tf(x.q) } : { l: "% de la inversión que vendes (vacío = todo)", m: "decimal", p: "100" },
        { l: "¿Entró a una de tus cuentas?", o: depositOpts.concat(WH) }
    ], v => {
        const rec = pr(v[0]); if (!(rec > 0)) return "Escribe cuánto recibiste.";
        if (v[1] > today()) return "La fecha no puede ser futura.";
        let f = 1;
        if (byShares) { const qs = v[2] ? pq(v[2]) : x.q; if (!(qs > 0) || qs > x.q + 1e-9) return "Las acciones vendidas deben ser entre 0 y " + tf(x.q) + "."; f = Math.min(1, qs / x.q); }
        else { const p = v[2] ? pr(v[2]) : 100; if (!(p > 0) || p > 100) return "El porcentaje va entre 0 y 100."; f = p / 100; }
        const d = v[1] || today(), cost = r2(x.i * f), snap = JSON.parse(JSON.stringify(x));
        const sale = { id: Date.now(), inv: x.id, n: x.n, c: x.c, d, rec: r2(rec), cost, gain: r2(rec - cost), f: r2(f * 100) / 100 };
        S.invs.push(sale);
        if (f >= 0.9999) S.inv = S.inv.filter(y => y.id != x.id);
        else { x.h.forEach(l => { l.i = r2(l.i * (1 - f)); if (l.q) l.q = Math.round(l.q * (1 - f) * 1e8) / 1e8; }); x.v = r2(x.v * (1 - f)); syncInv(x); }
        let dep = null;
        if (WH.includes(v[3])) { dep = { id: Date.now() + 1, d, t: "i", c: "Otro ingreso", n: "Venta " + x.n, a: Math.max(1, Math.round(cop(rec, x.c))), k: "", w: v[3], q: 1 }; S.items.push(dep); }
        save();
        showToast((sale.gain >= 0 ? "Ganancia realizada: +" : "Pérdida realizada: ") + (x.c == "USD" ? fu(sale.gain) : fmt(sale.gain)), false, { label: "Deshacer", fn: () => {
            S.invs = S.invs.filter(y => y.id != sale.id); if (dep) S.items = S.items.filter(y => y.id != dep.id);
            S.inv = S.inv.filter(y => y.id != snap.id).concat([snap]); save(); draw();
        } });
    });
}
function delInvEv(kind, id) {
    confirmAction("¿Borrar este registro? Solo borra el apunte: no devuelve la inversión ni toca tus cuentas.", () => { if (kind == "d") S.invd = S.invd.filter(e => e.id != id); else S.invs = S.invs.filter(e => e.id != id); save(); });
}
const invCop = (n, c) => cop(n, c);
function invExtraLine(x) {
    const dv = S.invd.filter(e => e.inv == x.id).reduce((s, e) => s + e.a, 0), gn = S.invs.filter(e => e.inv == x.id).reduce((s, e) => s + e.gain, 0);
    if (!dv && !gn) return "";
    const mf = n => x.c == "USD" ? fu(n) : fmt(n);
    return `<div class="mt-2 text-[11px] text-slate-500 dark:text-slate-400">${dv ? "Dividendos " + mf(dv) : ""}${dv && gn ? " · " : ""}${gn ? "Ganancia realizada <b class='" + (gn >= 0 ? "text-emerald-500" : "text-rose-500") + "'>" + (gn >= 0 ? "+" : "") + mf(gn) + "</b>" : ""}</div>`;
}
function invExtraUI() {
    const dv = S.invd.reduce((s, e) => s + invCop(e.a, e.c), 0), gn = S.invs.reduce((s, e) => s + invCop(e.gain, e.c), 0);
    const ev = S.invd.map(e => ({ k: "d", e })).concat(S.invs.map(e => ({ k: "s", e }))).sort((a, b) => b.e.d.localeCompare(a.e.d) || b.e.id - a.e.id).slice(0, 8);
    if (!ev.length) return "";
    const mf = (n, c) => c == "USD" ? fu(n) : fmt(n);
    return `<section class="${CARD} p-5 mt-6">
        <h3 class="text-sm font-bold mb-3">Dividendos y ventas</h3>
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50"><span class="text-[10px] uppercase tracking-wider text-slate-400 block">Dividendos</span><b class="text-sm">${fmt(dv)}</b></div>
            <div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50"><span class="text-[10px] uppercase tracking-wider text-slate-400 block">Ganancia realizada</span><b class="text-sm ${gn >= 0 ? "text-emerald-500" : "text-rose-500"}">${gn >= 0 ? "+" : ""}${fmt(gn)}</b></div>
        </div>
        ${ev.map(({ k, e }) => `<div class="flex items-center justify-between gap-2 py-2 text-[11px] border-t border-slate-100 dark:border-slate-800">
            <div class="min-w-0"><span class="font-semibold text-slate-700 dark:text-slate-200">${dmy(e.d)}</span> · ${k == "d" ? "Dividendo" : "Venta"} · ${esc(e.n)}<br><span class="text-slate-400">${k == "d" ? "+" + mf(e.a, e.c) : "Recibiste " + mf(e.rec, e.c) + " · " + (e.gain >= 0 ? "ganancia " : "pérdida ") + mf(Math.abs(e.gain), e.c)}</span></div>
            <button onclick="delInvEv('${k}',${e.id})" aria-label="Borrar registro" class="p-1.5 text-slate-400 hover:text-rose-600 shrink-0"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>`).join("")}
    </section>`;
}
// Foto diaria del portafolio (se llama desde save()). Con ella se dibuja cuánto valía tu portafolio cada día.
function invSnap() {
    if (!S.inv.length) return;
    const P = invPortfolio(); S.invh[today()] = [Math.round(P.T), Math.round(P.C)];
    const ks = Object.keys(S.invh); if (ks.length > 900) ks.sort().slice(0, ks.length - 900).forEach(k => delete S.invh[k]);
}
// Serie para la gráfica: "Invertido" sale de tus compras (desde la primera), "Valor" de las fotos diarias (desde que existe esta función)
function invSeries() {
    const lots = []; S.inv.forEach(x => x.h.forEach(l => lots.push({ m: l.d.slice(0, 7), i: cop(l.i, x.c) })));
    const snaps = Object.keys(S.invh).sort();
    const first = [lots.map(l => l.m).sort()[0], snaps[0] && snaps[0].slice(0, 7)].filter(Boolean).sort()[0];
    if (!first) return null;
    const labels = []; let [y, m] = first.split("-").map(Number); const end = ym(new Date());
    for (let k = ym(new Date(y, m - 1, 1)); k <= end; ) { labels.push(k); m++; if (m > 12) { m = 1; y++; } k = ym(new Date(y, m - 1, 1)); }
    const inv = labels.map(k => r2(lots.filter(l => l.m <= k).reduce((s, l) => s + l.i, 0)));
    const val = labels.map(k => { const d = snaps.filter(s => s.slice(0, 7) == k).pop(); return d ? S.invh[d][0] : null; });
    return { labels: labels.slice(-24), inv: inv.slice(-24), val: val.slice(-24), n: snaps.length };
}
function invChartUI() {
    if (!S.inv.length) return "";
    return `<section class="${CARD} p-5"><h3 class="text-sm font-bold mb-1">Evolución del portafolio</h3>
        <p class="text-[11px] text-slate-400 mb-4">«Invertido» sale de tus compras. «Valor» se empieza a guardar con una foto diaria desde que abres la app, así que se irá llenando con el tiempo.</p>
        <canvas id="chInv"></canvas></section>`;
}
function drawInvChart(hy, GREEN) {
    const ci = document.getElementById("chInv"), sr = ci && invSeries(); if (!ci || !sr) return;
    charts.push(new Chart(ci, { type: "line", options: Object.assign({ spanGaps: true }, hy), data: { labels: sr.labels, datasets: [
        { label: "Valor", data: sr.val, borderColor: GREEN, backgroundColor: GREEN, tension: .3, pointRadius: 3 },
        { label: "Invertido", data: sr.inv, borderColor: accent(500), backgroundColor: accent(500), borderDash: [5, 4], tension: .2, pointRadius: 0 }
    ] } }));
}

/* =====================================================================
   3) ASISTENTE (mini chat con IA)
   ===================================================================== */
const AIK = "miplata_ai_key", AIM = "miplata_ai_model", AIC = "miplata_ai_chat";
const AI_MODELS = [["Rápido y económico (Haiku 5.5)", "claude-haiku-5-5"], ["Más listo (Sonnet 5.5)", "claude-sonnet-5-5"]];
const aiKey = () => { try { return localStorage.getItem(AIK) || ""; } catch (e) { return ""; } };
const aiModel = () => { try { return localStorage.getItem(AIM) || AI_MODELS[0][1]; } catch (e) { return AI_MODELS[0][1]; } };
const AI = { msgs: [], busy: false };
try { AI.msgs = JSON.parse(localStorage.getItem(AIC) || "[]").filter(m => m && (m.r == "user" || m.r == "assistant") && typeof m.t == "string").slice(-40); } catch (e) { AI.msgs = []; }
const aiSave = () => { try { localStorage.setItem(AIC, JSON.stringify(AI.msgs.slice(-40))); } catch (e) {} };
const aiMd = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^[-*•] /gm, "• ").replace(/\n/g, "<br>");

const AI_SYS = `Eres el asistente de "Mi Plata", una app de finanzas personales de un usuario en Colombia. Hablas en español colombiano informal, claro y amable.
Reglas:
- Responde corto: máximo unas 120 palabras, con frases cortas. Puedes usar listas simples con "- " y **negritas** para cifras clave.
- Usa SOLO los datos de abajo. Si algo no está en los datos, dilo en vez de inventarlo. Los montos son pesos colombianos (COP); escríbelos con puntos de miles, ej. $1.250.000.
- Si el usuario te cuenta un gasto o ingreso ("gasté 20 mil en almuerzo"), confirma en una frase y AL FINAL de tu respuesta agrega UNA línea exacta: [[ANOTAR {"t":"g","a":20000,"c":"Comida","n":"Almuerzo","w":"Efectivo"}]]
  t = "g" gasto o "i" ingreso; a = monto entero en pesos; c = categoría EXACTA de las listadas; n = nota corta; w = cuenta o tarjeta EXACTA de las listadas. Si falta el monto, pregúntalo y no pongas la línea. Nunca anotes nada que el usuario no haya dicho.
- No des asesoría legal ni de inversión personalizada; puedes dar ideas generales y señalar lo que ves en los números.`;

function aiContext() {
    const now = new Date(), mk = ym(now), pk = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const inM = k => S.items.filter(x => x.d.startsWith(k) && vis(x)), sm = (a, f) => a.filter(f).reduce((s, x) => s + x.a, 0);
    const cm = inM(mk), pm = inM(pk), L = [], f = n => Math.round(n).toLocaleString("es-CO");
    L.push("Hoy: " + today() + ". Mes en curso: " + mk + ".");
    L.push(`Este mes: ingresos $${f(sm(cm, x => x.t == "i"))}, gastos $${f(sm(cm, x => x.t == "g"))}. Mes anterior: ingresos $${f(sm(pm, x => x.t == "i"))}, gastos $${f(sm(pm, x => x.t == "g"))}.`);
    const cats = G.filter(g => g[0] != "Ahorro").map(([c]) => { const a = sm(cm, x => x.t == "g" && x.c == c && !x.s), b = sm(pm, x => x.t == "g" && x.c == c && !x.s), bu = budOf(c, mk); return a || b || bu ? `${c}: este mes $${f(a)}${bu ? " de presupuesto $" + f(bu) : ""}, mes anterior $${f(b)}` : ""; }).filter(Boolean);
    L.push("Gastos por categoría:\n" + (cats.join("\n") || "(sin gastos)"));
    L.push("Categorías disponibles para gastos: " + G.filter(g => g[0] != "Ahorro").map(g => g[0]).join(", ") + ". Para ingresos: " + I.join(", ") + ".");
    L.push("Cuentas (saldo): " + (S.wal.filter(a => !(S.hide || {})[a.n]).map(a => `${a.n} $${f(bal(a.n, mk))}`).join("; ") || "ninguna"));
    if (S.cards.length) L.push("Tarjetas: " + S.cards.map(c => { const u = cardUse(c, mk); return `${c.n} (cupo $${f(c.c || 0)}, usado ${Math.round(u.raw)}%, cuota del mes $${f(cardDue(c, mk))})`; }).join("; "));
    const goals = S.acc.filter(a => !a.f); if (goals.length) L.push("Metas de ahorro: " + goals.map(a => `${a.n} $${f(goalAll(a))}${a.g ? " de $" + f(a.g) : ""}${a.dl ? " (límite " + a.dl + ")" : ""}${a.u ? " [USD]" : ""}`).join("; "));
    if (S.dbt.length) L.push("Deudas: " + S.dbt.map(d => `${d.n} debes $${f(Math.max(0, dbtLeft(d)))}`).join("; "));
    if (S.inv.length) { const P = invPortfolio(); L.push(`Inversiones: portafolio $${f(P.T)} (invertido $${f(P.C)}). ` + S.inv.map(x => `${x.n} ${x.c} valor ${f(x.v)} invertido ${f(x.i)}`).join("; ") + `. Dividendos recibidos $${f(S.invd.reduce((s, e) => s + cop(e.a, e.c), 0))}; ganancia realizada $${f(S.invs.reduce((s, e) => s + cop(e.gain, e.c), 0))}.`); }
    const last = S.items.slice().sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id).slice(0, 25).map(x => `${x.d} ${x.t == "i" ? "ingreso" : x.t == "g" ? "gasto" : x.t == "p" ? "pago tarjeta" : "transferencia"} ${x.c}${x.n ? " «" + String(x.n).slice(0, 40) + "»" : ""} $${f(x.a)} (${x.k || x.w || "—"})`);
    L.push("Últimos movimientos:\n" + (last.join("\n") || "(ninguno)"));
    L.push("Cuentas y tarjetas válidas para anotar: " + WH.concat(S.cards.map(c => c.n)).join(", ") + ".");
    return L.join("\n");
}
// Resumen del mes sin IA (funciona sin clave y sin internet)
function aiLocal() {
    const now = new Date(), mk = ym(now), pk = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const inM = k => S.items.filter(x => x.d.startsWith(k) && vis(x)), sm = (a, f) => a.filter(f).reduce((s, x) => s + x.a, 0);
    const cm = inM(mk), pm = inM(pk), ing = sm(cm, x => x.t == "i"), gas = sm(cm, x => x.t == "g"), gasP = sm(pm, x => x.t == "g");
    if (!cm.length) return "Este mes todavía no tienes movimientos. Anota tu primer gasto o ingreso con el botón + y te hago el resumen.";
    const by = G.map(([c]) => [c, sm(cm, x => x.t == "g" && x.c == c && !x.s)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const L = [`**Resumen de ${now.toLocaleDateString(DLOC, { month: "long" })}**`, `- Ingresos: **${fmt(ing)}** · Gastos: **${fmt(gas)}**${ing > 0 ? " (" + Math.round(gas / ing * 100) + "% de lo que ingresó)" : ""}`];
    if (gasP > 0) { const d = gas - gasP; L.push(`- Frente al mes pasado (${fmt(gasP)}): ${d > 0 ? "gastas **" + fmt(d) + " más**" : d < 0 ? "gastas **" + fmt(-d) + " menos**" : "vas igual"}`); }
    if (by.length) L.push(`- Lo que más pesa: ${by.slice(0, 3).map(([c, v]) => c + " " + fmt(v)).join(", ")}`);
    const over = G.map(([c]) => [c, sm(cm, x => x.t == "g" && x.c == c && !x.s), budOf(c, mk)]).filter(x => x[2] > 0 && x[1] > x[2]);
    if (over.length) L.push(`- Te pasaste del presupuesto en: ${over.map(x => x[0]).join(", ")}`);
    const due = S.cards.reduce((s, c) => s + cardDue(c, mk), 0); if (due > 0.5) L.push(`- Tarjetas por pagar este mes: **${fmt(due)}**`);
    const gl = S.acc.filter(a => !a.f && a.g); if (gl.length) L.push(`- Metas: ${gl.slice(0, 3).map(a => a.n + " " + Math.min(100, Math.round(goalAll(a) / a.g * 100)) + "%").join(", ")}`);
    L.push("", "Para preguntas y consejos más personalizados, activa la IA con tu clave (botón de arriba).");
    return L.join("\n");
}
function aiBubble(m, i) {
    const me = m.r == "user";
    const act = m.act ? `<div class="mt-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-[11px]"><b>${m.act.t == "i" ? "Ingreso" : "Gasto"} ${fmt(m.act.a)}</b> · ${esc(m.act.c)}${m.act.n ? " · " + esc(m.act.n) : ""} · ${esc(m.act.w)}
        ${m.act.done ? '<span class="block mt-1 text-emerald-500 font-semibold">✓ Anotado</span>' : `<button onclick="aiDo(${i})" class="block mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold">Anotar</button>`}</div>` : "";
    return `<div class="flex ${me ? "justify-end" : "justify-start"}"><div class="max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${me ? "bg-indigo-600 text-white rounded-br-md" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md"}">${aiMd(m.t)}${act}</div></div>`;
}
function vAsist() {
    const has = !!aiKey(), chips = [["Resumen del mes", "Hazme un resumen de cómo voy este mes"], ["¿En qué gasto más?", "¿En qué categorías estoy gastando más y cómo va frente al mes pasado?"], ["¿Cómo van mis metas?", "¿Cómo van mis metas de ahorro y qué debería hacer para llegar a tiempo?"], ["Ideas para ahorrar", "Dame 3 ideas concretas para ahorrar según mis gastos"]];
    setTimeout(aiScroll, 30);
    return `
        <section class="${CARD} p-4">
            ${has ? `<p class="text-[11px] text-slate-400">Pregúntame por tus cuentas, gastos, metas o inversiones. También puedes decirme «gasté 20 mil en almuerzo» y te lo dejo listo para anotar.</p>`
                : `<div class="flex items-start gap-3"><span class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white" style="background:#32ADE6"><i class="fa-solid fa-comment-dots"></i></span><div class="min-w-0">
                    <p class="text-sm font-bold text-slate-800 dark:text-white">Activa el asistente con IA</p>
                    <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Necesita tu propia clave de Anthropic (se guarda solo en este celular). Mientras tanto puedes pedir el resumen rápido, que funciona sin IA.</p>
                    <button onclick="aiSetup()" class="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Poner mi clave</button></div></div>`}
        </section>
        <section class="${CARD} p-4">
            <div id="aiMsgs" class="space-y-3 min-h-[8rem]">${AI.msgs.length ? AI.msgs.map(aiBubble).join("") : '<p class="text-xs text-slate-400 text-center py-6">Toca una sugerencia o escribe abajo.</p>'}</div>
            <div class="flex gap-2 overflow-x-auto no-scrollbar pt-4 pb-1">${chips.map(([l, q]) => `<button onclick="aiChip(this.dataset.q)" data-q="${esc(q)}" class="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">${l}</button>`).join("")}</div>
            <form onsubmit="aiSend(event)" class="flex items-center gap-2 pt-2">
                <input id="aiIn" autocomplete="off" enterkeyhint="send" placeholder="Escríbele a tu asistente…" class="flex-1 min-w-0 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-full text-[16px] text-slate-800 dark:text-white">
                <button id="aiBtn" type="submit" aria-label="Enviar" class="w-11 h-11 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center"><i class="fa-solid fa-arrow-up"></i></button>
            </form>
            ${AI.msgs.length ? '<button onclick="aiClear()" class="mt-3 text-[11px] text-slate-400 font-semibold">Borrar conversación</button>' : ""}
        </section>`;
}
function aiScroll() { if (N[tab] == "Asistente" && AI.msgs.length) window.scrollTo(0, document.body.scrollHeight); }
function aiRender(scroll) { const el = document.getElementById("aiMsgs"); if (!el) return; el.innerHTML = AI.msgs.length ? AI.msgs.map(aiBubble).join("") + (AI.busy ? '<div class="text-xs text-slate-400 px-1">Pensando…</div>' : "") : ""; if (scroll) aiScroll(); }
function aiClear() { AI.msgs = []; aiSave(); draw(); }
function aiChip(q) {
    if (!aiKey() && /resumen/i.test(q)) { AI.msgs.push({ r: "user", t: "Resumen del mes" }, { r: "assistant", t: aiLocal() }); aiSave(); aiRender(true); return; }
    const i = document.getElementById("aiIn"); if (i) i.value = q; aiSend();
}
function aiSetup() {
    const mod = AI_MODELS.find(m => m[1] == aiModel()) || AI_MODELS[0];
    openCustomModal("Asistente con IA", [
        { l: "Clave de API de Anthropic (sk-ant-…) · vacío = quitarla", v: esc(aiKey()), p: "sk-ant-..." },
        { l: "Modelo", o: AI_MODELS.map(m => m[0]), v: mod[0] }
    ], v => {
        try {
            if (v[0]) { if (!/^sk-/.test(v[0])) return "La clave debe empezar por sk-"; localStorage.setItem(AIK, v[0]); localStorage.setItem(AIM, (AI_MODELS.find(m => m[0] == v[1]) || AI_MODELS[0])[1]); }
            else { localStorage.removeItem(AIK); }
        } catch (e) { return "No se pudo guardar en este navegador."; }
        showToast(v[0] ? "Asistente activado" : "Clave quitada");
    });
}
function aiConsent(then) {
    if (S.ai.ok) return then();
    showModal(`<h3 class="text-base font-bold text-slate-800 dark:text-white mb-2">Antes de usar la IA</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Cada vez que preguntas, la app envía a Anthropic un resumen de tus finanzas (saldos, categorías, metas, deudas, inversiones y tus últimos 25 movimientos con sus notas) para poder responderte. No se envía tu clave de otro servicio ni tu PIN. Se cobra a tu cuenta de Anthropic según el uso.</p>
        <div class="grid grid-cols-2 gap-3 mt-5"><button onclick="closeModal()" class="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">Cancelar</button>
        <button id="aiOk" class="py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">Entiendo, continuar</button></div>`);
    document.getElementById("aiOk").onclick = () => { S.ai.ok = true; save(); closeModal(); then(); };
}
function aiAction(txt) {
    const m = txt.match(/\[\[ANOTAR\s*(\{[\s\S]*?\})\s*\]\]/); if (!m) return { text: txt, act: null };
    const text = txt.replace(m[0], "").trim(); let a;
    try { a = JSON.parse(m[1]); } catch (e) { return { text, act: null }; }
    const t = a.t == "i" ? "i" : "g", amt = Math.round(Number(a.a)), cats = t == "g" ? G.filter(g => g[0] != "Ahorro").map(g => g[0]) : I;
    const w = WH.concat(S.cards.map(c => c.n)).includes(a.w) && (t == "g" || WH.includes(a.w)) ? a.w : null;
    if (!(amt > 0) || !w) return { text, act: null };
    return { text, act: { t, a: amt, c: cats.includes(a.c) ? a.c : t == "g" ? "Otros" : "Otro ingreso", n: String(a.n || "").slice(0, 60), w, d: /^\d{4}-\d{2}-\d{2}$/.test(a.d || "") && a.d <= today() ? a.d : today() } };
}
function aiDo(i) {
    const m = AI.msgs[i]; if (!m || !m.act || m.act.done) return;
    const a = m.act, isCard = S.cards.some(c => c.n == a.w) && !WH.includes(a.w);
    S.items.push({ id: Date.now(), d: a.d, t: a.t, c: a.c, n: a.n, a: a.a, k: isCard ? a.w : "", w: isCard ? "" : a.w, q: 1 });
    a.done = true; aiSave(); save(); cur = new Date(a.d + "T00:00:00"); cur.setDate(1); buzz(); showToast("Movimiento anotado"); aiRender(false);
}
async function aiSend(e) {
    if (e) e.preventDefault();
    const inp = document.getElementById("aiIn"), text = inp ? inp.value.trim() : ""; if (!text || AI.busy) return;
    if (!aiKey()) { inp.value = ""; AI.msgs.push({ r: "user", t: text }, { r: "assistant", t: /resumen/i.test(text) ? aiLocal() : "Para responderte eso necesito la IA activada. Toca «Poner mi clave» arriba. Mientras tanto, escribe «resumen» y te muestro cómo vas." }); aiSave(); draw(); return; }
    aiConsent(() => aiGo(text));
}
async function aiGo(text) {
    const inp = document.getElementById("aiIn"); if (inp) inp.value = "";
    AI.msgs.push({ r: "user", t: text }); AI.busy = true; aiSave(); aiRender(true);
    const btn = document.getElementById("aiBtn"); if (btn) btn.disabled = true;
    try {
        // La API pide turnos alternados que empiecen con el usuario: se juntan los consecutivos del mismo rol
        const hist = []; AI.msgs.slice(-12).forEach(m => { const l = hist[hist.length - 1]; if (l && l.role == m.r) l.content += "\n" + m.t; else hist.push({ role: m.r, content: m.t }); });
        while (hist.length && hist[0].role != "user") hist.shift();
        const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": aiKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
            body: JSON.stringify({ model: aiModel(), max_tokens: 700, system: AI_SYS + "\n\nDATOS ACTUALES DEL USUARIO:\n" + aiContext(), messages: hist })
        });
        if (!r.ok) {
            let em = ""; try { em = (await r.json()).error.message || ""; } catch (x) {}
            throw new Error(r.status == 401 ? "La clave no es válida. Revísala en Ajustes → Asistente." : r.status == 429 ? "Estás haciendo muchas preguntas seguidas o tu cuenta alcanzó su límite. Intenta en un momento." : r.status == 404 ? "Ese modelo no está disponible para tu clave. Cambia el modelo en Ajustes → Asistente." : "No pude responder (" + r.status + "). " + em.slice(0, 120));
        }
        const j = await r.json(), raw = (j.content || []).filter(b => b.type == "text").map(b => b.text).join("\n").trim() || "No supe qué responder, ¿me lo preguntas de otra forma?";
        const { text: t, act } = aiAction(raw);
        AI.msgs.push({ r: "assistant", t: t || "Listo, revisa y confirma:", act });
    } catch (err) {
        const off = !navigator.onLine || /Failed to fetch|NetworkError|Load failed/i.test(String(err.message));
        AI.msgs.push({ r: "assistant", t: off ? "No tengo conexión para hablar con la IA. Revisa tu internet." : err.message });
    }
    AI.busy = false; aiSave(); aiRender(true);
    const b2 = document.getElementById("aiBtn"); if (b2) b2.disabled = false;
}

/* =====================================================================
   Ajustes: tarjetas de «Importar extracto» y «Asistente»
   ===================================================================== */
function setNuevas(card) {
    const has = !!aiKey();
    return `
        <section class="${card}"><h3 class="text-base font-bold">Importar extracto del banco</h3>
            <p class="text-xs text-slate-400">Sube el archivo .csv que descargas de la página de tu banco o de Nequi. La app detecta las columnas, sugiere categorías (aprende de tus cambios) y te deja revisar antes de importar. Lo que ya tienes registrado no se duplica.</p>
            <input type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" onchange="csvPick(this)" class="block w-full text-xs text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-slate-800 file:text-white file:font-semibold file:text-xs">
        </section>
        <section class="${card}"><h3 class="text-base font-bold">Asistente con IA</h3>
            <p class="text-xs text-slate-400">${has ? "Clave guardada en este celular. No entra en las copias de seguridad." : "Un chat que responde sobre tus finanzas y te resume el mes. Usa tu propia clave de Anthropic (console.anthropic.com → API keys). Te recomiendo ponerle un límite de gasto allá."}</p>
            <div class="flex flex-wrap gap-2"><button onclick="aiSetup()" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">${has ? "Cambiar clave o modelo" : "Poner mi clave"}</button>
            <button onclick="goTab(N.indexOf('Asistente'))" class="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs">Abrir el chat</button></div>
        </section>`;
}

// ---------- Registro de la pantalla nueva ----------
N.push("Asistente"); V.push(vAsist); MORE.unshift(N.length - 1);
MORE_IC["Asistente"] = ["fa-comment-dots", "#32ADE6"];
