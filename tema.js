// ===== Mi Plata · tema.js =====
// Temas de color. Se carga en <head> para pintar el tema antes de que aparezca la pantalla (sin parpadeo).
// Tailwind está configurado en index.html para que "indigo", "violet" y "slate" lean variables CSS:
//   --p-* = color principal, --s-* = color secundario (degradados), --n-* = neutros (fondos, bordes, textos grises).
// El tema "Índigo" no toca nada: usa los valores originales definidos en styles.css.

const SH = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// p = tono 600 del color principal (el de los botones, con texto blanco: debe ser oscuro), s = tono 600 del secundario,
// h = matiz de los neutros (grados), f = cuánto color llevan los neutros (1 = igual que el gris azulado original).
const THEMES = [
    // iOS: colores de sistema de Apple. "ns" = escala de neutros propia (los grises de iOS: gray6 de fondo, #1C1C1E tarjetas oscuras, negro puro de fondo oscuro)
    { id: "ios", n: "iOS", p: "#007AFF", s: "#0062CC", ns: ["242 242 247", "229 229 234", "209 209 214", "199 199 204", "174 174 178", "142 142 147", "99 99 102", "72 72 74", "44 44 46", "28 28 30", "0 0 0"] },
    { id: "indigo", n: "Índigo", p: "#4f46e5", s: "#7c3aed", raw: true },
    { id: "oceano", n: "Océano", p: "#0b78b8", s: "#0f766e", h: 205, f: 1 },
    { id: "bosque", n: "Bosque", p: "#15803d", s: "#4d7c0f", h: 150, f: .7 },
    { id: "atardecer", n: "Atardecer", p: "#c2410c", s: "#be185d", h: 25, f: .8 },
    { id: "violeta", n: "Violeta", p: "#7c3aed", s: "#a21caf", h: 262, f: 1 },
    { id: "rosa", n: "Rosa", p: "#c026d3", s: "#7e22ce", h: 300, f: .8 },
    { id: "cafe", n: "Café", p: "#92400e", s: "#78350f", h: 30, f: .55 },
    { id: "grafito", n: "Grafito", p: "#52525b", s: "#3f3f46", h: 240, f: .12 }
];

const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixc = (c, t, k) => c.map((v, i) => Math.round(v + (t[i] - v) * k));
// Escala 50-950 a partir del tono 600: hacia blanco para los claros, hacia negro para los oscuros
function accentScale(h600) {
    const c = hex2(h600), W = [255, 255, 255], B = [0, 0, 0];
    const m = [[W, .93], [W, .86], [W, .72], [W, .52], [W, .3], [W, .12], null, [B, .14], [B, .28], [B, .42], [B, .62]];
    return m.map(x => (x ? mixc(c, x[0], x[1]) : c).join(" "));
}
const hsl2rgb = (h, s, l) => {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
};
const rgb2hsl = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = (mx == r ? ((g - b) / d) % 6 : mx == g ? (b - r) / d + 2 : (r - g) / d + 4) * 60; if (h < 0) h += 360; }
    return [h, s * 100, l * 100];
};
// Neutros: mismas luminosidades que "slate" de Tailwind, con el matiz y la intensidad del tema
const NL = [98, 96, 91, 84, 65, 47, 35, 25, 17, 10, 4], NS = [40, 33, 32, 27, 18, 16, 19, 22, 33, 47, 70];
const neutralScale = (h, f) => NL.map((l, i) => hsl2rgb(h, Math.min(100, NS[i] * f), l).join(" "));

