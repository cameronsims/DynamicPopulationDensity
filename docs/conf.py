project = 'DynamicPopulationDensity'
author = 'HiveMetrics'
release = '0.1'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx.ext.autosummary',

]

autosummary_generate = True

templates_path = ['_templates']
exclude_patterns = []

html_theme = 'haiku'
html_static_path = ['_static']

import os 
import sys

# Add the parent directory from this file
path = sys.path.insert(0, os.path.abspath('..'))
src  = sys.path.insert(0, os.path.abspath('../src'))

# Add these to the system path
sys.path.append(str(src))