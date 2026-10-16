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

// ===== Dictado por voz =====
// Toca el micrófono, di "almuerzo quince mil" y se llena igual que si lo hubieras escrito.
// Usa el reconocimiento de voz del navegador (Chrome/Edge/Safari). Necesita https y permiso de micrófono.
const QE_SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const qeCanVoice = () => !!QE_SR;
const QE_NUM = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900 };
// "quince mil" → "15000", "dos millones quinientos mil" → "2500000". Solo convierte si el resultado es >= 100 (así "un almuerzo" no se vuelve "1 almuerzo").
function qeWordsToNum(txt) {
    const tk = txt.split(/\s+/).filter(Boolean), out = [];
    const isNum = w => qeNorm(w) in QE_NUM, isMul = w => /^(mil|millon|millones)$/.test(qeNorm(w));
    for (let i = 0; i < tk.length;) {
        const prevDigit = out.length && /\d/.test(out[out.length - 1]);
        if (!(isNum(tk[i]) || (isMul(tk[i]) && !prevDigit))) { out.push(tk[i++]); continue; }
        let j = i, total = 0, cur = 0;
        while (j < tk.length) {
            const n = qeNorm(tk[j]);
            if (n in QE_NUM) cur += QE_NUM[n];
            else if (n == "mil") { total += (cur || 1) * 1e3; cur = 0; }
            else if (n == "millon" || n == "millones") { total += (cur || 1) * 1e6; cur = 0; }
            else if (n == "y" && j + 1 < tk.length && isNum(tk[j + 1])) { /* conector: "treinta y cinco" */ }
            else break;
            j++;
        }
        const v = total + cur;
        if (v >= 100) out.push(String(v)); else out.push(...tk.slice(i, j));
        i = j;
    }
    return out.join(" ");
}
function qeVoiceText(raw) {
    let t = String(raw || "").replace(/[$]/g, " ");
    if (LANG == "es") t = qeWordsToNum(t);
    t = t.replace(/(\d{1,3})\s(\d{3})(?!\d)/g, "$1$2");            // "15 000" → "15000"
    t = t.replace(/\b(pesos|peso|cop)\b/gi, " ");                  // "quince mil pesos" → "quince mil"
    return t.replace(/\s+/g, " ").trim();
}
let qeRec = null, qeWd = 0;
const qeEl = id => document.getElementById(id);
// Se busca el micrófono y el campo cada vez: "Anotar rápido" redibuja el formulario al cambiar entre gasto e ingreso y los elementos viejos quedan sueltos.
const qeMicState = on => { const b = qeEl("qeMic"); if (b) b.classList.toggle("qe-rec", !!on); };
function qeVoiceStop() { // corta y limpia todo, aunque el navegador no avise que terminó
    clearTimeout(qeWd);
    const r = qeRec; qeRec = null; qeMicState(false);
    if (r) { r.onresult = r.onerror = r.onend = r.onstart = null; try { r.abort(); } catch (e) {} }
}
function qeVoice() {
    if (!QE_SR) return showToast("Dictado por voz no disponible en este navegador. Usa el micrófono del teclado.", true);
    if (qeRec) { // ya está escuchando: este toque termina el dictado (si el navegador no responde, se fuerza)
        try { qeRec.stop(); } catch (e) {}
        clearTimeout(qeWd); qeWd = setTimeout(qeVoiceStop, 1200); return;
    }
    qeVoiceStop();
    const r = qeRec = new QE_SR();
    r.lang = { es: "es-CO", en: "en-US", fr: "fr-FR", de: "de-DE", ru: "ru-RU" }[LANG] || "es-CO";
    r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    r.onstart = () => { if (qeRec !== r) return; qeMicState(true); if (typeof buzz == "function") try { buzz(); } catch (e) {} };
    r.onresult = e => {
        if (qeRec !== r) return;
        let t = ""; for (const x of e.results) t += x[0].transcript + " ";
        const q = qeEl("qe"); if (!q) return;
        q.value = qeVoiceText(t); qeParse(q.value);
        qeMicState(true); // qeParse puede redibujar el formulario
    };
    r.onerror = e => {
        if (qeRec !== r) return;
        const err = e && e.error;
        if (err == "not-allowed" || err == "service-not-allowed") showToast("Permite el micrófono para dictar.", true);
        else if (err == "no-speech") showToast("No te escuché. Intenta de nuevo.", true);
        else if (err == "audio-capture") showToast("No encuentro un micrófono disponible.", true);
        else if (err != "aborted") showToast("El servicio de voz no responde. Prueba en Chrome o Safari, o usa el micrófono del teclado.", true);
        qeVoiceStop();
    };
    r.onend = () => { if (qeRec === r) qeVoiceStop(); };
    qeWd = setTimeout(qeVoiceStop, 20000); // seguro: si algo se cuelga, a los 20 s se libera
    try { r.start(); } catch (e) { qeVoiceStop(); showToast("No se pudo iniciar el micrófono. Intenta de nuevo.", true); }
}
