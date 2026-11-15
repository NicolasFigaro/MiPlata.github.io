// ---------- Prima de servicios y cesantías (Colombia) ----------
// Valores legales de 2026 (Decretos 1469 y 1470 de 2025). Cada diciembre sale el decreto del año siguiente:
// se cambian en Ajustes → Prima y cesantías, sin tocar el código.
const PR_SMMLV = 1750905, PR_AUX = 249095;
REM_WIN.p = 7; // empieza a avisar 7 días antes

// Días entre dos fechas con el año comercial de 360 días (meses de 30), contando ambos extremos: así se liquidan las prestaciones
const dd30 = d => { const n = d.getDate(); return d.getMonth() == 1 && n == new Date(d.getFullYear(), 2, 0).getDate() ? 30 : Math.min(n, 30); };
const d360 = (a, b) => b < a ? 0 : (b.getFullYear() - a.getFullYear()) * 360 + (b.getMonth() - a.getMonth()) * 30 + (dd30(b) - dd30(a)) + 1;

// Base de liquidación: el sueldo más el auxilio de transporte si ganas hasta 2 salarios mínimos
const prBase = c => c.sal + (c.sal <= 2 * (c.smm || PR_SMMLV) ? (c.aux == null ? PR_AUX : c.aux) : 0);

// kind: p1 = prima ene–jun · p2 = prima jul–dic · ce = cesantías del año · ic = intereses de las cesantías del año
function prAmount(kind, y) {
    const c = S.pr; if (!c || !c.sal) return 0;
    const per = kind == "p1" ? [new Date(y, 0, 1), new Date(y, 5, 30)] : kind == "p2" ? [new Date(y, 6, 1), new Date(y, 11, 31)] : [new Date(y, 0, 1), new Date(y, 11, 31)];
    const ini = c.ini ? new Date(c.ini + "T00:00:00") : null, from = ini && ini > per[0] ? ini : per[0];
    if (from > per[1]) return 0;
    const days = Math.min(kind[0] == "p" ? 180 : 360, d360(from, per[1])), v = prBase(c) * days / 360;
    return Math.round(kind == "ic" ? v * days * 0.12 / 360 : v);
}

// Eventos para el calendario, "Esta semana" y las notificaciones (los lee reminderEvents en logica.js)
function prEvents() {
    const c = S.pr; if (!c || !c.sal || c.on === false) return [];
    const E = [], y0 = new Date().getFullYear(), pad = n => String(n).padStart(2, "0"), D = (y, m, d) => y + "-" + pad(m) + "-" + pad(d);
    for (let y = y0 - 1; y <= y0 + 1; y++) {
        [["p1", D(y, 6, 30), "Tu prima de servicios (ene–jun)", "Tu empleador debe pagarla a más tardar el 30 de junio."],
         ["p2", D(y, 12, 20), "Tu prima de servicios (jul–dic)", "Tu empleador debe pagarla a más tardar el 20 de diciembre."],
         ["ic", D(y + 1, 1, 31), "Los intereses de tus cesantías", "Te los deben pagar a más tardar el 31 de enero."],
         ["ce", D(y + 1, 2, 14), "Tus cesantías", "Tu empleador debe consignarlas a tu fondo antes del 14 de febrero."]].forEach(([k, date, what, tip]) => {
            const dy = daysTo(date); if (dy < -7 || dy > 400) return;
            const v = prAmount(k, y); if (!(v > 0)) return;
            E.push({ key: "p" + k + y, title: "Mi Plata · Prima y cesantías", what, k: "p", amt: fmt(v), date, win: REM_WIN.p, extra: "Estimado: " + fmt(v) + ". " + tip });
        });
    }
    return E;
}

// Sección de Ajustes
function prBody() {
    const c = S.pr, row = (t, d, v) => `<div class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800"><div class="min-w-0"><b class="text-sm text-slate-800 dark:text-white block">${t}</b><small class="text-[11px] text-slate-400">${d}</small></div><b class="text-sm text-slate-800 dark:text-white shrink-0">${v}</b></div>`;
    if (!c || !c.sal) return `<p class="text-xs text-slate-400">Calcula tu prima de servicios, tus cesantías y sus intereses (para empleados en Colombia) y te avisa cuando se acerque cada pago. Es un estimado: la liquidación oficial la hace tu empleador.</p><button onclick="prEdit()" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">Configurar</button>`;
    const y = new Date().getFullYear(), s2 = new Date().getMonth() >= 6;
    return `<div>${row("Prima de servicios " + (s2 ? "(jul–dic)" : "(ene–jun)"), "Se paga a más tardar el " + (s2 ? "20 de diciembre" : "30 de junio"), fmt(prAmount(s2 ? "p2" : "p1", y)))}${row("Cesantías " + y, "Tu empleador las consigna al fondo antes del 14 de feb.", fmt(prAmount("ce", y)))}${row("Intereses de cesantías " + y, "Te los pagan antes del 31 de enero", fmt(prAmount("ic", y)))}</div>
        <p class="text-[11px] text-slate-400">Estimado a fin de periodo, con base de ${fmt(prBase(c))}${c.ini ? " y tu fecha de ingreso" : ""}. Tu empleador hace la liquidación oficial.</p>
        <div class="flex flex-wrap gap-2"><button onclick="prEdit()" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">Cambiar datos</button><button onclick="prToggle()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs">${c.on === false ? "Activar avisos" : "Quitar avisos"}</button></div>`;
}
const prSub = () => S.pr && S.pr.sal ? (S.pr.on === false ? "Sin avisos" : "Con avisos") : "Sin configurar";
function prEdit() {
    const c = S.pr || {};
    openCustomModal("Prima y cesantías", [
        { l: "Salario mensual (sin auxilio)", v: c.sal || "", m: "numeric", p: "Ej. 3000000" },
        { l: "Fecha de ingreso (opcional)", v: c.ini || "", t: "date" },
        { l: "Salario mínimo del año", v: c.smm || PR_SMMLV, m: "numeric" },
        { l: "Auxilio de transporte del año", v: c.aux == null ? PR_AUX : c.aux, m: "numeric" }
    ], v => {
        const sal = num(v[0]); if (!sal) return "Escribe tu salario mensual.";
        if (v[1] && new Date(v[1] + "T00:00:00") > new Date()) return "La fecha de ingreso no puede ser futura.";
        S.pr = { on: c.on !== false, sal, ini: v[1] || "", smm: num(v[2]) || PR_SMMLV, aux: v[3] === "" ? PR_AUX : num(v[3]) };
        save(); showToast("Guardado");
    });
}
function prToggle() { if (!S.pr) return; S.pr.on = S.pr.on === false; save(); draw(); }
