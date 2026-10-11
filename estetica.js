// ===== Mi Plata · estetica.js =====
// Piezas visuales: anillos de progreso, mini gráficas, emoji/color de las metas, ícono/color de los bolsillos
// y los selectores de muestras que usan los formularios. Solo genera HTML: no toca los datos.
// Se carga después de logica.js y antes de vistas.js.

// ---------- Anillos de progreso (estilo Apple Fitness) ----------
// o = { p: 0-100, c: color, size: px, w: grosor (sobre 100), mark: 0-100 (marcador "dónde deberías ir"), inner: HTML del centro, track: false para ocultar el fondo }
function ring(o) {
    const w = o.w || 10, r = (100 - w) / 2, C = 2 * Math.PI * r, p = Math.max(0, Math.min(100, o.p || 0));
    const shown = p > 0 ? Math.max(p, 1.5) : 0, off = C * (1 - shown / 100), col = o.c || "#007AFF";
    let mk = "";
    if (o.mark > 0 && o.mark < 100) {
        const a = 2 * Math.PI * o.mark / 100;
        mk = `<circle class="ring-mark" cx="${(50 + r * Math.sin(a)).toFixed(2)}" cy="${(50 - r * Math.cos(a)).toFixed(2)}" r="${(w * .42).toFixed(2)}"><title>${t("Dónde deberías ir hoy")}</title></circle>`;
    }
    return `<span class="ring" style="width:${o.size || 48}px;height:${o.size || 48}px">
        <svg viewBox="0 0 100 100" aria-hidden="true">
            ${o.track === false ? "" : `<circle class="ring-track" cx="50" cy="50" r="${r}" fill="none" stroke-width="${w}"/>`}
            ${shown ? `<circle class="ring-fg" cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" transform="rotate(-90 50 50)" style="stroke-dasharray:${C.toFixed(2)};--c:${C.toFixed(2)};--o:${off.toFixed(2)}"/>` : ""}
            ${mk}
        </svg>
        <span class="ring-in">${o.inner || ""}</span>
    </span>`;
}

// ---------- Mini gráfica de línea ----------
let _spk = 0;
function spark(vals, col, w, h) {
    w = w || 96; h = h || 38;
    if (!vals || vals.length < 2) return "";
    const mn = Math.min(...vals), mx = Math.max(...vals), pad = 5, rg = mx - mn || 1;
    const pts = vals.map((v, i) => [pad + i * (w - pad * 2) / (vals.length - 1), mx == mn ? h / 2 : h - pad - (v - mn) / rg * (h - pad * 2)]);
    // Curva suave (Catmull-Rom → Bézier)
    let d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + "," + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + "," + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
    }
    const id = "spk" + (++_spk), last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
        <path d="${d} L${last[0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z" fill="url(#${id})"/>
        <path class="spark-line" d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
        <circle class="spark-dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.2" fill="${col}"/>
    </svg>`;
}

// Patrimonio de los últimos n meses. El último punto es exactamente el patrimonio de hoy; los anteriores se
// reconstruyen con lo que sí tiene historia (cuentas, ahorros y tarjetas); inversiones y deudas se toman como hoy.
function netHist(n) {
    try {
        // Si ya hay fotos mensuales guardadas (S.nwh), se usan; la del mes en curso se actualiza con el valor de hoy
        const ks = Object.keys(S.nwh || {}).sort().slice(-n);
        if (ks.length >= 2) { const v = ks.map(k => S.nwh[k]); if (ks[ks.length - 1] == ym(new Date())) v[v.length - 1] = netWorth().tot; return v; }
        const now = new Date(), nw = netWorth(), raw = k =>
            WH.reduce((s, x) => s + bal(x, k), 0) + S.acc.reduce((s, a) => s + svb(a.id, k) * (a.u ? S.trm : 1), 0) - S.cards.reduce((s, c) => s + cardUse(c, k).used, 0);
        const cur = raw(ym(now)), out = [];
        for (let i = n - 1; i >= 0; i--) out.push(nw.tot + raw(ym(new Date(now.getFullYear(), now.getMonth() - i, 1))) - cur);
        return out.every(v => isFinite(v)) ? out : [];
    } catch (e) { return []; }
}

