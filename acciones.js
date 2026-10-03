// ===== Mi Plata · acciones.js =====
// Todo lo que el usuario hace (botones, formularios, modales) y el arranque de la app.

// ---------- Pintar la pantalla ----------
function draw() {
    document.getElementById("navTabs").innerHTML = N.map((n, i) => `
        <button onclick="goTab(${i})" class="px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${i === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}">${n}</button>
    `).join("");

    document.getElementById("appMain").innerHTML = V[tab]();
    if (keep && tab == 0) restoreForm();
    if (tab == 3) drawCharts();
    if (tab == 4) runCupoAnim();
    if (anim) { anim = false; const m = document.getElementById("appMain"); m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter"); countUp(); }
}
function go(n) { cur.setMonth(cur.getMonth() + n); draw(); }
function goTab(i) { tab = i; anim = true; draw(); window.scrollTo(0, 0); }
function openModalExport() { goTab(N.length - 1); }

function applyTh() {
    const isDark = S.th.m == "dark" || (S.th.m == "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
}
function toggleDarkMode() { S.th.m = S.th.m == "dark" ? "light" : "dark"; save(); applyTh(); draw(); }

// Temas de color (las paletas viven en tema.js)
function setMode(m) { S.th.m = m; save(); applyTh(); draw(); }
function setTheme(id) { S.th.t = id; save(); applyTheme(S.th); draw(); }
function previewCustom(c) { S.th.t = "custom"; S.th.c = c; applyTheme(S.th); } // mientras arrastras el selector: solo se ve, no se guarda
function setCustom(c) { S.th.t = "custom"; S.th.c = c; save(); applyTheme(S.th); draw(); }

// Modo incógnito: oculta las cifras (ver masked() en logica.js) y desenfoca los campos con montos
function applyMask() {
    const on = masked(), i = document.getElementById("maskIcon"), b = document.getElementById("maskBtn");
    document.body.classList.toggle("mask", on);
    if (i) i.className = "fa-solid " + (on ? "fa-eye-slash text-indigo-500" : "fa-eye");
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
}
function togMask() { S.th.mask = !S.th.mask; save(); applyMask(); draw(); showToast(masked() ? "Modo incógnito activado: cifras ocultas" : "Cifras visibles de nuevo"); }

// ---------- Simulador "¿Puedo permitírmelo?" ----------
function openSim() {
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = simUI();
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
    simCalc();
}
function simPay() {
    const p = document.getElementById("sPay").value;
    document.getElementById("sCardOpts").classList.toggle("hidden", WH.includes(p));
    simCalc();
}
function simCalc() {
    const g = id => document.getElementById(id), out = g("simRes");
    if (!out) return;
    const a = num(g("sAmt").value);
    if (!a) { out.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Escribe el valor de la compra para ver cómo te afecta.</p>'; return; }
    const q = Math.max(1, num(g("sQ").value) || 1), ni = g("sI").value.startsWith("Sin") ? 1 : 0;
    out.innerHTML = simResUI(simulate(a, g("sCat").value, g("sPay").value, q, ni));
}

// Anima la barra y el % del cupo desde el valor anterior hasta el nuevo
function runCupoAnim() {
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("#appMain .cupo-bar").forEach(el => { void el.offsetWidth; el.style.width = el.dataset.to + "%"; });
    document.querySelectorAll("#appMain .cupo-pct").forEach(el => {
        const a = +el.dataset.from, b = +el.dataset.to, t0 = performance.now();
        if (rm || a === b) { el.textContent = Math.round(b) + "%"; return; }
        const step = now => { const k = Math.min(1, (now - t0) / 900); el.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3))) + "%"; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
    });
}
function countUp() {
    if (masked() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll("#appMain h2.text-3xl, #appMain div.text-3xl, #appMain h4.text-lg").forEach(el => {
        const t = el.textContent.trim();
        if (!/^-?\$/.test(t)) return;
        const to = (t[0] == "-" ? -1 : 1) * Number(t.replace(/\D/g, "")), t0 = performance.now();
        const step = now => { const k = Math.min(1, (now - t0) / 700); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
    });
}

// ---------- Modales ----------
function openCustomModal(title, fields, onSubmitCallback) {
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">${title}</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="customForm" class="space-y-3">
            ${fields.map((f, i) => `
                <div>
                    <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">${f.l}</label>
                    ${f.o ? `
                        <select name="f${i}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm">
                            ${f.o.map(x => `<option ${x == f.v ? "selected" : ""}>${x}</option>`).join("")}
                        </select>
                    ` : `
                        <input name="f${i}" type="${f.t || "text"}" inputmode="${f.m || "text"}" value="${f.v ?? ""}" placeholder="${f.p || ""}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" autocomplete="off">
                    `}
                </div>
            `).join("")}
            <p class="text-rose-500 text-xs min-h-[16px]" id="modalError"></p>
            <div class="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition">Cancelar</button>
                <button type="submit" class="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition">Aceptar</button>
            </div>
        </form>
    `;
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);

    document.getElementById("customForm").onsubmit = e => {
        e.preventDefault();
        const form = document.getElementById("customForm");
        const vals = fields.map((f, i) => form.elements["f" + i].value.trim());
        const res = onSubmitCallback(vals);
        if (typeof res === "string") document.getElementById("modalError").textContent = res;
        else { closeModal(); draw(); }
    };
}
function closeModal() {
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    modal.classList.add("opacity-0");
    container.classList.remove("scale-100"); container.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
}
function confirmAction(msg, cb) {
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = `
        <p class="text-sm text-slate-800 dark:text-white font-medium mb-5">${msg}</p>
        <div class="grid grid-cols-2 gap-3">
            <button onclick="closeModal()" class="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">Cancelar</button>
            <button id="okConfirmBtn" class="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-500/20">Sí, borrar</button>
        </div>
    `;
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); }, 10);
    document.getElementById("okConfirmBtn").onclick = () => { closeModal(); cb(); draw(); };
}
let toastTimer;
function showToast(msg, warn) {
    const t = document.getElementById("toast");
    document.getElementById("toastMessage").textContent = msg;
    document.getElementById("toastIcon").className = "fa-solid " + (warn ? "fa-triangle-exclamation text-amber-400" : "fa-circle-check text-emerald-400");
    t.classList.remove("translate-y-20", "opacity-0");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("translate-y-20", "opacity-0"), warn ? 5000 : 3000);
}
function fa(e) { const v = e.value.replace(/\D/g, ""); e.value = v ? Number(v).toLocaleString("es-CO") : ""; }

// ---------- Buscador y filtros ----------
function refreshList() { const el = document.getElementById("movList"); if (el) el.innerHTML = movListHTML(); }
function setQ(v) { sqry = v; refreshList(); }
function clearQ() { sqry = ""; draw(); }
function togAll(v) { sall = v; draw(); }
function setFlt(k, v) { flt = { k, v: v ?? null }; draw(); }
function setCmp(v) { cmp = +v || 1; draw(); }

// ---------- Detalle de categoría (toca una categoría para ver sus compras) ----------
let cdet = null; // { c: nombre, from, to } ("" = sin límite)
function openCat(c) {
    const y = cur.getFullYear(), m = cur.getMonth(); // arranca en el mes que estás viendo
    cdet = { c, from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) };
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = catUI();
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
}
function catQuick(k) { const r = catRanges()[k]; cdet.from = r[0]; cdet.to = r[1]; document.getElementById("modalContainer").innerHTML = catUI(); }
function setCatDates() {
    cdet.from = document.getElementById("cdFrom").value; cdet.to = document.getElementById("cdTo").value;
    document.getElementById("modalContainer").innerHTML = catUI();
}

// ---------- Movimientos ----------
function setType(t) {
    const g = id => document.getElementById(id), a = g("amt") ? g("amt").value : "", n = g("note") ? g("note").value : "";
    type = t; draw();
    g("amt").value = a; g("note").value = n;
}
function setDest(v) {
    const g = id => document.getElementById(id);
    g("payCard").classList.toggle("hidden", v != "card"); g("saveAcc").classList.toggle("hidden", v != "save");
    g("debtSel").classList.toggle("hidden", v != "debt"); g("destAmt").classList.toggle("hidden", !v);
}
// Muestra cuotas/interés solo si el gasto es con tarjeta; si es meta de ahorro, muestra el saldo de la meta
function togCardOpts() {
    const s = document.getElementById("cardSel"), o = document.getElementById("cardOpts");
    if (!s || !o) return;
    const isMeta = s.value.startsWith("meta:");
    o.classList.toggle("hidden", WH.includes(s.value) || isMeta);
    cuotaPreview();
    metaPreview();
}
function cuotaPreview() {
    const g = id => document.getElementById(id), p = g("cqPrev");
    if (!p || !g("cardSel")) return;
    const a = num(g("amt").value), q = Math.max(1, num(g("cq").value) || 1), sel = g("cardSel").value, c = S.cards.find(x => x.n == sel);
    if (!c || !a || q < 2) { p.textContent = ""; return; }
    const con = g("ci").value.startsWith("Con"), i = con && c.ir > 0 ? c.ir / 100 : 0, C = pmt(a, q, i);
    p.textContent = q + " cuotas de " + fmt(C) + (i > 0 ? " · intereses totales " + fmt(C * q - a) : con && !c.ir ? " · esta tarjeta no tiene tasa registrada (Tarjetas → Editar)" : " · sin intereses");
}
// Si eligieron una meta de ahorro como origen, avisa cuánto hay disponible ahí
function metaPreview() {
    const g = id => document.getElementById(id), p = g("metaPrev"), s = g("cardSel");
    if (!p || !s) return;
    if (!s.value.startsWith("meta:")) { p.textContent = ""; return; }
    const acc = S.acc.find(x => x.id == Number(s.value.slice(5)));
    if (!acc) { p.textContent = ""; return; }
    const disp = goalTotal(acc) * (acc.u ? S.trm : 1), amt = num(g("amt").value);
    p.textContent = "Tienes " + fmt(disp) + " en esta meta" + (amt > disp ? " · quedaría en negativo, revisa el monto" : "");
}

function addMov() {
    const g = id => document.getElementById(id), er = t => { g("msg").textContent = t; };
    const a = num(g("amt").value);
    if (!a) return er("Escribe un monto mayor a cero.");
    const d = g("date").value || today(), note = g("note").value.trim(), cat = g("cat").value;
    const rawSel = type == "g" ? g("cardSel").value : "";
    const isMeta = rawSel.startsWith("meta:"), isW = !isMeta && WH.includes(rawSel);
    const savAcc = isMeta ? S.acc.find(x => x.id == Number(rawSel.slice(5))) : null;
    const card = (!isMeta && !isW) ? rawSel : "";
    const wh = type == "i" ? g("whSel").value : (isW ? rawSel : "");
    const cq = card && g("cq") && g("cq").value ? Math.max(1, num(g("cq").value)) : 1;
    const cObj = card ? S.cards.find(c => c.n == card) : null;
    const ni = card && cq > 1 && g("ci") && g("ci").value == "Sin interés" ? 1 : 0;
    const ir = cObj && cq > 1 && !ni ? (cObj.ir || 0) : 0; // la tasa queda guardada con la compra

    const ds = type == "i" && g("dest") ? g("dest").value : "", da = ds ? num(g("destAmt").value) : 0;
    let pa = 0, pcSel = "", ac = null, db = null;
    if (ds == "card") {
        pcSel = g("payCard").value;
        pa = Math.min(a, da || cardNext(S.cards.find(c => c.n == pcSel)).due);
        if (!(pa > 0)) return er("Esa tarjeta no tiene cuota pendiente.");
    } else if (ds == "save") {
        ac = S.acc.find(x => x.id == g("saveAcc").value); pa = Math.min(a, da || a);
    } else if (ds == "debt") {
        db = S.dbt.find(x => x.id == g("debtSel").value); pa = Math.min(a, da || dbtLeft(db));
        if (!(pa > 0)) return er("Esa deuda ya está pagada.");
    }
    const bk = d.slice(0, 7), bud = type == "g" ? budOf(cat, bk) : 0, before = bud ? catSpent(cat, bk) : 0;
    S.items.push({ id: Date.now(), d, t: type, c: cat, n: note, a, k: card, w: wh, q: cq, ni, ir, sav: savAcc ? savAcc.id : undefined });
    if (ds == "card") S.items.push({ id: Date.now() + 1, d, t: "p", c: "Pago tarjeta", n: "Pago " + pcSel, a: pa, k: "", pc: pcSel, w: wh, q: 1 });
    if (ds == "save") S.sv.push({ id: Date.now() + 1, a: ac.id, d, v: ac.u ? pa / S.trm : pa, cp: pa, w: wh });
    if (ds == "debt") S.items.push({ id: Date.now() + 1, d, t: "g", c: "Deudas/Tarjeta", n: "Pago deuda: " + db.n, a: pa, k: "", w: wh, q: 1, dbt: db.id });
    // El gasto sale directo de una meta: se descuenta de ahí y no toca ninguna billetera
    if (savAcc) S.sv.push({ id: Date.now() + 1, a: savAcc.id, d, v: savAcc.u ? -(a / S.trm) : -a, cp: -a, w: "" });
    save();
    cur = new Date(d + "T00:00:00"); cur.setDate(1);
    // Aviso de presupuesto en el momento: al cruzar el 80% y al pasarte del 100%
    let warn = "";
    if (bud) {
        const r0 = before / bud, r1 = catSpent(cat, bk) / bud;
        if (r1 >= 1 && r0 < 1) warn = "Te pasaste del presupuesto de " + cat + " (" + fmt(catSpent(cat, bk)) + " de " + fmt(bud) + ")";
        else if (r1 >= 0.8 && r0 < 0.8) warn = "Ya llevas el " + Math.floor(r1 * 100) + "% del presupuesto de " + cat + ". Te quedan " + fmt(bud - catSpent(cat, bk));
    }
    showToast(warn || "Movimiento guardado exitosamente", !!warn);
    draw();
}
function delMovItem(id) { confirmAction("¿Borrar este movimiento?", () => { S.items = S.items.filter(y => y.id != id); save(); }); }
function editM(id) {
    const x = S.items.find(y => y.id == id); if (!x) return;
    openCustomModal("Editar movimiento", [
        { l: "Monto", v: x.a, m: "numeric" },
        { l: "Nota", v: esc(x.n) },
        { l: "Categoría", o: x.t == "g" ? G.filter(g => g[0] != "Ahorro").map(g => g[0]) : x.t == "p" ? ["Pago tarjeta"] : x.t == "tr" ? ["Transferencia"] : I, v: x.c },
        { l: "Fecha", v: x.d, t: "date" },
        { l: "¿Contar en el resumen de categorías?", o: ["Sí", "No"], v: x.s ? "No" : "Sí" }
    ], v => {
        const a = num(v[0]);
        if (!a) return "Escribe un monto mayor a cero.";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v[3])) return "Fecha inválida.";
        Object.assign(x, { a, n: v[1], c: v[2], d: v[3], s: v[4] == "No" ? 1 : 0 }); save();
    });
}
function newTransfer() {
    openCustomModal("Transferir entre billeteras", [{ l: "Desde", o: WH }, { l: "Hacia", o: WH, v: WH[1] }, { l: "Monto", m: "numeric" }], v => {
        const a = num(v[2]);
        if (v[0] == v[1]) return "Elige billeteras distintas.";
        if (!a) return "Escribe un monto válido.";
        S.items.push({ id: Date.now(), d: today(), t: "tr", c: "Transferencia", n: v[0].split(" ")[0] + " → " + v[1].split(" ")[0], a, k: "", w: v[0], to: v[1], q: 1 });
        save();
    });
}

// ---------- Categorías propias ----------
let keep = null; // lo que la persona ya había escrito en el formulario mientras creaba una categoría
const CAT_KINDS = ["Necesidad (cuenta en el 50%)", "Gusto (cuenta en el 30%)"];
function catErr(n, own) {
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .\/-]{0,19}$/u.test(n)) return "Usa hasta 20 letras o números (sin comillas ni símbolos raros).";
    const taken = G.map(g => g[0]).concat(I, ["Pago tarjeta", "Transferencia"]).filter(x => x != own).map(x => x.toLowerCase());
    if (taken.includes(n.toLowerCase())) return "Ya existe una categoría con ese nombre.";
    return "";
}
function newCat(snap) {
    openCustomModal("Nueva categoría", [{ l: "Nombre (ej. Mascota, Estudio)" }, { l: "¿Qué tipo de gasto es?", o: CAT_KINDS }], v => {
        const e = catErr(v[0]); if (e) return e;
        S.cat.push({ id: Date.now(), n: v[0], k: v[1].startsWith("Nec") ? "n" : "g" });
        syncG(); save();
        if (snap) keep = Object.assign({}, snap, { cat: v[0] });
    });
}
function editCat(id) {
    const c = S.cat.find(x => x.id == id); if (!c) return;
    openCustomModal("Editar categoría", [{ l: "Nombre", v: esc(c.n) }, { l: "Tipo", o: CAT_KINDS, v: CAT_KINDS[c.k == "n" ? 0 : 1] }], v => {
        const e = catErr(v[0], c.n); if (e) return e;
        if (v[0] != c.n) { // el cambio de nombre arrastra movimientos, presupuesto y gastos fijos
            S.items.forEach(x => { if (x.t == "g" && x.c == c.n) x.c = v[0]; });
            S.rec.forEach(r => { if (r.c == c.n) r.c = v[0]; });
            if (S.bud[c.n]) { S.bud[v[0]] = S.bud[c.n]; delete S.bud[c.n]; }
            if (S.budr[c.n]) { S.budr[v[0]] = S.budr[c.n]; delete S.budr[c.n]; }
            Object.keys(S.budm).forEach(k => { if (S.budm[k][c.n]) { S.budm[k][v[0]] = S.budm[k][c.n]; delete S.budm[k][c.n]; } });
            c.n = v[0];
        }
        c.k = v[1].startsWith("Nec") ? "n" : "g";
        syncG(); save();
    });
}
function delCat(id) {
    const c = S.cat.find(x => x.id == id); if (!c) return;
    const n = S.items.filter(x => x.t == "g" && x.c == c.n).length;
    confirmAction("¿Borrar la categoría " + esc(c.n) + "?" + (n ? " Sus " + n + " movimientos pasarán a «Otros»." : ""), () => {
        S.items.forEach(x => { if (x.t == "g" && x.c == c.n) x.c = "Otros"; });
        S.rec.forEach(r => { if (r.c == c.n) r.c = "Otros"; });
        delete S.bud[c.n]; delete S.budr[c.n];
        Object.keys(S.budm).forEach(k => { delete S.budm[k][c.n]; });
        S.cat = S.cat.filter(x => x.id != id);
        syncG(); save();
    });
}
// Desde el selector de Inicio: "＋ Nueva categoría…" guarda lo escrito, crea la categoría y la deja elegida
function catChange(sel) {
    if (sel.value != "__new") return;
    const g = id => document.getElementById(id), v = id => g(id) ? g(id).value : "";
    const snap = { amt: v("amt"), note: v("note"), date: v("date"), sel: v("cardSel") || v("whSel"), cq: v("cq"), ci: v("ci") };
    sel.selectedIndex = 0; // si cancela, no se queda en "Nueva categoría"
    newCat(snap);
}
function restoreForm() {
    const g = id => document.getElementById(id), k = keep; keep = null;
    const put = (id, val) => { if (g(id) && val != null && val !== "") g(id).value = val; };
    put("amt", k.amt); put("note", k.note); put("date", k.date); put("cat", k.cat);
    put(g("cardSel") ? "cardSel" : "whSel", k.sel); put("cq", k.cq); put("ci", k.ci);
    togCardOpts(); cuotaPreview(); metaPreview();
}

// ---------- Metas de ahorro ----------
function newAcc() {
    openCustomModal("Nueva Meta de Ahorro", [
        { l: "Nombre (ej. Viaje, Moto)" },
        { l: "Moneda", o: ["COP (pesos)", "USD (dólares)"] },
        { l: "Meta (monto)", m: "decimal" },
        { l: "Fecha límite (opcional)", t: "date" },
        { l: "Rendimiento anual E.A. % (0 si no gana)", v: "0", m: "decimal" },
        { l: "Ya tengo ahorrado (opcional)", m: "decimal" }
    ], v => {
        if (!v[0]) return "Escribe un nombre.";
        if (v[3] && v[3] <= today()) return "La fecha límite debe ser futura.";
        const u = v[1].startsWith("USD"), P = s => u ? (pr(s) || 0) : num(s), id = Date.now();
        S.acc.push({ id, n: v[0], g: P(v[2]), r: pr(v[4]) || 0, u: u ? 1 : 0, dl: v[3] || "", s0: today() });
        if (P(v[5])) S.sv.push({ id: id + 1, a: id, d: today(), v: P(v[5]), i: 1 });
        save();
    });
}
function editAcc(id) {
    const a = S.acc.find(x => x.id == id);
    openCustomModal("Editar Meta", [
        { l: "Nombre", v: esc(a.n) },
        { l: "Meta", v: tf(a.g), m: "decimal" },
        { l: "Fecha límite (opcional)", v: a.dl || "", t: "date" },
        { l: "Rendimiento E.A. %", v: tf(a.r), m: "decimal" }
    ], v => {
        if (v[0]) a.n = v[0];
        a.g = pr(v[1]); a.dl = v[2] || ""; a.r = pr(v[3]) || 0;
        save();
    });
}
function delAcc(id) { confirmAction("¿Borrar meta y sus movimientos?", () => { S.acc = S.acc.filter(x => x.id != id); S.sv = S.sv.filter(x => x.a != id); save(); }); }
function archAcc(id) { const a = S.acc.find(x => x.id == id); a.f = a.f ? 0 : 1; save(); draw(); }
// all = 1: "Sacar todo", deja escrito el saldo completo (lo ahorrado + el rendimiento ganado)
function mov(id, s, all) {
    const a = S.acc.find(x => x.id == id), U = a.u, K = U ? S.trm : 1;
    const full = all ? (U ? Math.floor(goalTotal(a) * 100) / 100 : Math.floor(goalTotal(a))) : 0;
    openCustomModal(s > 0 ? "Meter a " + esc(a.n) : (all ? "Sacar todo de " : "Sacar de ") + esc(a.n), [
        { l: s > 0 ? "¿De dónde sale?" : "¿A dónde regresa?", o: WH.map(w => w) },
        { l: U ? "Monto en USD" : "Monto", v: full > 0 ? tf(full) : "", m: "decimal" }
    ], v => {
        const w = WH.find(p => v[0].startsWith(p)), n = U ? pr(v[1]) : num(v[1]);
        if (!(n > 0)) return "Escribe un monto válido.";
        S.sv.push({ id: Date.now(), a: id, d: today(), v: s * n, cp: s * n * K, w });
        save();
    });
}

// ---------- Avisos: metas, tarjetas y deudas ----------
// Copia de los avisos en IndexedDB para que el service worker los lea aunque la app esté cerrada
const idb = () => new Promise((ok, no) => { if (!window.indexedDB) return no(); const r = indexedDB.open("miplata", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const kvGet = k => idb().then(db => new Promise(ok => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); })).catch(() => undefined);
const kvSet = (k, v) => idb().then(db => new Promise(ok => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = ok; t.onerror = ok; })).catch(() => {});
function mirrorEvents() {
    kvSet("events", reminderEvents());
    kvGet("sent").then(o => kvSet("sent", Object.assign({}, o || {}, S.nt)));
}
function notify(title, body, tag) {
    const fb = () => { try { new Notification(title, { body, icon: "icon-192.png", tag }); } catch (e) {} };
    try {
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
            navigator.serviceWorker.getRegistration().then(r => r ? r.showNotification(title, { body, icon: "icon-192.png", tag }) : fb()).catch(fb);
        } else fb();
    } catch (e) { fb(); }
}
function checkReminders() {
    if (typeof Notification == "undefined" || Notification.permission != "granted") return;
    kvGet("sent").then(sent => {
        sent = sent || {}; const td = today(); let ch = false;
        reminderEvents().forEach(e => {
            const days = daysTo(e.date);
            if (days > e.win || days < -7 || S.nt[e.key] == td || sent[e.key] == td) return;
            notify(e.title, remindBody(e, days), e.key);
            S.nt[e.key] = td; ch = true;
        });
        if (ch) save();
    });
}
// Chrome en Android (app instalada): pide al sistema despertar el service worker de vez en cuando
async function regPeriodic() {
    try {
        if (typeof Notification == "undefined" || Notification.permission != "granted" || !("serviceWorker" in navigator)) return;
        const r = await navigator.serviceWorker.ready;
        if (!r.periodicSync) return;
        const st = await navigator.permissions.query({ name: "periodic-background-sync" });
        if (st.state == "granted") await r.periodicSync.register("miplata-avisos", { minInterval: 12 * 3600 * 1000 });
    } catch (e) {}
}
function askNotif() {
    if (typeof Notification == "undefined") return showToast("Este navegador no permite notificaciones");
    Notification.requestPermission().then(p => { showToast(p == "granted" ? "Avisos activados" : "No se activaron los avisos"); checkReminders(); regPeriodic(); draw(); });
}
function testNotif() { notify("Mi Plata", "Los avisos funcionan ✓", "prueba"); }

// ---------- Inversiones ----------
function togUsd() { usd = !usd; S.th.u = usd; save(); draw(); }
function newInv() {
    openCustomModal("Nueva Inversión", [
        { l: "Nombre (ej. ETF S&P 500)" },
        { l: "Moneda", o: ["COP", "USD"] },
        { l: "Monto invertido", m: "decimal" },
        { l: "Fecha de inicio", v: today(), t: "date" },
        { l: "Tipo de activo (para el rebalanceo)", o: INV_KINDS, v: "Sin clasificar" }
    ], v => {
        const i = pr(v[2]);
        if (!v[0] || !(i > 0)) return "Escribe nombre y monto.";
        if (v[3] > today()) return "La fecha de inicio no puede ser futura.";
        S.inv.push({ id: Date.now(), n: v[0], c: v[1], i, v: i, d: v[3] || today(), k: invK(v[4]) }); save();
    });
}
function editInv(id) {
    const x = S.inv.find(y => y.id == id);
    openCustomModal("Editar inversión", [
        { l: "Nombre", v: esc(x.n) },
        { l: "Monto invertido en " + x.c, v: tf(x.i), m: "decimal" },
        { l: "Fecha de inicio", v: x.d, t: "date" },
        { l: "Tipo de activo (para el rebalanceo)", o: INV_KINDS, v: invLabel(x.k) }
    ], v => {
        const i = pr(v[1]);
        if (!v[0] || !(i > 0)) return "Escribe nombre y monto.";
        if (v[2] > today()) return "La fecha de inicio no puede ser futura.";
        x.n = v[0]; x.i = i; x.d = v[2] || x.d; x.k = invK(v[3]); save();
    });
}
function upInv(id) {
    const x = S.inv.find(y => y.id == id);
    openCustomModal("Actualizar valor", [{ l: "Valor actual en " + x.c, v: tf(x.v), m: "decimal" }], v => {
        const n = pr(v[0]); if (n >= 0) { x.v = n; save(); }
    });
}
function delInv(id) { confirmAction("¿Borrar inversión?", () => { S.inv = S.inv.filter(x => x.id != id); save(); }); }
// Rebalanceo: guarda el objetivo y recalcula solo la tabla (sin redibujar la pantalla, para no perder lo que escribes)
function rbCalc() {
    const el = document.getElementById("rbRes"), ap = document.getElementById("rbAp");
    if (el) el.innerHTML = rbResUI(ap ? num(ap.value) : 0);
}
function setRb(k, v) { S.rb[k] = Math.max(0, Math.min(100, pr(v) || 0)); save(); rbCalc(); }
function setTrmVal() {
    const v = pr(document.getElementById("trmInput").value);
    if (v > 0) { S.trm = v; save(); showToast("TRM actualizada"); draw(); }
}

// ---------- Tarjetas ----------
const FEE_KINDS = ["Cada mes", "Cada año"];
// Valida los datos de la cuota de manejo antes de guardar nada
function feeErr(amt, kind, mon) {
    if (!num(amt)) return "";
    if (kind == FEE_KINDS[1] && !(num(mon) >= 1 && num(mon) <= 12)) return "Escribe el mes del cobro anual (1 a 12).";
    return "";
}
// Guarda o quita la cuota de manejo. Empieza a contar desde el próximo pago (no cambia meses ya pasados).
function setFee(c, amt, kind, mon) {
    const a = num(amt);
    if (!a) { delete c.mf; delete c.mt; delete c.mm; delete c.mfs; return; }
    c.mf = a; c.mt = kind == FEE_KINDS[1] ? "a" : "m";
    if (c.mt == "a") c.mm = num(mon); else delete c.mm;
    if (!c.mfs) c.mfs = nextPayYm(c.p);
}
function newCard() {
    openCustomModal("Nueva Tarjeta", [
        { l: "Nombre" },
        { l: "Cupo total", m: "numeric" },
        { l: "Día de corte (1-31)", v: "15", m: "numeric" },
        { l: "Día límite pago (1-31)", v: "30", m: "numeric" },
        { l: "Tasa de interés mensual % (opcional, ej. 2,1)", m: "decimal" },
        { l: "Tasa de mora mensual % (opcional, ej. 2,6)", m: "decimal" },
        { l: "Cuota de manejo en pesos (opcional)", m: "numeric" },
        { l: "La cuota de manejo se cobra", o: FEE_KINDS },
        { l: "Mes del cobro anual, 1-12 (solo si es anual)", m: "numeric" }
    ], v => {
        if (!v[0]) return "Escribe un nombre.";
        const e = feeErr(v[6], v[7], v[8]); if (e) return e;
        const c = { id: Date.now(), n: v[0], c: num(v[1]), k: +v[2] || 15, p: +v[3] || 30, ir: pr(v[4]) || 0, mr: pr(v[5]) || 0, paid: {} };
        setFee(c, v[6], v[7], v[8]);
        S.cards.push(c);
        save();
    });
}
function editCard(id) {
    const c = S.cards.find(x => x.id == id);
    openCustomModal("Editar " + esc(c.n), [
        { l: "Cupo total", v: c.c || "", m: "numeric" },
        { l: "Día de corte (1-31)", v: c.k, m: "numeric" },
        { l: "Día límite pago (1-31)", v: c.p, m: "numeric" },
        { l: "Tasa mensual % (aplica a compras nuevas)", v: c.ir ? tf(c.ir) : "", m: "decimal" },
        { l: "Tasa de mora mensual % (opcional)", v: c.mr ? tf(c.mr) : "", m: "decimal" },
        { l: "Cuota de manejo en pesos (vacío = sin cuota)", v: c.mf || "", m: "numeric" },
        { l: "La cuota de manejo se cobra", o: FEE_KINDS, v: FEE_KINDS[c.mt == "a" ? 1 : 0] },
        { l: "Mes del cobro anual, 1-12 (solo si es anual)", v: c.mm || "", m: "numeric" }
    ], v => {
        const e = feeErr(v[5], v[6], v[7]); if (e) return e;
        c.c = num(v[0]); c.k = +v[1] || c.k; c.p = +v[2] || c.p; c.ir = pr(v[3]) || 0; c.mr = pr(v[4]) || 0;
        setFee(c, v[5], v[6], v[7]);
        save();
    });
}
// Extracto por corte: qué compras y cuotas entran en cada uno. Se recorre con ‹ ›
function openExtract(id, i) {
    const c = S.cards.find(x => x.id == id); if (!c) return;
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer"), b = stmtBounds(c);
    if (i == null) i = mIdx(cardNext(c).m);
    i = Math.max(b.lo, Math.min(b.hi, i));
    container.innerHTML = extractUI(c, i, b);
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
}
function payCard(id) {
    const c = S.cards.find(x => x.id == id), nm = ym(new Date());
    openCustomModal("Abonar a " + esc(c.n), [
        { l: "¿De dónde sale?", o: WH },
        { l: "Monto", v: Math.round(cardNext(c).due) || "", m: "numeric" }
    ], v => {
        const a = num(v[1]);
        if (!a) return "Escribe un monto válido.";
        S.items.push({ id: Date.now(), d: today(), t: "p", c: "Pago tarjeta", n: "Pago " + c.n, a, k: "", pc: c.n, w: v[0], q: 1 });
        save();
    });
}
function paidCard(id) { const c = S.cards.find(x => x.id == id); c.paid[ym(new Date())] = !c.paid[ym(new Date())]; save(); draw(); }
function delCard(id) { confirmAction("¿Borrar tarjeta?", () => { S.cards = S.cards.filter(x => x.id != id); save(); }); }

// ---------- Deudas ----------
function newDbt() {
    openCustomModal("Nueva deuda", [{ l: "Nombre (ej. Préstamo moto)" }, { l: "Monto total", m: "numeric" }, { l: "Ya pagado antes (opcional)", m: "numeric" }, { l: "Cuota mensual (opcional)", m: "numeric" }, { l: "Día de pago del mes 1-31 (opcional, activa avisos)", m: "numeric" }, { l: "Tasa de interés mensual % (opcional, para el plan de deudas)", m: "decimal" }], v => {
        const t = num(v[1]); if (!v[0] || !t) return "Escribe nombre y monto.";
        const dd = num(v[4]); if (v[4] && (dd < 1 || dd > 31)) return "El día de pago va entre 1 y 31.";
        S.dbt.push({ id: Date.now(), n: v[0], t, p0: num(v[2]), cu: num(v[3]), dd, ir: pr(v[5]) || 0 }); save();
    });
}
function editDbt(id) {
    const d = S.dbt.find(x => x.id == id);
    openCustomModal("Editar deuda", [{ l: "Nombre", v: esc(d.n) }, { l: "Monto total", v: d.t, m: "numeric" }, { l: "Cuota mensual (opcional)", v: d.cu || "", m: "numeric" }, { l: "Día de pago del mes 1-31 (opcional, activa avisos)", v: d.dd || "", m: "numeric" }, { l: "Tasa de interés mensual % (opcional, para el plan de deudas)", v: d.ir ? tf(d.ir) : "", m: "decimal" }], v => {
        const t = num(v[1]); if (!v[0] || !t) return "Escribe nombre y monto.";
        const dd = num(v[3]); if (v[3] && (dd < 1 || dd > 31)) return "El día de pago va entre 1 y 31.";
        d.n = v[0]; d.t = t; d.cu = num(v[2]); d.dd = dd; d.ir = pr(v[4]) || 0; save();
    });
}
function payDbt(id) {
    const d = S.dbt.find(x => x.id == id);
    openCustomModal("Abonar a " + esc(d.n), [{ l: "¿De dónde sale?", o: WH }, { l: "Monto", v: Math.round(dbtDue(d, ym(new Date())) || dbtLeft(d)) || "", m: "numeric" }], v => {
        const a = num(v[1]); if (!a) return "Escribe un monto válido.";
        S.items.push({ id: Date.now(), d: today(), t: "g", c: "Deudas/Tarjeta", n: "Pago deuda: " + d.n, a, k: "", w: v[0], q: 1, dbt: d.id }); save();
    });
}
// Plan de deudas: guarda el presupuesto mensual al salir del campo y recalcula solo la tabla mientras escribes
function dpCalc() {
    const el = document.getElementById("dpRes"), b = document.getElementById("dpB");
    if (el) el.innerHTML = planResUI(b ? num(b.value) : 0);
}
function setDp(v) { const n = num(v); if (n) S.dp.b = n; else delete S.dp.b; save(); dpCalc(); }
function delDbt(id) { confirmAction("¿Borrar deuda? Los abonos ya hechos quedan como gastos.", () => { S.dbt = S.dbt.filter(x => x.id != id); save(); }); }

// ---------- Ajustes ----------
function setBud(c, v) { const n = num(v), had = S.bud[c] > 0; if (n) S.bud[c] = n; else delete S.bud[c]; save(); if (had != !!n) setTimeout(draw, 0); }
// Presupuesto solo para el mes actual (el fijo de siempre no se toca). Vacío = vuelve al fijo.
function setBudMonth(c, v) {
    const k = ym(new Date()), n = num(v);
    if (n) { (S.budm[k] = S.budm[k] || {})[c] = n; } else if (S.budm[k]) { delete S.budm[k][c]; if (!Object.keys(S.budm[k]).length) delete S.budm[k]; }
    save();
}
// Acumular lo que sobre: desde este mes, lo que no gastes se suma al presupuesto del mes siguiente
function togBudRoll(c) { if (S.budr[c]) delete S.budr[c]; else S.budr[c] = ym(new Date()); save(); draw(); }
function setIni(i, v) { const n = num(v); if (n) S.ini[WH[i]] = n; else delete S.ini[WH[i]]; save(); }
function togHide(i) { const n = hideNames()[i]; if (S.hide[n]) delete S.hide[n]; else S.hide[n] = true; save(); }
const RECV = ["No, siempre es igual", "Sí, pregúntame el valor cada mes"];
function newRec() {
    const cs = G.filter(g => g[0] != "Ahorro").map(g => g[0]);
    openCustomModal("Nuevo gasto fijo", [{ l: "Nombre (ej. Arriendo)" }, { l: "Monto (si cambia, uno aproximado)", m: "numeric" }, { l: "Día del mes (1-28)", v: "1", m: "numeric" }, { l: "Categoría", o: cs }, { l: "Se paga con", o: WH.concat(S.cards.map(c => c.n)) }, { l: "¿El monto cambia cada mes? (luz, agua, celular…)", o: RECV }], v => {
        const a = num(v[1]), day = Math.min(28, Math.max(1, num(v[2]) || 1)), isW = WH.includes(v[4]);
        if (!v[0] || !a) return "Escribe nombre y monto.";
        S.rec.push({ id: Date.now(), n: v[0], a, day, c: v[3], k: isW ? "" : v[4], w: isW ? v[4] : "", last: "", vr: v[5] == RECV[1] });
        genRec();
    });
}
function editRec(id) {
    const r = S.rec.find(x => x.id == id); if (!r) return;
    openCustomModal("Editar gasto fijo", [{ l: "Nombre", v: esc(r.n) }, { l: "Monto", v: Math.round(r.a), m: "numeric" }, { l: "Día del mes (1-28)", v: r.day, m: "numeric" }, { l: "¿El monto cambia cada mes?", o: RECV, v: RECV[r.vr ? 1 : 0] }], v => {
        const a = num(v[1]), day = Math.min(28, Math.max(1, num(v[2]) || 1));
        if (!v[0] || !a) return "Escribe nombre y monto.";
        Object.assign(r, { n: v[0], a, day, vr: v[3] == RECV[1] });
        genRec(); // si ya pasó su día y no está registrado este mes, lo registra (o lo pide, si es variable)
    });
}
function delRec(id) { confirmAction("¿Borrar gasto fijo?", () => { S.rec = S.rec.filter(r => r.id != id); save(); }); }
// Los de monto fijo se registran solos el día que toca. Los de monto variable esperan a que confirmes cuánto llegó (ver recUI en Inicio).
function genRec() {
    const nm = ym(new Date()), td = new Date().getDate();
    (S.rec || []).forEach(r => {
        if (r.last != nm && td >= r.day && !r.vr) {
            S.items.push({ id: Date.now() * 1000 + Math.floor(Math.random() * 1000), d: nm + "-" + String(r.day).padStart(2, "0"), t: "g", c: r.c, n: r.n, a: r.a, k: r.k, w: r.w, q: 1, rid: r.id });
            r.last = nm;
        }
    });
    save();
}
function confirmRec(id) {
    const r = S.rec.find(x => x.id == id); if (!r) return;
    const el = document.getElementById("rc" + id), a = num(el && el.value), nm = ym(new Date());
    if (!a) return showToast("Escribe un monto válido", true);
    S.items.push({ id: Date.now() * 1000 + Math.floor(Math.random() * 1000), d: nm + "-" + String(r.day).padStart(2, "0"), t: "g", c: r.c, n: r.n, a, k: r.k, w: r.w, q: 1, rid: r.id });
    r.a = a; r.last = nm; // el valor confirmado queda como referencia para el mes que viene
    save(); showToast(r.n + " registrado por " + fmt(a)); draw();
}
function skipRec(id) { const r = S.rec.find(x => x.id == id); if (!r) return; r.last = ym(new Date()); save(); showToast(r.n + ": omitido este mes"); draw(); }

// ---------- Copias de seguridad ----------
function markBackup() { S.bk = today(); delete S.bkz; save(); }
function downloadBackup() {
    markBackup(); // se marca antes de armar el archivo, así la copia ya incluye su propia fecha
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" }));
    a.download = "mi-plata-copia-" + today() + ".json"; a.click();
    showToast("Copia descargada. Guárdala en Drive o envíatela por WhatsApp");
    draw();
}
function snoozeBackup() { S.bkz = ymd(new Date(Date.now() + 3 * 864e5)); save(); draw(); }
function importFile(inp) {
    const f = inp.files && inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { document.getElementById("imp").value = r.result; importBackup(); };
    r.readAsText(f);
}
function copyBackup() {
    markBackup();
    const e = document.getElementById("ex"); e.value = JSON.stringify(S); e.select();
    try { navigator.clipboard.writeText(e.value); showToast("Datos copiados al portapapeles"); } catch (_) {}
}
function importBackup() {
    let j; try { j = JSON.parse(document.getElementById("imp").value); } catch (e) { return showToast("JSON inválido"); }
    if (!j || !Array.isArray(j.items)) return showToast("Ese JSON no parece una copia de Mi Plata");
    confirmAction("Esto reemplaza todos tus datos actuales. ¿Continuar?", () => { localStorage.setItem(KEY, JSON.stringify(j)); location.reload(); });
}
function exportCsv() {
    const q = t => '"' + String(t ?? "").replace(/"/g, '""') + '"', tp = { i: "Ingreso", g: "Gasto", p: "Pago tarjeta", tr: "Transferencia" };
    const rows = [["Fecha", "Tipo", "Categoría", "Nota", "Monto", "Billetera", "Tarjeta", "Cuotas"]].concat(S.items.slice().sort((a, b) => a.d.localeCompare(b.d)).map(x => [x.d, tp[x.t] || x.t, x.c, x.n, x.a, x.w, x.k || x.pc || "", x.q > 1 ? x.q : ""]));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map(r => r.map(q).join(";")).join("\n")], { type: "text/csv" }));
    a.download = "mi-plata-" + today() + ".csv"; a.click();
}

// ---------- PIN ----------
const hashPin = async p => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("miplata" + p)))].map(b => b.toString(16).padStart(2, "0")).join("");
function setPin() {
    if (!window.crypto || !crypto.subtle) return showToast("El PIN necesita abrir la app por https");
    openCustomModal("PIN de 4 a 6 dígitos", [{ l: "Nuevo PIN (vacío = quitar)", m: "numeric" }], v => {
        if (v[0] && !/^\d{4,6}$/.test(v[0])) return "Usa de 4 a 6 números.";
        if (!v[0]) { delete S.pin; save(); return; }
        hashPin(v[0]).then(h => { S.pin = h; save(); showToast("PIN guardado"); });
    });
}
function lockScreen() {
    if (!S.pin || !window.crypto || !crypto.subtle) return;
    const d = document.createElement("div");
    d.className = "fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center gap-4 p-6";
    d.innerHTML = '<i class="fa-solid fa-lock text-3xl text-indigo-400"></i><input type="password" inputmode="numeric" maxlength="6" placeholder="PIN" class="w-40 text-center text-2xl tracking-widest px-4 py-3 rounded-2xl bg-slate-800 text-white"><p class="text-rose-400 text-xs min-h-[16px]"></p>';
    document.body.appendChild(d);
    const i = d.querySelector("input"), e = d.querySelector("p"); i.focus();
    i.oninput = async () => {
        if (i.value.length >= 4 && await hashPin(i.value) == S.pin) d.remove();
        else if (i.value.length >= 6) { e.textContent = "PIN incorrecto"; i.value = ""; }
    };
}

// ---------- Arranque ----------
window.addEventListener("DOMContentLoaded", () => {
    genRec();
    applyTheme(S.th);
    applyTh();
    applyMask();
    draw();
    lockScreen();
    checkReminders();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").then(regPeriodic).catch(() => {});
});
