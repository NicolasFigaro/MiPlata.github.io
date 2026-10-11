// ===== Mi Plata · idioma.js =====
// Idiomas de la app: español (el original), inglés, francés, alemán y ruso.
// El código de la app sigue escrito en español. Este archivo traduce lo que aparece en pantalla (textos, placeholders, títulos, etiquetas
// de accesibilidad y opciones de los selectores) usando el diccionario de idioma-datos.js, y se encarga de las fechas y de los nombres de meses.
//
// Cómo funciona el diccionario:
//  • Las llaves están en español y con los números cambiados por {} ("Faltan $5.000" → "Faltan {}"). El texto traducido recupera los números en orden;
//    si el orden cambia se usa {1}, {2}…
//  • Una llave con * acepta texto libre (nombres que escribió la persona): "¿Borrar el bolsillo *?" → "Delete the pocket *?"
//  • Si un texto largo no está completo, se traduce por pedazos (separados por " · ", saltos de línea y puntos).
//  • Lo que no esté en el diccionario se queda en español: nada se rompe.
// Para agregar una frase: añade una fila [es, en, fr, de, ru] en idioma-datos.js.

const LANGS = [
    { id: "es", n: "Español", f: "🇪🇸", loc: "es-CO" },
    { id: "en", n: "English", f: "🇬🇧", loc: "en-US" },
    { id: "fr", n: "Français", f: "🇫🇷", loc: "fr-FR" },
    { id: "de", n: "Deutsch", f: "🇩🇪", loc: "de-DE" },
    { id: "ru", n: "Русский", f: "🇷🇺", loc: "ru-RU" }
];
let LANG = "es";
try { LANG = localStorage.getItem("miplata_lang") || "es"; } catch (e) {}
if (!LANGS.some(l => l.id == LANG)) LANG = "es";
const LI = LANGS.findIndex(l => l.id == LANG);          // columna del diccionario (0 = español)
const DLOC = LANGS[LI].loc;                              // idioma de las fechas (los montos siguen en formato colombiano)
document.documentElement.lang = LANG;

// ---------- Motor ----------
const NUMRE = /-?(?:US\$|\$)\s?\d+(?:[.,]\d+)*|\d+(?:[.,]\d+)*%?/g;
const D = Object.create(null), PAT = [], CACHE = new Map();
(function build() {
    if (!LI || !window.I18N_ROWS) return;
    I18N_ROWS.forEach(r => {
        const k = r[0];
        let v = r[LI];
        if (v === "=") v = r[1];   // "=" = igual que en inglés (palabras que se escriben igual)
        if (!v) return;
        if (k.indexOf("*") < 0) D[k] = v;
        else PAT.push({ re: new RegExp("^" + k.replace(/[.+?^$()|[\]\\]/g, "\\$&").replace(/\{\}/g, "\\{\\}").replace(/\*/g, "([^·\\n]+?)") + "$", "d"), t: v, n: k.length });
    });
    PAT.sort((a, b) => b.n - a.n);
})();
const SEPS = [/( · )/, /(\n)/, /((?<=[.!?…])\s+)/, /( — )/, /(: )/];
const HAS_LETTER = /[A-Za-zÀ-ÿА-яЁё]/;
function fill(o, nums, caps) {
    let i = 0, j = 0;
    return o.replace(/\{(\d*)\}|\*/g, (m, n) => m == "*" ? (caps && caps[j] !== undefined ? trCore(caps[j++], 0) : (j++, "*")) : n ? (nums[n - 1] ?? "") : (nums[i++] ?? ""));
}
function trCore(core, depth) {
    if (!core || !HAS_LETTER.test(core)) return core;
    const hit = CACHE.get(core); if (hit !== undefined && depth === 0) return hit;
    const nums = [], key = core.replace(NUMRE, m => (nums.push(m), "{}")).replace(/\s+/g, " ");
    let out = D[key];
    if (out !== undefined) out = fill(out, nums, null);
    else {
        for (const p of PAT) {
            const m = p.re.exec(key); if (!m) continue;
            // Lo que captura * puede traer números ya cambiados por {}: se les devuelven sus valores
            const caps = m.slice(1).map((c, gi) => { let k = (key.slice(0, m.indices[gi + 1][0]).match(/\{\}/g) || []).length; return c.replace(/\{\}/g, () => nums[k++] ?? ""); });
            out = fill(p.t, nums, caps); break;
        }
        if (out === undefined && depth < 2) {
            for (const sp of SEPS) {
                const parts = core.split(sp);
                if (parts.length < 3) continue;
                let any = false;
                const res = parts.map((x, i) => { if (i % 2) return x; const y = trCore(x, depth + 1); if (y !== x) any = true; return y; });
                if (any) { out = res.join(""); break; }
            }
        }
    }
    if (out === undefined) out = core;
    if (depth === 0) { if (CACHE.size > 6000) CACHE.clear(); CACHE.set(core, out); }
    return out;
}
// t("texto en español") → texto en el idioma elegido (para textos armados en JavaScript: canvas, compartir, etc.)
function t(s) {
    if (!LI || s == null) return s;
    s = String(s);
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    return m[1] + trCore(m[2], 0) + m[3];
}

