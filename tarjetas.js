// ---------- Tarjetas: tipo (Gold, Platinum…), banco, franquicia y beneficios ----------
// Campos nuevos en cada tarjeta (todos opcionales, las tarjetas viejas siguen funcionando):
//   c.tp  tipo: "cl" clásica · "go" gold · "pl" platinum · "si" signature · "bk" black / infinite
//   c.bk  banco (texto, uno de CARD_BANKS o "Otro")
//   c.fr  franquicia: "v" Visa · "m" Mastercard · "a" American Express · "o" otra
//   c.l4  últimos 4 dígitos (solo para reconocerla, opcional)
//   c.bn  beneficios propios (lista de textos). Si no existe, se muestran los típicos del tipo.

const CARD_TIERS = {
    cl: { n: "Clásica", tag: "CLÁSICA" },
    go: { n: "Gold", tag: "GOLD" },
    pl: { n: "Platinum", tag: "PLATINUM" },
    si: { n: "Signature", tag: "SIGNATURE" },
    bk: { n: "Black / Infinite", tag: "BLACK" }
};
const CARD_TIER_KEYS = Object.keys(CARD_TIERS);
const CARD_TIER_NAMES = CARD_TIER_KEYS.map(k => CARD_TIERS[k].n);

// Color de cada banco: tiñe las tarjetas Clásicas y el punto junto al nombre del banco
const CARD_BANKS = {
    "Banco de Bogotá": "#0b3d91",
    "Bancolombia": "#2b2b2b",
    "Davivienda": "#d4111c",
    "BBVA": "#004481",
    "AV Villas": "#0d4a9b",
    "Banco de Occidente": "#0057a8",
    "Banco Popular": "#00843d",
    "Banco Caja Social": "#005eb8",
    "Scotiabank Colpatria": "#d81e05",
    "Itaú": "#ec7000",
    "Nu": "#820ad1",
    "Banco Falabella": "#2e7d32",
    "RappiCard": "#ff441f",
    "Otro": ""
};
const CARD_BANK_NAMES = Object.keys(CARD_BANKS);
const CARD_FR = { v: "Visa", m: "Mastercard", a: "American Express", o: "Otra" };
const CARD_FR_KEYS = Object.keys(CARD_FR);
const CARD_FR_NAMES = CARD_FR_KEYS.map(k => CARD_FR[k]);

// Beneficios típicos por tipo. Son una guía: cada banco cambia sus beneficios, por eso se pueden editar.
const CARD_PERKS = {
    cl: ["Compras diferidas a cuotas", "Avances en efectivo", "Descuentos en comercios aliados"],
    go: ["Asistencia médica en viajes", "Seguro de alquiler de carro", "Protección de compras", "Programa de puntos o millas"],
    pl: ["Asistencia en viajes ampliada", "Seguro de equipaje y demoras", "Garantía extendida", "Concierge", "Programa de puntos o millas"],
    si: ["Salas VIP en aeropuertos (según banco)", "Concierge 24/7", "Seguro de viaje", "Garantía extendida", "Puntos acelerados"],
    bk: ["Salas VIP ilimitadas (según banco)", "Concierge 24/7", "Seguros de viaje premium", "Experiencias exclusivas", "Puntos acelerados"]
};

const cardTier = c => CARD_TIERS[c.tp] ? c.tp : "cl";
const cardPerks = c => Array.isArray(c.bn) ? c.bn : CARD_PERKS[cardTier(c)];

// Ícono según lo que diga el beneficio
function perkIcon(t) {
    const s = String(t).toLowerCase();
    const map = [
        [/sala|vip|lounge/, "fa-couch"], [/concierge/, "fa-bell-concierge"], [/equipaje|maleta/, "fa-suitcase-rolling"],
        [/viaj|vuelo|aeropuerto|millas/, "fa-plane"], [/carro|auto|alquiler/, "fa-car"], [/garant/, "fa-screwdriver-wrench"],
        [/seguro|protecci/, "fa-shield-halved"], [/punto|recompensa/, "fa-star"], [/cashback|devoluci|reembolso/, "fa-rotate-left"],
        [/descuento|aliad|promo/, "fa-tag"], [/cuota|diferid/, "fa-layer-group"], [/avance|efectivo|cajero/, "fa-money-bill-wave"],
        [/experienc|evento|concierto/, "fa-ticket"], [/médic|medic|salud/, "fa-kit-medical"], [/compra/, "fa-bag-shopping"]
    ];
    const f = map.find(([r]) => r.test(s));
    return f ? f[1] : "fa-circle-check";
}

