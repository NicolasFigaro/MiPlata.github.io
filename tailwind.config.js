// Solo para desarrollo: regenera ../tailwind.css cuando agregues clases nuevas de Tailwind al HTML o a los .js
// Uso (desde esta carpeta):  npx tailwindcss@3.4.17 -c tailwind.config.js -i entrada.css -o ../tailwind.css --minify
// Después sube el nuevo tailwind.css y cambia el número de versión en sw.js (const C = "miplata-vXX") para que el celular lo descargue.
const sc = v => Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(k => [k, 'rgb(var(--' + v + '-' + k + ') / <alpha-value>)']));
module.exports = {
  darkMode: 'class',
  content: ["../index.html", "../*.js", "!../idioma-datos.js", "!../sw.js"],
  theme: { extend: { colors: { indigo: sc('p'), violet: sc('s'), slate: sc('n'), brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' } } } }
};
