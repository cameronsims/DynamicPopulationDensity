
sphinx-apidoc -o docs src/
mkdir docs
cd docs
sphinx-build -b html ../src _build