// Cuánto cuesta la cuota de manejo al año (para compararla con los beneficios)
const cardFeeYear = c => c.mf > 0 ? (c.mt == "a" ? c.mf : c.mf * 12) : 0;

// ----- Tarjeta (panel de cristal con borde metálico según el tipo) -----
// o: { amount, pct (0-100 para la barra), raw (% real), from, fb, cupo, tone }
const tcOpen = new Set(); // tarjetas abiertas (se mantienen al redibujar)
function cardFace(c, o) {
    const t = cardTier(c), bank = c.bk && c.bk != "Otro" ? c.bk : "", col = CARD_BANKS[bank] || "";
    const P = cardPerks(c), show = P.slice(0, 3), more = P.length - show.length;
    return `
        <div class="${CARD} tc-glass tc-t-${t}" ${col ? `style="--bank:${col}"` : ""} onclick="tcToggle(${c.id})" role="button" aria-expanded="${tcOpen.has(c.id)}" aria-label="${esc(c.n)}: mostrar u ocultar detalles">
            <div class="tc-row">
                <b class="tc-bank truncate">${esc(bank || c.n)}</b>
                <span class="tc-tier">${CARD_TIERS[t].tag}</span>
            </div>
            <div class="tc-amt" data-cu="tc${c.id}">${o.amount}</div>
            ${o.cupo ? `
            <div class="tc-bar"><div class="cupo-bar" data-to="${o.pct}" style="width:${o.fb}%"></div></div>
            <div class="tc-row tc-meta">
                <span><span class="cupo-pct ${o.raw > 30 ? o.tone : ""}" data-from="${o.from}" data-to="${o.raw}">${Math.round(o.from)}%</span> de ${fmt(o.cupo)}</span>
                ${c.l4 ? `<span class="tc-num">•••• ${esc(c.l4)}</span>` : ""}
            </div>` : `<div class="tc-row tc-meta"><span>Compras este mes</span>${c.l4 ? `<span class="tc-num">•••• ${esc(c.l4)}</span>` : ""}</div>`}
            <div class="tc-row tc-low">
                <button class="tc-perks" onclick="event.stopPropagation();openPerks(${c.id})" aria-label="Ver beneficios">
                    ${show.length ? show.map(x => `<span class="tc-pk"><i class="fa-solid ${perkIcon(x)}"></i></span>`).join("") + (more > 0 ? `<span class="tc-more">+${more}</span>` : "") : `<span class="tc-more"><i class="fa-solid fa-plus mr-1"></i>Beneficios</span>`}
                </button>
                ${ptsChip(c)}
            </div>
        </div>`;
}
// Abre o cierra los detalles sin redibujar toda la vista (animación fluida)
function tcToggle(id) {
    const w = document.querySelector(`[data-tcw="${id}"]`); if (!w) return;
    const on = !tcOpen.has(id); on ? tcOpen.add(id) : tcOpen.delete(id);
    w.classList.toggle("tc-open", on);
    const f = w.querySelector(".tc-glass"); if (f) f.setAttribute("aria-expanded", on);
}