// Color propio: se oscurece lo necesario para que el texto blanco de los botones se lea bien
function customTheme(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || "")) hex = "#4f46e5";
    const [h, s, l] = rgb2hsl(hex2(hex)), s2 = Math.max(s, 35);
    const toHex = a => "#" + a.map(v => v.toString(16).padStart(2, "0")).join("");
    // Luminosidad relativa: los amarillos y cianes necesitan ser más oscuros que los azules para que el texto blanco se lea
    const lum = c => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
    let l2 = Math.min(Math.max(l, 28), 42);
    while (l2 > 12 && 1.05 / (lum(hsl2rgb(h, s2, l2)) + .05) < 4.5) l2 -= 1;
    return { id: "custom", n: "Personalizado", p: toHex(hsl2rgb(h, s2, l2)), s: toHex(hsl2rgb((h + 30) % 360, s2, Math.max(l2 - 4, 24))), h, f: .5 };
}
function themeVars(t) {
    const v = {}, P = accentScale(t.p), X = accentScale(t.s), N = t.ns || neutralScale(t.h == null ? 215 : t.h, t.f == null ? 1 : t.f);
    SH.forEach((k, i) => { v["--p-" + k] = P[i]; v["--s-" + k] = X[i]; v["--n-" + k] = N[i]; });
    return v;
}
function applyTheme(th) {
    if (!th) { try { th = (JSON.parse(localStorage.getItem("miplata_advanced_v2") || "{}") || {}).th || {}; } catch (e) { th = {}; } }
    const st = document.documentElement.style;
    SH.forEach(k => ["p", "s", "n"].forEach(x => st.removeProperty("--" + x + "-" + k)));
    const t = th.t == "custom" ? customTheme(th.c) : (THEMES.find(x => x.id == th.t) || THEMES[0]);
    if (!t.raw) { const v = themeVars(t); Object.keys(v).forEach(k => st.setProperty(k, v[k])); }
    document.documentElement.dataset.theme = t.id;
    // Barra de estado del celular: en iOS toma el color del fondo; en los demás temas, el color principal
    const dark = document.documentElement.classList.contains("dark"), m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t.id == "ios" ? (dark ? "#000000" : "#F2F2F7") : t.p;
}
// Color del tema activo para las gráficas (n = tono, a = transparencia, v = "p" principal o "s" secundario)
const accent = (n, a, v) => {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--" + (v || "p") + "-" + n).trim().split(/\s+/).join(",");
    return a == null || a == 1 ? "rgb(" + c + ")" : "rgba(" + c + "," + a + ")";
};
applyTheme();

// ---- Tamaño de letra del sistema (iOS "Dynamic Type") ----
// En iPhone/iPad, "font: -apple-system-body" devuelve el tamaño que la persona eligió en Ajustes > Pantalla y brillo > Tamaño del texto
// (17px = el normal). Con eso se calcula --fs, que mejoras.css usa para escalar solo los textos. Fuera de Apple no hace nada.
function applyTextScale() {
    try {
        if (!(window.CSS && CSS.supports && CSS.supports("font", "-apple-system-body"))) return;
        const p = document.createElement("div");
        p.style.cssText = "font:-apple-system-body;position:absolute;left:-999px;top:0;visibility:hidden;pointer-events:none";
        p.textContent = "A";
        (document.body || document.documentElement).appendChild(p);
        const px = parseFloat(getComputedStyle(p).fontSize);
        p.remove();
        if (!(px > 0)) return;
        const s = Math.min(1.5, Math.max(.85, px / 17)).toFixed(3); // tope: más allá de 150% la pantalla se desarma
        document.documentElement.style.setProperty("--fs", s);
        try { localStorage.setItem("miplata_fs", s); } catch (e) {}
    } catch (e) {}
}
// Se aplica de una vez con el último valor guardado (sin parpadeo) y se corrige apenas carga la página
try { const c = parseFloat(localStorage.getItem("miplata_fs")); if (c > 0) document.documentElement.style.setProperty("--fs", String(c)); } catch (e) {}
document.addEventListener("DOMContentLoaded", applyTextScale);
document.addEventListener("visibilitychange", () => { if (!document.hidden) applyTextScale(); }); // al volver de Ajustes de iOS con otro tamaño
window.addEventListener("pageshow", applyTextScale);
