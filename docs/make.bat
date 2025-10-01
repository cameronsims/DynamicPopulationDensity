@echo off
rem Makefile for Sphinx documentation

if "%1"=="" (
    set TARGET=html
) else (
    set TARGET=%1
)

sphinx-build -b %TARGET% . _build/%TARGET%