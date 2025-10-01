@echo off

sphinx-apidoc -o docs src/
mkdir docs
cd docs
sphinx-build -b html . _build