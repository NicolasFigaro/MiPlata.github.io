MI PLATA — REDISEÑO PREMIUM DE INICIO

Cambios incluidos:
- Se reorganizó Inicio para mostrar el balance disponible y, a continuación, el patrimonio neto.
- Se conserva la función existente nwUI(), sus cálculos, desglose de activos/pasivos y gráfico histórico.
- Se mantiene la lógica existente de disponible, gasto diario, proyección, saldos, ahorro, inversiones, movimientos, categorías, consejos y simulador.
- Se creó premium-inicio.css como capa visual independiente, cargada después de las hojas actuales.
- Se refinó el panel principal con una estética premium azul noche, mayor espacio vertical y tarjetas menos saturadas.
- Se mantiene el tema claro/oscuro, la navegación, el botón de nuevo movimiento y el soporte de área segura de iPhone.

Integridad:
- Se modificó la presentación y el orden de algunas secciones del Inicio.
- No se modificaron los cálculos financieros ni el esquema de almacenamiento.
- Se ejecutó node --check sobre los 18 archivos JavaScript: todos pasaron la comprobación de sintaxis.
- No se realizó una prueba manual en navegador ni en iPhone real; se recomienda probar en una copia antes de publicar.

Instalación:
1. Descomprime el ZIP.
2. Publica el contenido de MiPlata.github.io-main en tu repositorio de prueba.
3. Prueba Inicio, cambio de mes, ocultar cifras, tema claro/oscuro, agregar movimiento, cuentas, ahorro, tarjetas, reportes y simulador.
4. Conserva una copia de la versión anterior hasta validar que todo funciona con tus datos.
