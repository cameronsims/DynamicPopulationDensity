SHELL = /bin/sh

SPHINXBUILD = sphinx-build
SPHINXOPTS =
SPHINXPROJ = YourProjectName
SOURCEDIR = .
BUILDDIR = _build

.PHONY: help clean html

help:
	@echo "Please use 'make <target>' where <target> is one of"
	@echo "  html     to build HTML files"
	@echo "  clean    to remove all build files"

clean:
	rm -rf $(BUILDDIR)/*

html:
	$(SPHINXBUILD) -b html $(SPHINXOPTS) $(SOURCEDIR) $(BUILDDIR)/html