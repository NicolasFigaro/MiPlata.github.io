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

// ----- Cara de la tarjeta (el «plástico») -----
function cardFace(c, amount, label) {
    const t = cardTier(c), bank = c.bk && c.bk != "Otro" ? c.bk : "", col = CARD_BANKS[bank] || "";
    const top = bank || c.n, sub = bank && c.n.toLowerCase() != bank.toLowerCase() ? c.n : "";
    const fr = CARD_FR[c.fr] && c.fr != "o" ? CARD_FR[c.fr] : "";
    return `
        <div class="tc-card tc-face tc-t-${t}" ${col ? `style="--bank:${col}"` : ""} onclick="editCard(${c.id})" role="button" aria-label="Ver detalles de ${esc(c.n)}">
            <span class="tc-sheen" aria-hidden="true"></span>
            <div class="tc-row">
                <div class="min-w-0 flex-1">
                    <b class="tc-bank">${col ? `<i class="tc-bdot"></i>` : ""}<span class="truncate">${esc(top)}</span></b>
                    ${sub ? `<small class="tc-sub truncate">${esc(sub)}</small>` : ""}
                </div>
                <span class="tc-tier">${CARD_TIERS[t].tag}</span>
            </div>
            <div class="tc-row tc-mid">
                <span class="tc-emv" aria-hidden="true"><i></i><i></i><i></i></span>
                <i class="fa-solid fa-wifi tc-nfc" aria-hidden="true"></i>
            </div>
            <div class="tc-lbl">${label}</div>
            <div class="tc-amt" data-cu="tc${c.id}">${amount}</div>
            <div class="tc-row tc-foot">
                <span class="tc-num">${c.l4 ? "•••• " + esc(c.l4) : "Ver detalles <i class='fa-solid fa-chevron-right'></i>"}</span>
                ${fr ? `<span class="tc-fr">${fr}</span>` : ""}
            </div>
        </div>`;
}

// ----- Franja de beneficios debajo del plástico -----
function cardPerksStrip(c) {
    const P = cardPerks(c), t = cardTier(c), own = Array.isArray(c.bn), fee = cardFeeYear(c);
    if (!P.length && !fee) return `<button class="tc-perk tc-perk-add" onclick="editPerks(${c.id})"><i class="fa-solid fa-plus"></i>Agregar beneficios</button>`;
    return `
        <div class="tc-perks no-scrollbar" aria-label="Beneficios">
            ${P.map(p => `<span class="tc-perk"><i class="fa-solid ${perkIcon(p)}"></i>${esc(p)}</span>`).join("")}
            <button class="tc-perk tc-perk-ed" onclick="editPerks(${c.id})" aria-label="Editar beneficios"><i class="fa-solid fa-pen"></i>Editar</button>
        </div>
        <p class="tc-perk-note">${own ? "Beneficios de tu " + esc(CARD_TIERS[t].n) : "Beneficios típicos de una " + esc(CARD_TIERS[t].n) + ". Confírmalos con tu banco y edítalos."}${fee ? ` · Cuota de manejo: <b>${fmt(fee)}</b> al año` : ""}</p>`;
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
