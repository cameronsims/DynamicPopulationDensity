@echo off

sphinx-apidoc -o docs src/
cd docs
sphinx-build -b html . _build