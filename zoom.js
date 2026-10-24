// ===== Mi Plata · zoom.js =====
// Evita el zoom (pellizco y doble toque). iOS Safari ignora user-scalable=no, por eso también se bloquea por JS.
(function () {
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
        document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
    });
    var last = 0;
    document.addEventListener("touchend", function (e) {
        var n = Date.now();
        if (n - last < 350 && e.changedTouches && e.changedTouches.length == 1) {
            var tg = e.target;
            // Solo se bloquea el doble toque sobre texto o fondo. Botones y enlaces nunca: si no, un segundo toque rápido (ej. "Editar" justo después de deslizar) se pierde
            if (!(tg && tg.closest && tg.closest("input,textarea,select,button,a,label,summary,[onclick],[role=button],[contenteditable],.swipe-act"))) e.preventDefault();
        }
        last = n;
    }, { passive: false });
    document.addEventListener("touchmove", function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    document.addEventListener("wheel", function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
})();
