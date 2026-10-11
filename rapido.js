// ===== Mi Plata · rapido.js =====
// Anotar rápido: escribes "almuerzo 15000" y se llenan monto, nota y categoría.
// Primero aprende de tu historial (si antes "uber" fue Transporte, vuelve a ser Transporte); si no, usa palabras clave.
const QE_KW = {
    "Comida": "almuerzo desayuno cena comida restaurante rest mercado super supermercado exito jumbo d1 ara olimpica carulla domicilio rappi ifood pizza hamburguesa empanada arepa cafe cafeteria panaderia pan pollo carne fruta verdura snack mecato helado gaseosa cerveza tinto jugo corrientazo menu sushi asadero",
    "Transporte": "uber didi cabify indriver taxi bus transmilenio metro sitp tm pasaje gasolina gasosa tanqueo parqueadero parqueo peaje moto bici soat tecnomecanica lavada transporte",
    "Vivienda": "arriendo alquiler renta administracion admin hipoteca predial aseo muebles reparacion plomero",
    "Servicios": "luz agua gas internet wifi celular plan minutos datos claro movistar tigo wom etb epm netflix spotify disney hbo prime youtube icloud suscripcion",
    "Ocio": "cine pelicula concierto fiesta rumba bar trago discoteca juego videojuego steam playstation xbox salida paseo viaje hotel entrada boleta",
    "Compras": "ropa zapatos tenis camisa pantalon jean tienda amazon mercadolibre shein regalo celular tecnologia audifonos libro",
    "Deudas/Tarjeta": "deuda prestamo cuota credito tarjeta abono",
    "Otros": "salud medico droga drogueria farmacia medicina cita gimnasio gym peluqueria barbero corte uñas"
};
const QE_IN = {
    "Sueldo": "sueldo salario nomina quincena pago mensualidad",
    "Extra": "extra freelance propina bono comision venta vendi trabajito proyecto",
    "Otro ingreso": "regalo reembolso devolucion cashback intereses rendimiento ingreso me_llego me_pagaron"
};
const qeNorm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function qeAmount(txt) {
    // Soporta: 15000, 15.000, 15,000, 15k, 15 mil, 1.5 millones, 2m
    const s = qeNorm(txt);
    const re = /(\d+(?:[.,]\d+)*)\s*(k|mil|millones|millon|m)?(?![a-z0-9])/g; let m, best = null;
    while ((m = re.exec(s))) {
        let raw = m[1], suf = m[2] || "", n;
        if (suf) { n = parseFloat(raw.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); n *= (suf == "k" || suf == "mil") ? 1e3 : 1e6; }
        else if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) n = parseInt(raw.replace(/[.,]/g, ""), 10);
        else n = parseFloat(raw.replace(",", "."));
        if (n > 0 && (!best || n >= best.n)) best = { n: Math.round(n), i: m.index, len: m[0].length };
    }
    return best;
}
function qeGuess(words, isIn) {
    const list = isIn ? I : G.filter(x => x[0] != "Ahorro").map(x => x[0]);
    // 1) Historial: la última vez que usaste esa palabra
    const hist = S.items.slice().reverse();
    for (const w of words) {
        if (w.length < 3) continue;
        const h = hist.find(x => (isIn ? x.t == "i" : x.t == "g") && x.n && qeNorm(x.n).split(/\s+/).includes(w) && list.includes(x.c));
        if (h) return h.c;
    }
    // 2) Nombre de categoría (incluye las que tú creaste)
    for (const w of words) { const c = list.find(n => qeNorm(n) == w || (w.length > 3 && qeNorm(n).startsWith(w))); if (c) return c; }
    // 3) Palabras clave
    const kw = isIn ? QE_IN : QE_KW;
    for (const w of words) for (const c in kw) if (list.includes(c) && kw[c].split(" ").includes(w)) return c;
    return null;
}
function qeParse(v) {
    const g = id => document.getElementById(id);
    const a = qeAmount(v), rest = a ? (v.slice(0, a.i) + " " + v.slice(a.i + a.len)).replace(/\s+/g, " ").trim() : v.trim();
    const words = qeNorm(rest).replace(/[^a-z0-9ñ_\s]/g, " ").split(/\s+/).filter(Boolean);
    // ¿Es ingreso? Empieza con "+" o trae una palabra de ingreso
    let isIn = /^\s*\+/.test(v) || words.some(w => Object.values(QE_IN).some(l => l.split(" ").includes(w)) && !/^(regalo)$/.test(w));
    if (/^\s*-/.test(v)) isIn = false;
    if (isIn != (type == "i")) {
        const keepV = g("qe").value, pos = g("qe").selectionStart;
        setType(isIn ? "i" : "g");
        const q = g("qe"); q.value = keepV; q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) {}
    }
    const amt = g("amt"), note = g("note");
    if (a) { amt.value = a.n.toLocaleString("es-CO"); fitAmt(amt); cuotaPreview(); metaPreview(); } else { amt.value = ""; fitAmt(amt); }
    const clean = rest.replace(/^[+\-]\s*/, "");
    note.value = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
    const c = qeGuess(words, isIn), s = g("cat");
    if (c && s) { s.value = c; syncCatGrid(); }
    const h = g("qeHint");
    if (h) h.textContent = a || c ? (c || "Sin categoría clara") + (a ? " · " + fmt(a.n) : "") : "";
}
