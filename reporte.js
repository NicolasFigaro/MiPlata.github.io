// ===== Mi Plata · reporte.js =====
// Reporte ejecutivo del mes: una hoja limpia lista para imprimir o guardar como PDF.
// Solo lee datos (usa las funciones de logica.js); no cambia nada de tu información.
// Usa estilos propios (no dependen de Tailwind ni del tema) para que se vea igual en pantalla y en el PDF.

let rpD = null;   // mes que se está viendo en el reporte
let rpKey = "";   // "2026-10"
let rpEsc = null; // manejador de la tecla Escape

function rpStyle() {
    if (document.getElementById("rpStyle")) return;
    const ac = (() => { try { const v = accent(600); return v == "rgb()" ? "#4f46e5" : v; } catch (e) { return "#4f46e5"; } })();
    const s = document.createElement("style");
    s.id = "rpStyle";
    s.textContent = `
    #rpOverlay { position: fixed; inset: 0; z-index: 70; overflow: auto; background: #e2e8f0; font-family: 'Inter', Arial, sans-serif; color: #0f172a; -webkit-text-size-adjust: 100%; }
    #rpOverlay * { box-sizing: border-box; }
    .rp-bar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 16px; background: #0f172a; color: #fff; }
    .rp-bar button { border: 0; border-radius: 10px; padding: 8px 14px; font: 600 12px 'Inter', Arial, sans-serif; cursor: pointer; background: rgba(255,255,255,.14); color: #fff; }
    .rp-bar button:hover { background: rgba(255,255,255,.25); }
    .rp-bar button.main { background: ${ac}; }
    .rp-nav { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; text-transform: capitalize; }
    .rp-nav button { width: 30px; height: 30px; padding: 0; border-radius: 50%; font-size: 16px; }
    .rp-page { max-width: 820px; margin: 16px auto; background: #fff; padding: 36px 40px; border-radius: 6px; box-shadow: 0 4px 24px rgba(15,23,42,.15); font-size: 12.5px; line-height: 1.5; }
    .rp-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; padding-bottom: 14px; border-bottom: 3px solid ${ac}; margin-bottom: 18px; }
    .rp-head h1 { margin: 0; font-size: 22px; letter-spacing: -.3px; }
    .rp-head small { color: #64748b; font-size: 11px; display: block; margin-top: 2px; }
    .rp-head .mes { font-size: 17px; font-weight: 700; color: ${ac}; text-transform: capitalize; text-align: right; }
    .rp-sum { background: #f8fafc; border-left: 4px solid ${ac}; padding: 12px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
    .rp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
    .rp-kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
    .rp-kpi span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; font-weight: 700; }
    .rp-kpi b { display: block; font-size: 16px; margin-top: 2px; }
    .rp-kpi small { display: block; font-size: 10px; margin-top: 1px; color: #64748b; }
    .rp-sec { margin-top: 20px; break-inside: avoid; page-break-inside: avoid; }
    .rp-sec h2 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .07em; color: ${ac}; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .rp-sec h2 em { font-style: normal; color: #94a3b8; text-transform: none; letter-spacing: 0; font-weight: 500; margin-left: 6px; }
    .rp table { width: 100%; border-collapse: collapse; }
    .rp th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; padding: 5px 6px; border-bottom: 1px solid #cbd5e1; }
    .rp td { padding: 6px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .rp .r { text-align: right; white-space: nowrap; }
    .rp tfoot td { font-weight: 700; border-top: 1px solid #cbd5e1; border-bottom: 0; }
    .rp-track { height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; min-width: 60px; }
    .rp-track i { display: block; height: 100%; background: ${ac}; border-radius: 3px; }
    .rp-bad { color: #e11d48; } .rp-good { color: #059669; } .rp-warn { color: #d97706; } .rp-mut { color: #64748b; }
    .rp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .rp ul { margin: 0; padding-left: 18px; } .rp li { margin-bottom: 5px; }
    .rp-empty { color: #94a3b8; font-style: italic; padding: 4px 0; }
    .rp-foot { margin-top: 22px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; }
    @media (max-width: 640px) {
        .rp-page { margin: 0; border-radius: 0; padding: 22px 16px; }
        .rp-kpis { grid-template-columns: 1fr 1fr; }
        .rp-two { grid-template-columns: 1fr; }
        .rp-head { flex-direction: column; align-items: flex-start; }
        .rp-head .mes { text-align: left; }
        .rp table { font-size: 11px; }
    }
    @media print {
        @page { margin: 14mm; }
        html, body { background: #fff !important; }
        body > *:not(#rpOverlay) { display: none !important; }
        #rpOverlay { position: static !important; overflow: visible !important; background: #fff !important; }
        .rp-bar { display: none !important; }
        .rp-page { max-width: none; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
        .rp-kpis { grid-template-columns: repeat(4, 1fr) !important; }
        .rp-two { grid-template-columns: 1fr 1fr !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }`;
    document.head.appendChild(s);
}