// ---------- Metas: emoji y color propios (si no eligen, se adivinan por el nombre) ----------
const GOAL_COLS = ["#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF2D55", "#30B0C7", "#5856D6", "#FF3B30", "#FFB300", "#8E8E93"];
const GOAL_EMOS = ["🎯", "✈️", "🏠", "🏍️", "🚗", "🚲", "📱", "💻", "🎓", "💍", "🛟", "🏖️", "🌴", "🎁", "🎮", "🍼", "🐶", "🩺", "💼", "🎸", "📷", "👟", "🛋️", "🌎"];
const GOAL_GUESS = [
    [/viaj|vacac|paseo|trip|travel|vuelo|tiquete|pasaje|voyage|reise|путешеств|отпуск/i, "✈️", "#007AFF"],
    [/casa|apart|hogar|vivienda|inmueble|arriendo|house|home|maison|haus|дом|квартир/i, "🏠", "#FF9500"],
    [/moto|motocic|bike\b|moto\b/i, "🏍️", "#FF3B30"],
    [/carro|auto\b|coche|veh[ií]c|camioneta|car\b|voiture|машин/i, "🚗", "#5856D6"],
    [/bici|cicla/i, "🚲", "#34C759"],
    [/emergen|colch[oó]n|imprevist|fondo de|rainy|urgence|notfall|резерв/i, "🛟", "#FF2D55"],
    [/celular|iphone|tel[eé]f|m[oó]vil|phone|samsung|телефон/i, "📱", "#30B0C7"],
    [/compu|laptop|port[aá]til|pc\b|macbook|ordinateur|computer|ноутбук/i, "💻", "#5856D6"],
    [/boda|matrim|anillo|casamiento|wedding|mariage|hochzeit|свадьб/i, "💍", "#AF52DE"],
    [/estudi|univers|curso|maestr|colegio|matr[ií]cula|school|study|étude|studium|учёб|учеб/i, "🎓", "#007AFF"],
    [/salud|m[eé]dic|cirug|dent|health|santé|gesundheit|здоров/i, "🩺", "#FF2D55"],
    [/regalo|navidad|cumple|gift|cadeau|geschenk|подар/i, "🎁", "#FF9500"],
    [/negocio|empresa|emprend|business|entreprise|geschäft|бизнес/i, "💼", "#8E8E93"],
    [/playa|crucero|beach|plage|strand|пляж/i, "🏖️", "#30B0C7"],
    [/jubil|pensi[oó]n|retiro|retire|rente|пенси/i, "🌴", "#34C759"],
    [/beb[eé]|hij[oa]|baby|bébé|kind\b|ребён|ребен/i, "🍼", "#FFB300"],
    [/mascota|perr|gat[oa]|pet\b|chien|hund|собак/i, "🐶", "#FF9500"],
    [/consola|playstation|play\b|xbox|nintendo|gamer|juego|игр/i, "🎮", "#AF52DE"],
    [/sof[aá]|mueble|nevera|lavadora|electrodom|furniture|meuble|möbel|мебел/i, "🛋️", "#FF9500"],
    [/c[aá]mara|foto|camera|appareil|kamera|фотоап/i, "📷", "#8E8E93"]
];
const goalGuess = a => GOAL_GUESS.find(g => g[0].test(a.n || "")) || null;
const goalEmo = a => a.e || (goalGuess(a) || [])[1] || "🎯";
const goalCol = a => a.c || (goalGuess(a) || [])[2] || GOAL_COLS[Math.abs(Number(a.id) || 0) % GOAL_COLS.length];