// ----- Ver beneficios (lista completa + lo que cuesta) -----
function openPerks(id) {
    const c = S.cards.find(x => x.id == id); if (!c) return;
    const t = cardTier(c), P = cardPerks(c), own = Array.isArray(c.bn), fee = cardFeeYear(c);
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <div><h3 class="text-base font-bold text-slate-800 dark:text-white">Beneficios</h3><p class="text-[11px] text-slate-400">${esc(c.n)} · ${esc(CARD_TIERS[t].n)}</p></div>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex flex-col gap-3">
            ${P.map(x => `<div class="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><span class="tc-pk tc-t-${t}"><i class="fa-solid ${perkIcon(x)}"></i></span>${esc(x)}</div>`).join("") || `<p class="text-sm text-slate-400">Aún no tiene beneficios.</p>`}
        </div>
        ${fee ? `<div class="flex justify-between text-xs mt-5 pt-4" style="border-top:1px solid rgb(127 127 127 / .18)"><span class="text-slate-400">Cuota de manejo al año</span><b class="text-slate-700 dark:text-slate-200">${fmt(fee)}</b></div>` : ""}
        ${own ? "" : `<p class="text-[11px] text-slate-400 mt-3">Son los típicos de una ${esc(CARD_TIERS[t].n)}. Confírmalos con tu banco.</p>`}
        <button type="button" onclick="editPerks(${c.id})" class="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"><i class="fa-solid fa-pen mr-1.5"></i>Editar beneficios</button>`;
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
}

// ----- Editar beneficios (una línea por beneficio) -----
function editPerks(id) {
    const c = S.cards.find(x => x.id == id); if (!c) return;
    const t = cardTier(c);
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">Beneficios · ${esc(c.n)}</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-[11px] text-slate-400 mb-3">Escribe un beneficio por línea. Copia los de la página de tu banco o del contrato de tu tarjeta.</p>
        <textarea id="perkTxt" rows="7" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm leading-relaxed">${cardPerks(c).map(esc).join("\n")}</textarea>
        <button type="button" onclick="document.getElementById('perkTxt').value=CARD_PERKS['${t}'].join('\\n')" class="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400"><i class="fa-solid fa-rotate-left mr-1"></i>Usar los típicos de ${esc(CARD_TIERS[t].n)}</button>
        <div class="grid grid-cols-2 gap-3 pt-4">
            <button type="button" onclick="closeModal()" class="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">Cancelar</button>
            <button type="button" onclick="savePerks(${c.id})" class="py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">Guardar</button>
        </div>`;
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
}
function savePerks(id) {
    const c = S.cards.find(x => x.id == id); if (!c) return;
    const L = document.getElementById("perkTxt").value.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 12);
    const typ = CARD_PERKS[cardTier(c)];
    if (L.length == typ.length && L.every((s, i) => s == typ[i])) delete c.bn; else c.bn = L; // si quedaron iguales a los típicos, siguen siendo «típicos»
    save(); closeModal(); draw();
}

// ----- Campos del formulario (se usan en newCard / editCard) -----
function cardIdFields(c) {
    c = c || {};
    return [
        { l: "Banco", o: CARD_BANK_NAMES, v: c.bk || "Otro" },
        { l: "Tipo de tarjeta", o: CARD_TIER_NAMES, v: CARD_TIERS[cardTier(c)].n },
        { l: "Franquicia", o: CARD_FR_NAMES, v: CARD_FR[c.fr] || "Otra" },
        { l: "Últimos 4 dígitos (opcional)", v: c.l4 || "", m: "numeric", p: "1234" }
    ];
}
// v = los 4 valores de cardIdFields. Devuelve un texto si hay error.
function setCardId(c, v) {
    const l4 = (v[3] || "").replace(/\D/g, "");
    if (v[3] && l4.length != 4) return "Los últimos dígitos deben ser 4 números.";
    const tierChanged = c.tp && CARD_TIER_KEYS[CARD_TIER_NAMES.indexOf(v[1])] != c.tp;
    c.bk = v[0]; c.tp = CARD_TIER_KEYS[Math.max(0, CARD_TIER_NAMES.indexOf(v[1]))]; c.fr = CARD_FR_KEYS[Math.max(0, CARD_FR_NAMES.indexOf(v[2]))];
    if (l4) c.l4 = l4; else delete c.l4;
    if (tierChanged && Array.isArray(c.bn) && !c.bn.length) delete c.bn;
    return "";
}

