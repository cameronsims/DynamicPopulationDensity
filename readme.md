# Dynamic Population Density
## Description 
### What?
Dynamic Population Density is a project for the Murdoch University unit "ICT302 - Professional Practice Project."<br/>The project revolves around collecting geolocational data from an area, and then giving a numerical amount representing some sort of population (attendance). 
## Installation and Setup
### Docker / Virtual Machines
The project is assumed to be running off of a Raspberry PI, hence ensuring that you are running off of Raspberry Pi OS (Linux Debian) is essential.
### Programming Language
This project is in Python3, please try to use the version "Python 3.12.10".
### Modules / Libraries
To run the project the following external libraries and modules are required: 
- pymongo
### How To Run
## Required Packages
```bash 
# This method is for Bebian based Linux Systems only
# Note: Please allow non-superusers to capture packets!
sudo apt install wireshark

# Used for sniffing packet.s
pip install pyshark

# For documentation
pip install sphinx
pip install sphinx-rtd-theme
```
## GitHub Ettique 
Please create your own branches and commit to them slowly. Once a feature is completed, provide a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) to merge the main code with the [master branch](https://github.com/cameronsims/DynamicPopulationDensity).<br/>Once a pull request has been made and you want it merged please email "cameronissacsims@gmail.com" to get my attention.
## Programming Style Guide
### Code Assumptions
Below are a few assumptions for running this program. If one or more of these is not met, then there is no expectation that it should return valid expected values.
### How to write and document code 
When writing all code/documentation, please use Javadoc style commenting that can be parsed by Sphinx.
A style guide to writing these comments can be found on the [Sphinx Website](https://www.sphinx-doc.org/en/master/index.html#user-guide).
```bash
pip install sphinx
pip install sphinx-rtd-theme
```


| Type | What Is Expected |
| ---- | ---------------- |
| Files | Files should contain all of the following information: :file::, :date::, :author::, :brief:: |
| Functions | Functions should contain: :fn::, :date::, :author::, :brief::, :return::. As well as all parameters using the :param:: tag. |
| Classes | Classes should contain all of the following: :class::/:struct::, :date::, :author::, :brief:: |
| Variables | Variables should only require documentation if they are existing in a class or global. For this, only describing the variable above should be required. |
## Writing Style
### Coupling / Cohesion
All modules for the code should be contained within their own folders and should keep interaction between modules to an absolute minimum.
### Testing
All modules should have tests which test expected cases, unexpected cases and edge cases. <br/>These tests should be written in their own executables. Documentation is not required for the testing files. However, try keep it clean so it is still understnadable.