// ---------- Traducción del DOM ----------
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, SVG: 0 };
function skipEl(el) {
    for (let e = el; e && e.nodeType == 1; e = e.parentElement) {
        if (SKIP[e.tagName] || e.getAttribute("translate") == "no" || e.id == "ex" || e.id == "imp") return true;
    }
    return false;
}
function trTextNode(n) {
    const p = n.parentElement;
    if (!p || p.tagName == "OPTION" || skipEl(p)) return;
    const v = n.nodeValue; if (!v || !HAS_LETTER.test(v)) return;
    const o = t(v); if (o !== v) n.nodeValue = o;
}
function trEl(el) {
    if (el.nodeType != 1 || skipEl(el)) return;
    ATTRS.forEach(a => { const v = el.getAttribute && el.getAttribute(a); if (v && HAS_LETTER.test(v)) { const o = t(v); if (o !== v) el.setAttribute(a, o); } });
    if (el.tagName == "OPTION") {
        // Solo se cambia lo que se ve (label): el valor del <select> sigue siendo el texto en español que usa la lógica de la app
        const v = el.textContent, o = t(v); if (o !== v && el.label !== o) el.label = o;
    } else if (el.tagName == "INPUT" && (el.type == "button" || el.type == "submit") && el.value) { el.value = t(el.value); }
}
function trTree(root) {
    if (!LI || !root) return;
    if (root.nodeType == 3) { trTextNode(root); return; }
    if (root.nodeType != 1 || skipEl(root)) return;
    trEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) { if (n.nodeType == 3) trTextNode(n); else trEl(n); }
}
let OBS = null;
function startTranslator() {
    if (!LI || OBS) return;
    OBS = new MutationObserver(recs => {
        for (const r of recs) {
            if (r.type == "childList") r.addedNodes.forEach(trTree);
            else if (r.type == "characterData") trTextNode(r.target);
            else if (r.type == "attributes") trEl(r.target);
        }
        OBS.takeRecords(); // lo que acabamos de escribir nosotros no se vuelve a revisar
    });
    OBS.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const first = () => { trTree(document.body); document.title = t(document.title); OBS.takeRecords(); };
    if (document.body) first(); else document.addEventListener("DOMContentLoaded", first);
}
startTranslator();

// ---------- Fechas y nombres ----------
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// Nombres de los meses (MES vive en pantallas.js y se rellena en su sitio)
function syncNames() {
    if (!LI || typeof MES == "undefined") return;
    for (let i = 0; i < 12; i++) MES[i] = cap(new Date(2000, i, 1).toLocaleDateString(DLOC, { month: "long" }));
}
// "5 de marzo" / "March 5" / "5 mars" / "5. März" / "5 марта"
const dm = (d, m) => new Date(2000, m, d).toLocaleDateString(DLOC, { day: "numeric", month: "long" });
// Iniciales de los días, empezando por lunes
const WD_INI = () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, i + 1).toLocaleDateString(DLOC, { weekday: "narrow" }).toUpperCase());
// "Los lunes" (Resumen del año), según el día de la semana (0 = domingo)
const WD_PL = {
    es: ["Los domingos", "Los lunes", "Los martes", "Los miércoles", "Los jueves", "Los viernes", "Los sábados"],
    en: ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"],
    fr: ["Les dimanches", "Les lundis", "Les mardis", "Les mercredis", "Les jeudis", "Les vendredis", "Les samedis"],
    de: ["Sonntags", "Montags", "Dienstags", "Mittwochs", "Donnerstags", "Freitags", "Samstags"],
    ru: ["По воскресеньям", "По понедельникам", "По вторникам", "По средам", "По четвергам", "По пятницам", "По субботам"]
};
const T_WD = i => WD_PL[LANG][i];

// ---------- Cambiar de idioma (desde Ajustes) ----------
// Se guarda y se recarga: así toda la app se arma de cero en el idioma nuevo y no queda nada a medias.
function setLang(id) {
    if (id == LANG || !LANGS.some(l => l.id == id)) return;
    try { localStorage.setItem("miplata_lang", id); sessionStorage.setItem("miplata_back_to_lang", "1"); } catch (e) { return; }
    location.reload();
}
window.addEventListener("load", () => {
    try {
        if (sessionStorage.getItem("miplata_back_to_lang")) {
            sessionStorage.removeItem("miplata_back_to_lang");
            goTab(N.indexOf("Ajustes"));
            setTimeout(() => { const g = document.querySelector('[role="radiogroup"][translate="no"]'); if (g) g.scrollIntoView({ block: "center" }); }, 60);
        }
    } catch (e) {}
});
