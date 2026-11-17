#!/usr/bin/env python3
"""Junta las hojas de css-fuentes/ en 2 archivos, respetando el orden de la cascada.
Edita SIEMPRE los archivos de css-fuentes/ y luego ejecuta:  python3 construir-css.py
Orden de carga en index.html:  base.css  ->  tailwind.css (generado aparte)  ->  capas.css
Después sube los archivos y cambia el número de versión en sw.js (const C = "miplata-vXX")."""
import os
D = os.path.dirname(os.path.abspath(__file__))
GRUPOS = {
    "base.css":  ["styles", "mejoras", "pantallas", "estetica"],
    "capas.css": ["diseno", "fluido", "ahorro-cuentas", "serio", "cristal", "summit", "claro", "rendimientos", "bolsillos", "bolsillos-cristal"],
}
for salida, hojas in GRUPOS.items():
    partes = []
    for h in hojas:
        txt = open(os.path.join(D, "css-fuentes", h + ".css"), encoding="utf-8").read().rstrip()
        partes.append("/* ===== " + h + ".css ===== */\n" + txt + "\n")
    open(os.path.join(D, salida), "w", encoding="utf-8").write("\n".join(partes))
    print(salida, "<-", ", ".join(hojas))
