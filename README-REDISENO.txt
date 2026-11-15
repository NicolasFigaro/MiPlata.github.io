MI PLATA — REDISEÑO PREMIUM iOS / WALLET INSPIRED

Esta versión adapta la interfaz al lenguaje visual de Apple Wallet y de las apps financieras minimalistas de iOS:
- Inicio reconstruido con saludo compacto, balance protagonista y superficies sobrias.
- Acento azul reservado para acciones, estados e indicadores; deja de dominar grandes bloques de color.
- Accesos de En mano, Tarjetas y Apartado en tarjetas compactas.
- Resumen de ahorros/metas e inversiones, actividad reciente y simulador conservados en Inicio.
- Navegación inferior flotante translúcida y adaptada al área segura del iPhone.
- Tarjetas de crédito con acabados tipo tarjeta física / Wallet.
- Sistema de superficies para modo claro y oscuro.
- Tipografía del sistema Apple cuando está disponible, radios suaves y microinteracciones discretas.

CAMBIOS TÉCNICOS
- vistas.js: se reorganizó únicamente el HTML de vHome(); se mantienen las funciones y cálculos que alimentan los indicadores.
- wallet-ios.css: nueva hoja de estilos visual, cargada al final para aplicar el diseño sin reescribir los estilos base.
- index.html: se enlazó wallet-ios.css y se actualizó el título de la app.
- No se modificaron logica.js, acciones.js, respaldo.js, reporte.js ni los módulos de cálculos.
- Se conservaron PWA, almacenamiento local, exportación, navegación, formularios y demás pantallas.

INSTALACIÓN
1. Descarga y descomprime este ZIP.
2. Reemplaza los archivos de tu repositorio por el contenido de la carpeta MiPlata.github.io-main (o sube la carpeta si tu flujo de GitHub Pages está configurado así).
3. No borres archivos de datos del navegador: los registros se guardan localmente y no viajan dentro del ZIP.
4. Publica y abre primero la versión en una copia de prueba.
5. Comprueba Inicio, cambio claro/oscuro, modo privacidad, navegación, crear/editar/eliminar movimientos, cuentas, tarjetas, metas, inversiones, reportes y copia de seguridad.

VALIDACIÓN
- Se ejecutó node --check sobre todos los archivos JavaScript del proyecto.
- Se comprobó la integridad del ZIP final.
- No se pudo completar una prueba visual automatizada en navegador dentro de este entorno; recomendamos una comprobación final en Safari de iPhone y en escritorio antes de sustituir la versión publicada.
