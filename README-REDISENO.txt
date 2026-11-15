MI PLATA — DISEÑO SERIO, SEGUNDA PASADA

Qué cambió
- Inicio: la barra "Gasto del mes" lleva la marca "Hoy deberías ir en X %" (día del mes ÷ días del mes).
  El relleno es lo gastado ÷ (gastado + disponible). Solo aparece en el mes actual.
- Inicio: los avisos (copia de seguridad, gastos fijos por confirmar, vencimientos de la semana) son una lista de una línea cada uno.
- Inicio: Movimientos, En qué se va la plata, Consejos y Patrimonio usan un solo acento.
- Inicio: el selector de mes baja a otra línea si la cifra es grande (la flecha › quedaba fuera de la tarjeta).
- Tarjetas: línea de tiempo del ciclo (hoy, corte, pago) y sección "Compras a cuotas" con barra de progreso (también en el extracto).
- Gráficas: frase de conclusión arriba y un solo color (en tonos) en dona, barras y portafolio.
- Traducciones: frases nuevas en inglés, francés, alemán y ruso (idioma-datos.js).
- Caché del service worker: miplata-v33. Se quitó redise├▒o-ios.css (no se cargaba).
- Sin tocar: Calendario, Resumen, Deudas, Suscripciones, Asistente, Más y Ajustes.

- Inicio rediseñado (liquid glass): cabecera de vidrio oscuro teñido con el color del tema (usa color-mix; en celulares viejos queda un fondo plano).
  "Hoy puedes gastar" es la cifra grande, "Disponible" baja a tamaño medio, la barra del mes es una cápsula de líquido
  (se pone roja si vas por encima del ritmo) y la proyección es una sola línea. Orbes de vidrio en Ahorros e Inversiones.
  Los estilos están al final de serio.css.

Cómo probar
1. Publica en una copia de prueba y cierra la app por completo (o borra los datos del sitio) para que cargue el caché nuevo.
2. Revisa Inicio, Tarjetas y Gráficas, en claro y oscuro, y que los íconos de los orbes se vean.

Verificado: Chromium a 390 px con datos de prueba, temas Mi Plata, Índigo, Violeta, Rosa, Grafito, iOS, Café y color propio, claro y oscuro.
No verificado: iPhone real, FontAwesome ni Chart.js reales (la prueba fue sin internet), celulares muy viejos (color-mix).

Pendiente de decisión: mostrar el EA también en cuentas (Nu, etc.), y el emoji ya elegido en las metas.