// ---------- Con qué tarjeta pagar hoy ----------
// Una compra de hoy (a 1 cuota) entra al extracto según el día de corte. Gana la tarjeta que más días te da antes de pagarla.
function payWindow(c) {
    const m = firstPay({ k: c.n, d: today() }), date = payDateIn(c.p || 30, idxYm(m));
    return { date, days: daysTo(date) };
}
function bestCards() {
    return S.cards.filter(c => c.k && c.p && (!c.c || cardUse(c, ym(new Date())).avail > 0))
        .map(c => Object.assign({ c }, payWindow(c))).sort((a, b) => b.days - a.days);
}
function bestCardUI() {
    const L = bestCards(); if (L.length < 2) return "";
    const b = L[0], t = cardTier(b.c);
    return `
        <button class="${CARD} tc-best tc-t-${t}" onclick="openBest()" ${CARD_BANKS[b.c.bk] ? `style="--bank:${CARD_BANKS[b.c.bk]}"` : ""}>
            <span class="tc-pk"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
            <span class="min-w-0 flex-1 text-left">
                <small>Para comprar hoy</small>
                <b class="truncate">${esc(b.c.n)}</b>
            </span>
            <span class="text-right"><b>${b.days} días</b><small>pagas el ${dmy(b.date).slice(0, 5)}</small></span>
        </button>`;
}
function openBest() {
    const L = bestCards();
    const modal = document.getElementById("generalModal"), container = document.getElementById("modalContainer");
    container.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <h3 class="text-base font-bold text-slate-800 dark:text-white">¿Con cuál pago hoy?</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-[11px] text-slate-400 mb-4">Días que tienes antes de pagar una compra hecha hoy, según la fecha de corte de cada tarjeta.</p>
        <div class="flex flex-col gap-3">
            ${L.map((x, i) => `<div class="flex items-center gap-3 text-sm">
                <span class="tc-pk tc-t-${cardTier(x.c)}" ${CARD_BANKS[x.c.bk] ? `style="--bank:${CARD_BANKS[x.c.bk]}"` : ""}>${i == 0 ? `<i class="fa-solid fa-crown"></i>` : i + 1}</span>
                <span class="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">${esc(x.c.n)}</span>
                <span class="text-right"><b class="text-slate-800 dark:text-white">${x.days} días</b><small class="block text-[11px] text-slate-400">${dmy(x.date)}</small></span>
            </div>`).join("")}
        </div>
        <p class="text-[11px] text-slate-400 mt-5 pt-4" style="border-top:1px solid rgb(127 127 127 / .18)">Aplica a compras a 1 cuota, que normalmente no generan intereses. A más cuotas, pagas intereses desde la primera.</p>`;
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); container.classList.remove("scale-95"); container.classList.add("scale-100"); }, 10);
}

// ---------- Puntos y millas ----------
// c.pt saldo que viste en el banco · c.ptd fecha de ese saldo · c.ptu "puntos" | "millas" · c.ptr cuántos ganas por cada $1.000 (opcional)
// Si hay tasa, se suman (estimados) los de las compras con esa tarjeta desde la fecha del saldo.
function ptsNow(c) {
    if (c.pt == null && !c.ptr) return null;
    let est = 0;
    if (c.ptr > 0) est = Math.floor(S.items.filter(x => x.k == c.n && x.t == "g" && x.d > (c.ptd || "")).reduce((t, x) => t + (+x.a || 0), 0) / 1000 * c.ptr);
    return { total: (c.pt || 0) + est, est };
}
const ptsUnit = c => c.ptu == "millas" ? "millas" : "puntos";
function ptsChip(c) {
    const p = ptsNow(c);
    return `<button class="tc-pts" onclick="event.stopPropagation();editPts(${c.id})" aria-label="${p ? "Puntos: " + p.total : "Agregar puntos o millas"}">
        <i class="fa-solid ${c.ptu == "millas" ? "fa-plane" : "fa-star"}"></i>${p ? (p.est ? "≈ " : "") + p.total.toLocaleString("es-CO") + " " + (c.ptu == "millas" ? "mi" : "pts") : "Puntos"}</button>`;
}
function editPts(id) {
    const c = S.cards.find(x => x.id == id); if (!c) return;
    const p = ptsNow(c);
    openCustomModal("Puntos · " + esc(c.n), [
        { l: "¿Qué acumula?", o: ["Puntos", "Millas"], v: c.ptu == "millas" ? "Millas" : "Puntos" },
        { l: "Saldo actual (míralo en la app del banco)", v: p ? p.total : "", m: "numeric", p: "12500" },
        { l: "Ganas por cada $1.000 (opcional, para estimar)", v: c.ptr ? tf(c.ptr) : "", m: "decimal", p: "1" }
    ], v => {
        c.ptu = v[0] == "Millas" ? "millas" : "puntos";
        if (v[1] === "" && !v[2]) { delete c.pt; delete c.ptd; delete c.ptr; save(); return; }
        c.pt = num(v[1]); c.ptd = today();
        const r = pr(v[2]); if (r > 0) c.ptr = r; else delete c.ptr;
        save();
    });
}
