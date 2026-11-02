// ---------- Redibujo fluido ----------
// Antes, cada acción reemplazaba TODO el contenido (innerHTML) y por eso las cosas aparecían o desaparecían de golpe.
// Ahora paintMain() compara la pantalla nueva con la que ya está y cambia solo lo que cambió:
// las barras crecen, lo nuevo entra suave, lo que sobra sale suave y no se pierde el scroll, el foco ni lo que escribes.
const MPH_SKIP_ATTR = { open: 1 };
const mphGone = n => n.nodeType == 1 && n.classList.contains("mo-out");

function mphSame(a, b) { return a.nodeType == b.nodeType && (a.nodeType != 1 || a.tagName == b.tagName); }

function mphAttrs(a, b) {
    const isDet = a.tagName == "DETAILS";
    for (const at of [...a.attributes]) {
        const k = at.name;
        if (k == "class") continue;
        if (isDet && k == "open" && !a.classList.contains("mx")) continue; // respeta lo que abriste (menos el menú ⋯)
        if (!b.hasAttribute(k)) a.removeAttribute(k);
    }
    for (const at of [...b.attributes]) {
        const k = at.name, v = at.value;
        if (k == "class") {
            const keep = ["mo-in"].filter(c => a.classList.contains(c));
            const want = (v + (keep.length ? " " + keep.join(" ") : "")).trim();
            if (a.getAttribute("class") !== want) a.setAttribute("class", want);
            continue;
        }
        if (k == "value" && a === document.activeElement) continue;
        if (a.getAttribute(k) !== v) a.setAttribute(k, v);
    }
}

function mphIn(el) {
    if (el.nodeType != 1 || !mphOn) return;
    el.classList.add("mo-in");
    setTimeout(() => el.classList.remove("mo-in"), 520);
}

function mphOut(el) {
    if (el.nodeType != 3 && el.nodeType != 1) return;
    if (el.nodeType == 3 || !mphOn) { el.remove(); return; }
    if (mphGone(el)) return;
    const h = el.offsetHeight;
    el.classList.add("mo-out");
    const an = el.animate ? el.animate([
        { height: h + "px", opacity: 1, transform: "none" },
        { height: "0px", opacity: 0, transform: "scale(.97)", marginTop: "0px", marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px" }
    ], { duration: 240, easing: "cubic-bezier(.32,.72,0,1)", fill: "forwards" }) : null;
    if (an) an.onfinish = () => el.remove(); else el.remove();
}

function mphKids(a, b) {
    const old = [...a.childNodes].filter(n => !mphGone(n)), nw = [...b.childNodes];
    for (let i = 0; i < nw.length; i++) {
        const n = nw[i], o = old[i];
        if (!o) { a.appendChild(n); mphIn(n); continue; }
        if (mphSame(o, n)) mphNode(o, n);
        else { a.insertBefore(n, o); o.remove(); mphIn(n); }
    }
    for (let i = nw.length; i < old.length; i++) mphOut(old[i]);
}

function mphNode(a, b) {
    if (a.nodeType != 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    mphAttrs(a, b);
    const tg = a.tagName;
    if (tg == "CANVAS") return;
    if (tg == "TEXTAREA") { if (a !== document.activeElement && a.value !== b.value) a.value = b.value; return; }
    if (tg == "INPUT") {
        if (a.type == "checkbox" || a.type == "radio") a.checked = b.hasAttribute("checked");
        else if (a !== document.activeElement) { const v = b.getAttribute("value") || ""; if (a.value !== v) a.value = v; }
        return;
    }
    mphKids(a, b);
    if (tg == "SELECT") { const s = [...b.options].findIndex(o => o.hasAttribute("selected")); a.selectedIndex = s < 0 ? 0 : s; }
    if (tg == "OPTION" && b.label && a.label !== b.label) a.label = b.label;
}

let mphOn = true; // false = sin animaciones (usuario con "reducir movimiento")
try { mphOn = !window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

// html: contenido nuevo; soft: true = comparar y actualizar en su lugar; false = reemplazar todo (cambio de pestaña)
function paintMain(el, html, soft) {
    if (!soft || !el.firstElementChild) { el.innerHTML = html; return; }
    try {
        const box = document.createElement("div");
        box.innerHTML = html;
        if (typeof trTree == "function") trTree(box); // se traduce antes de comparar, así no hay diferencias falsas
        mphKids(el, box);
    } catch (e) { el.innerHTML = html; }
}
