MI PLATA · REDISEÑO PREMIUM iOS
================================

Esta versión parte del proyecto original y actualiza principalmente la composición de Inicio y su capa visual. La dirección toma como referencia Apple Wallet y dashboards financieros minimalistas: negro/blanco, cifras protagonistas, controles circulares, superficies discretas y acento azul contenido.

QUÉ CAMBIÓ
----------
- Inicio reorganizado en torno al saldo disponible.
- Acciones rápidas para registrar movimientos, abrir Cuentas y Tarjetas.
- Presupuesto diario y proyección mensual en paneles compactos.
- Resumen de En mano, Tarjetas y Apartado integrado en la tarjeta principal.
- Ahorros, metas e inversiones con jerarquía más clara.
- Movimientos recientes y secciones secundarias conservadas.
- Capa visual independiente en premium-ios.css.
- Hoja nueva añadida al precache y versión de caché actualizada.
- Los temas claro y oscuro existentes se conservan; el nuevo diseño adapta sus superficies a ambos.

QUÉ SE CONSERVÓ
---------------
- Cálculos, estructura de datos y almacenamiento local originales.
- Acciones de movimientos, cuentas, metas, tarjetas, inversiones, reportes y respaldos.
- Navegación, PWA y módulos JavaScript existentes.
- No se incluyeron datos financieros personales dentro del ZIP.

INSTALACIÓN
-----------
1. Guarda una copia de seguridad desde Mi Plata antes de reemplazar archivos.
2. Descomprime este ZIP.
3. Reemplaza los archivos del repositorio por el contenido de la carpeta MiPlata.github.io-main.
4. Publica los cambios en GitHub Pages.
5. Abre la app y verifica Inicio, cambio de tema, registro de un movimiento, Cuentas, Tarjetas y exportación de respaldo.

IMPORTANTE SOBRE TUS DATOS
--------------------------
Los datos se almacenan localmente en el navegador. Mantén exactamente el mismo dominio y ruta/origen de la aplicación. No borres los datos del sitio ni cambies el dominio si quieres conservar el almacenamiento local. Aun así, descarga un respaldo antes de actualizar.

VALIDACIÓN
----------
Se verificó la sintaxis de los archivos JavaScript con Node.js y que los archivos enlazados desde index.html existan en el proyecto. No se pudo completar una prueba visual interactiva en un navegador real ni una prueba completa en iPhone; por eso conviene probar primero en una copia de GitHub Pages.