// ---------- Bolsillos: ícono y color propios (como las categorías) ----------
const PK_ICS = ["fa-box-archive", "fa-house", "fa-plane", "fa-basket-shopping", "fa-bolt", "fa-car", "fa-graduation-cap", "fa-heart-pulse", "fa-gift", "fa-umbrella-beach", "fa-shirt", "fa-paw", "fa-baby", "fa-wrench", "fa-gamepad", "fa-utensils", "fa-piggy-bank", "fa-star"];
const PK_COLS = GOAL_COLS;
const PK_GUESS = [
    [/arriend|alquiler|renta|casa|hogar|rent\b|loyer|miete|аренд|жиль/i, "fa-house", "#FF9500"],
    [/viaj|vacac|paseo|trip|travel|voyage|reise|отпуск|путешеств/i, "fa-plane", "#007AFF"],
    [/mercad|super|comida|food|courses|lebensmittel|еда|продукт/i, "fa-basket-shopping", "#34C759"],
    [/servici|luz|agua|internet|gas\b|utilit|nebenkosten|коммунал/i, "fa-bolt", "#FFB300"],
    [/carro|moto|gasolina|transp|car\b|voiture|auto\b|транспорт|машин/i, "fa-car", "#5856D6"],
    [/estudi|univers|curso|colegio|school|études|studium|учёб|учеб/i, "fa-graduation-cap", "#AF52DE"],
    [/salud|m[eé]dic|health|santé|gesundheit|здоров/i, "fa-heart-pulse", "#FF2D55"],
    [/regalo|navidad|gift|cadeau|geschenk|подар/i, "fa-gift", "#FF2D55"],
    [/mascota|perr|gat[oa]|pet\b|chien|hund|собак/i, "fa-paw", "#FF9500"],
    [/ropa|clothes|vêtement|kleidung|одежд/i, "fa-shirt", "#30B0C7"],
    [/ahorro|saving|épargne|sparen|накоп/i, "fa-piggy-bank", "#34C759"],
    [/beb[eé]|baby|bébé|ребён|ребен/i, "fa-baby", "#FFB300"]
];
const pkGuess = p => PK_GUESS.find(g => g[0].test(p.n || "")) || null;
const pkIcon = p => p.ic || (pkGuess(p) || [])[1] || "fa-box-archive";
const pkCol = p => p.c || (pkGuess(p) || [])[2] || PK_COLS[Math.abs((p.n || "").split("").reduce((s, ch) => s + ch.charCodeAt(0), 0)) % PK_COLS.length];
// Cuadrito del bolsillo. Si está vinculado a una meta y no tiene ícono propio, lleva el emoji y el color de la meta.
function pkTile(p, g, sm) {
    const cls = sm ? "w-6 h-6 text-[10px] rounded-[7px]" : "w-9 h-9 text-sm rounded-[10px]";
    if (g && !p.ic) return `<span class="pk-tile ${cls} ${sm ? "" : "text-[17px]"}" style="background:${goalCol(g)}22;box-shadow:inset 0 0 0 1px ${goalCol(g)}44">${goalEmo(g)}</span>`;
    return `<span class="pk-tile ${cls} text-white" style="background:${p.c || (g ? goalCol(g) : pkCol(p))}"><i class="fa-solid ${pkIcon(p)}"></i></span>`;
}

// ---------- Selector de muestras para los formularios (openCustomModal: campo { sw: [...] }) ----------
// Cada muestra: { v: valor guardado, h: HTML, s: estilo del botón, l: nombre accesible }
const emoSw = () => [{ v: "", h: "✨", l: "Automático" }].concat(GOAL_EMOS.map(e => ({ v: e, h: e, l: e })));
const colSw = () => [{ v: "", h: '<i class="fa-solid fa-wand-magic-sparkles"></i>', l: "Automático" }].concat(GOAL_COLS.map(c => ({ v: c, h: "", s: "background:" + c, l: c })));
const icoSw = () => [{ v: "", h: '<i class="fa-solid fa-wand-magic-sparkles"></i>', l: "Automático" }].concat(PK_ICS.map(i => ({ v: i, h: `<i class="fa-solid ${i}"></i>`, l: i.replace("fa-", "") })));
function swHTML(f, i) {
    const cur = f.v == null ? "" : f.v;
    return `<div class="sw-grid ${f.cls || ""}" role="radiogroup">${f.sw.map(o => `<button type="button" role="radio" aria-checked="${o.v == cur}" aria-label="${o.l}" data-v="${o.v}" onclick="pickSw(this)" class="sw-opt ${o.v == cur ? "on" : ""}" style="${o.s || ""}">${o.h}</button>`).join("")}</div><input type="hidden" name="f${i}" value="${cur}">`;
}
function pickSw(b) {
    const g = b.parentNode, h = g.nextElementSibling;
    g.querySelectorAll(".sw-opt").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); });
    b.classList.add("on"); b.setAttribute("aria-checked", "true"); if (h) h.value = b.dataset.v;
    try { buzz(); } catch (e) {}
}

// ---------- Esqueleto de carga ----------
const sk = (w, h, r) => `<span class="sk" style="width:${w || 64}px;height:${h || 14}px${r ? ";border-radius:" + r + "px" : ""}"></span>`;
const skRows = n => Array.from({ length: n }, () => `<div class="flex items-center gap-3 py-2.5">${sk(32, 32, 10)}<div class="flex-1 space-y-1.5">${sk(120, 11)}${sk(70, 9)}</div>${sk(54, 12)}</div>`).join("");
