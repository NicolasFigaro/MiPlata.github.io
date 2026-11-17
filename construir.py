#!/usr/bin/env python3
"""Prepara Mi Plata para subirla. Ejecuta SIEMPRE esto antes de subir los archivos:

      python3 construir.py

Hace dos cosas:
  1) Junta las hojas de css-fuentes/ en base.css y capas.css, respetando el orden de la cascada.
     (Edita SIEMPRE css-fuentes/, nunca base.css ni capas.css a mano.)
  2) Pone en sw.js un nombre de caché que cambia SOLO cuando cambia algún archivo de la app
     (miplata-v<APP_VER>-<huella>), así los celulares descargan la versión nueva sin que tengas que
     acordarte de subir ningún número. Si no cambió nada, el nombre queda igual.

Para anunciar «lo nuevo» en la tarjeta que sale al abrir la app: sube APP_VER en vistas.js y reescribe NEWS en nuevas.js.
Orden de carga en index.html:  base.css  ->  tailwind.css (generado aparte)  ->  capas.css
"""
import os, re, hashlib

D = os.path.dirname(os.path.abspath(__file__))
GRUPOS = {
    "base.css":  ["styles", "mejoras", "pantallas", "estetica"],
    "capas.css": ["diseno", "fluido", "ahorro-cuentas", "serio", "cristal", "summit", "claro", "rendimientos", "bolsillos", "bolsillos-cristal"],
}

def leer(ruta):
    with open(os.path.join(D, ruta), encoding="utf-8") as f:
        return f.read()

def escribir(ruta, txt):
    with open(os.path.join(D, ruta), "w", encoding="utf-8", newline="\n") as f:
        f.write(txt)

# 1) CSS
for salida, hojas in GRUPOS.items():
    partes = ["/* ===== " + h + ".css ===== */\n" + leer(os.path.join("css-fuentes", h + ".css")).rstrip() + "\n" for h in hojas]
    escribir(salida, "\n".join(partes))
    print(salida, "<-", ", ".join(hojas))

# 2) Nombre de la caché del service worker
sw = leer("sw.js")
shell = re.search(r"SHELL\s*=\s*\[(.*?)\]", sw, re.S)
if not shell:
    raise SystemExit("No encontré la lista SHELL en sw.js")
archivos = [a for a in re.findall(r'"([^"]+)"', shell.group(1))]
archivos = ["index.html" if a == "./" else a for a in archivos]
h = hashlib.sha256()
for a in sorted(set(archivos)):
    ruta = os.path.join(D, a)
    if not os.path.isfile(ruta):
        print("AVISO: sw.js lista", a, "pero el archivo no existe")
        continue
    h.update(a.encode()); h.update(open(ruta, "rb").read())
ver = re.search(r'const APP_VER\s*=\s*"([^"]+)"', leer("vistas.js"))
ver = ver.group(1) if ver else "x"
nombre = "miplata-v%s-%s" % (ver, h.hexdigest()[:8])
nuevo, n = re.subn(r'const C = "[^"]*"', 'const C = "%s"' % nombre, sw, count=1)
if n != 1:
    raise SystemExit("No encontré 'const C = ...' en sw.js")
if nuevo != sw:
    escribir("sw.js", nuevo)
print("sw.js  <- caché", nombre, "(%d archivos)" % len(archivos))