// Arma el contenido del reporte para el mes d. Mira ese mes sin tocar el que estás viendo en la app,
// y muestra las cifras completas aunque tengas el modo incógnito activado.
function rpBuild(d) {
    const saveCur = cur, saveMask = S.th.mask;
    cur = new Date(d.getFullYear(), d.getMonth(), 1);
    S.th.mask = false;
    try { return rpHtml(); } finally { cur = saveCur; S.th.mask = saveMask; }
}

function rpHtml() {
    const k = ym(cur), pk = monthKey(1), nowK = ym(new Date());
    const mlabel = cur.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    const plabel = new Date(pk + "-01T00:00:00").toLocaleDateString("es-CO", { month: "long" });
    const m = mon();

    // ----- Cifras del mes -----
    const ing = sum(m, x => x.t == "i"), aho = svm();
    const by = G.map(([c]) => [c, sum(m, x => x.t == "g" && x.c == c && !x.s)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const gas = by.reduce((s, x) => s + x[1], 0), res = ing - gas - aho;
    const P = catTotals(pk), pMap = {}; P.forEach(([c, v]) => { pMap[c] = v; });
    const pg = P.reduce((s, x) => s + x[1], 0);
    const pIng = S.items.filter(x => x.d.startsWith(pk) && x.t == "i" && vis(x)).reduce((s, x) => s + x.a, 0);
    const dl = (a, b, goodUp) => {
        if (!(b > 0)) return "";
        const p = Math.round(Math.abs(a - b) / b * 100);
        if (!p) return `<small>igual que en ${plabel}</small>`;
        const up = a > b, good = up == goodUp;
        return `<small class="${good ? "rp-good" : "rp-bad"}">${up ? "▲" : "▼"} ${p}% vs ${plabel}</small>`;
    };
    const none = !ing && !gas && !aho;
    const T = tipsList(by);

    let sumTxt;
    if (none) sumTxt = "No hay movimientos registrados en este mes.";
    else {
        sumTxt = `En ${mlabel} ingresaron <b>${fmt(ing)}</b>, gastaste <b>${fmt(gas)}</b>${ing > 0 ? " (" + Math.round(gas / ing * 100) + "% de tus ingresos)" : ""} y apartaste <b>${fmt(aho)}</b> para ahorro. `;
        sumTxt += res >= 0 ? `El mes cierra con <b class="rp-good">${fmt(res)}</b> de saldo.` : `Entre gastos y ahorro superaste tus ingresos por <b class="rp-bad">${fmt(-res)}</b>.`;
        if (by[0] && gas > 0) sumTxt += ` Tu mayor gasto fue <b>${esc(by[0][0])}</b> (${Math.round(by[0][1] / gas * 100)}% del total).`;
    }

    const sec = (t, body, note) => `<section class="rp-sec"><h2>${t}${note ? `<em>${note}</em>` : ""}</h2>${body}</section>`;
    const kpi = (l, v, sub, cl) => `<div class="rp-kpi"><span>${l}</span><b class="${cl || ""}">${v}</b>${sub || ""}</div>`;

    // ----- Categorías -----
    const catRows = by.map(([c, v]) => {
        const b = budOf(c, k), r = b ? v / b : 0, pv = pMap[c] || 0, d = v - pv;
        const bud = b ? `<span class="${r >= 1 ? "rp-bad" : r >= .8 ? "rp-warn" : ""}">${Math.round(r * 100)}% de ${fmt(b)}</span>` : '<span class="rp-mut">—</span>';
        const ch = pv > 0 ? `<span class="${d > 0 ? "rp-bad" : d < 0 ? "rp-good" : "rp-mut"}">${d > 0 ? "+" : ""}${Math.round(d / pv * 100)}%</span>` : '<span class="rp-mut">nuevo</span>';
        return `<tr><td>${esc(c)}</td><td class="r"><b>${fmt(v)}</b></td><td style="width:90px"><div class="rp-track"><i style="width:${Math.min(100, v / gas * 100)}%"></i></div></td><td class="r">${Math.round(v / gas * 100)}%</td><td class="r">${bud}</td><td class="r">${ch}</td></tr>`;
    }).join("");
    const catT = by.length ? `<table><thead><tr><th>Categoría</th><th class="r">Monto</th><th></th><th class="r">% total</th><th class="r">Presupuesto</th><th class="r">vs ${plabel}</th></tr></thead><tbody>${catRows}</tbody>
        <tfoot><tr><td>Total</td><td class="r">${fmt(gas)}</td><td></td><td class="r">100%</td><td></td><td class="r">${pg > 0 ? (gas >= pg ? "+" : "") + Math.round((gas - pg) / pg * 100) + "%" : ""}</td></tr></tfoot></table>` : '<p class="rp-empty">Sin gastos este mes.</p>';

    // ----- Regla 50/30/20 -----
    let regla = "";
    if (T.ing > 0) {
        const row = (l, v, ideal, low) => { const p = Math.round(v / T.ing * 100), ok = low ? p >= ideal : p <= ideal; return `<tr><td>${l}</td><td class="r">${fmt(v)}</td><td class="r"><b>${p}%</b></td><td class="r rp-mut">${low ? "mín. " : "máx. "}${ideal}%</td><td class="r ${ok ? "rp-good" : "rp-warn"}">${ok ? "✓" : "⚠"}</td></tr>`; };
        regla = sec("Distribución de tus ingresos", `<table><thead><tr><th>Tipo</th><th class="r">Monto</th><th class="r">% ingresos</th><th class="r">Ideal</th><th></th></tr></thead><tbody>${row("Necesidades", T.nec, 50)}${row("Gustos", T.gus, 30)}${row("Ahorro", T.aho, 20, true)}</tbody></table>`, "regla 50/30/20");
    }

    // ----- Mayores gastos -----
    const top = m.filter(x => x.t == "g" && !x.s).sort((a, b) => b.a - a.a).slice(0, 5);
    const topT = top.length ? `<table><thead><tr><th>Gasto</th><th>Fecha</th><th>Pagado con</th><th class="r">Monto</th></tr></thead><tbody>${top.map(x => `<tr><td>${esc(x.n || x.c)}${x.n ? ` <span class="rp-mut">· ${esc(x.c)}</span>` : ""}</td><td>${dmy(x.d).slice(0, 5)}</td><td>${esc(x.k || x.w || (x.sav ? "Meta de ahorro" : "—"))}</td><td class="r"><b>${fmt(x.a)}</b></td></tr>`).join("")}</tbody></table>` : '<p class="rp-empty">Sin gastos este mes.</p>';

    // ----- Tarjetas -----
    const cs = S.cards.filter(c => !(S.hide || {})[c.n]);
    const cardT = cs.length ? `<table><thead><tr><th>Tarjeta</th><th class="r">Compras del mes</th><th class="r">Cuota por pagar</th><th class="r">Intereses</th><th class="r">Cupo usado</th></tr></thead><tbody>${cs.map(c => {
        const u = cardUse(c, k), buy = S.items.filter(x => x.d.startsWith(k) && x.k == c.n).reduce((s, x) => s + x.a, 0), due = cardDue(c, k), it = cardInt(c, k);
        return `<tr><td>${esc(c.n)}</td><td class="r">${fmt(buy)}</td><td class="r"><b>${fmt(due)}</b></td><td class="r ${it > 0 ? "rp-warn" : ""}">${fmt(it)}</td><td class="r">${c.c ? `<span class="${u.raw >= 70 ? "rp-bad" : u.raw >= 30 ? "rp-warn" : "rp-good"}">${Math.round(u.raw)}%</span> <span class="rp-mut">(${fmt(u.used)})</span>` : '<span class="rp-mut">—</span>'}</td></tr>`;
    }).join("")}</tbody></table>` : "";

    // ----- Deudas -----
    const ds = S.dbt.filter(d => dbtLeft(d) > 0);
    const dT = ds.length ? `<table><thead><tr><th>Deuda</th><th class="r">Cuota</th><th class="r">Pagado</th><th class="r">Saldo</th></tr></thead><tbody>${ds.map(d => `<tr><td>${esc(d.n)}</td><td class="r">${d.cu > 0 ? fmt(d.cu) : "—"}</td><td class="r">${Math.round(Math.max(0, d.t - dbtLeft(d)) / d.t * 100)}%</td><td class="r"><b>${fmt(dbtLeft(d))}</b></td></tr>`).join("")}</tbody><tfoot><tr><td>Total</td><td></td><td></td><td class="r">${fmt(ds.reduce((s, d) => s + dbtLeft(d), 0))}</td></tr></tfoot></table>` : "";

    // ----- Metas -----
    const ms = S.acc.filter(a => !a.f);
    const mT = ms.length ? `<table><thead><tr><th>Meta</th><th class="r">Ahorrado</th><th class="r">Objetivo</th><th style="width:90px"></th><th class="r">Avance</th><th class="r">Fecha límite</th></tr></thead><tbody>${ms.map(a => {
        const t = goalTotal(a), p = a.g ? Math.min(100, t / a.g * 100) : 0, gi = goalInfo(a);
        return `<tr><td>${esc(a.n)}</td><td class="r"><b>${fm(a, t)}</b></td><td class="r">${a.g ? fm(a, a.g) : "—"}</td><td>${a.g ? `<div class="rp-track"><i style="width:${p}%"></i></div>` : ""}</td><td class="r">${a.g ? Math.round(p) + "%" : "—"}</td><td class="r ${gi && gi.late ? "rp-bad" : gi && !gi.ok && !gi.done ? "rp-warn" : ""}">${a.dl ? dmy(a.dl) : "—"}</td></tr>`;
    }).join("")}</tbody></table>` : "";

    // ----- Inversiones y patrimonio -----
    const IV = invPortfolio();
    const invT = S.inv.length ? `<div class="rp-kpis" style="grid-template-columns:repeat(3,1fr)">${kpi("Valor actual", fmt(IV.T))}${kpi("Invertido", fmt(IV.C))}${kpi("Ganancia", (IV.T >= IV.C ? "+" : "") + fmt(IV.T - IV.C), IV.ann !== null ? `<small>≈ ${pct1(IV.ann)} anual (estimado)</small>` : "", IV.T >= IV.C ? "rp-good" : "rp-bad")}</div>` : "";
    const nw = netWorth(), pn = S.nwh[pk];
    const nwT = `<div class="rp-kpis" style="grid-template-columns:repeat(3,1fr)">${kpi("Patrimonio neto", fmt(nw.tot), k == nowK && pn !== undefined ? `<small class="${nw.tot >= pn ? "rp-good" : "rp-bad"}">${nw.tot >= pn ? "▲" : "▼"} ${fmt(Math.abs(nw.tot - pn))} vs cierre de ${plabel}</small>` : "", nw.tot < 0 ? "rp-bad" : "")}${kpi("Tienes", fmt(nw.act), `<small>billeteras, ahorros e inversiones</small>`, "rp-good")}${kpi("Debes", fmt(nw.pas), `<small>tarjetas (capital) y deudas</small>`, nw.pas > 0 ? "rp-bad" : "")}</div>`;

    // ----- Observaciones -----
    const obs = T.list.filter(t => t.lv < 3).length ? T.list.filter(t => t.lv < 3) : T.list;
    const obsT = `<ul>${obs.map(t => `<li><b>${esc(t.t)}.</b> <span class="rp-mut">${esc(t.d)}</span></li>`).join("")}</ul>`;

    const now = new Date();
    return `<div class="rp">
        <div class="rp-head"><div><h1>Mi Plata · Reporte ejecutivo</h1><small>Resumen financiero personal</small></div><div class="mes">${mlabel}</div></div>
        <div class="rp-sum">${sumTxt}</div>
        <div class="rp-kpis">
            ${kpi("Ingresos", fmt(ing), dl(ing, pIng, true), "rp-good")}
            ${kpi("Gastos", fmt(gas), dl(gas, pg, false))}
            ${kpi("Ahorro", fmt(aho), ing > 0 ? `<small>${Math.round(aho / ing * 100)}% de tus ingresos</small>` : "")}
            ${kpi("Saldo del mes", fmt(res), "<small>ingresos − gastos − ahorro</small>", res < 0 ? "rp-bad" : "rp-good")}
        </div>
        ${sec("En qué se fue la plata", catT)}
        <div class="rp-two">${regla ? regla : ""}${sec("5 mayores gastos", topT)}</div>
        ${cardT ? sec("Tarjetas de crédito", cardT) : ""}
        ${dT ? sec("Deudas", dT, "saldo actual") : ""}
        ${mT ? sec("Metas de ahorro", mT) : ""}
        ${S.inv.length ? sec("Inversiones", invT) : ""}
        ${sec("Patrimonio", nwT, "foto de hoy")}
        ${sec("Observaciones", obsT)}
        <div class="rp-foot">Generado el ${dmy(ymd(now))} a las ${now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}. Los movimientos marcados «fuera del resumen» y los elementos ocultos en Ajustes no se cuentan. El patrimonio, las deudas y la deuda de tarjetas reflejan el estado de hoy, no el del mes elegido. Cifras estimadas: no es asesoría financiera.</div>
    </div>`;
}

function rpRender() {
    const o = document.getElementById("rpOverlay"); if (!o) return;
    const lbl = rpD.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    o.innerHTML = `
        <div class="rp-bar">
            <div class="rp-nav"><button onclick="rpGo(-1)" aria-label="Mes anterior">‹</button><span>${lbl}</span><button onclick="rpGo(1)" aria-label="Mes siguiente">›</button></div>
            <div style="display:flex;gap:8px"><button class="main" onclick="rpPrint()">Imprimir / Guardar PDF</button><button onclick="closeReport()">Cerrar</button></div>
        </div>
        <div class="rp-page">${rpBuild(rpD)}</div>`;
    rpKey = ym(rpD);
}
function rpGo(n) { rpD = new Date(rpD.getFullYear(), rpD.getMonth() + n, 1); rpRender(); const o = document.getElementById("rpOverlay"); if (o) o.scrollTop = 0; }
function rpPrint() {
    // El nombre del PDF sale del título de la página
    const t = document.title;
    document.title = "Mi Plata - Reporte " + rpKey;
    const back = () => { document.title = t; window.removeEventListener("afterprint", back); };
    window.addEventListener("afterprint", back);
    window.print();
}
function openReport() {
    rpStyle();
    closeReport();
    rpD = new Date(cur.getFullYear(), cur.getMonth(), 1); // arranca en el mes que estás viendo
    const o = document.createElement("div");
    o.id = "rpOverlay";
    document.body.appendChild(o);
    rpRender();
    rpEsc = e => { if (e.key == "Escape") closeReport(); };
    document.addEventListener("keydown", rpEsc);
}
function closeReport() {
    const o = document.getElementById("rpOverlay"); if (o) o.remove();
    if (rpEsc) { document.removeEventListener("keydown", rpEsc); rpEsc = null; }
}
