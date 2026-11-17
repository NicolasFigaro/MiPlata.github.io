#!/usr/bin/env python3
"""Se mantiene por costumbre: ahora hace lo mismo que construir.py (CSS + versión automática del service worker)."""
import os, runpy
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "construir.py"), run_name="__main__")
