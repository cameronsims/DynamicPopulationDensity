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
- pyshark

### Virtual Environments and Setup

```bash
# Please ensure we are in the "DynamicPopulationDensity" folder.
# The path should look like the simple diagram below.
#
# - DynamicPopulationDensity
# | - data
# | - scripts
# | - src
# | - .gitignore
# | - readme.md
# | - requirements.txt

# Create a python virtual environment (venv)
python3 -m venv venv
source venv/bin/activate

# This method is for Debian based Linux Systems only (this includes RaspberryPI OS).
# Note: Please allow non-superusers to capture packets!
sudo apt install wireshark

# To simply install all the packages for the project.
pip install -r requirements.txt

# IF the above does not work, please install manually.
pip install pymongo
pip install pyshark

# Deactivate virtual environment if required
deactivate
```

### Running Shell Script

```bash
# Before executing a script, ensure it has executable permissions:
chmod +x examplescript.sh
```

### Connecting to Murdoch's Ubuntu Virtual Machine

To access Murdoch's Virtual Machine, each device must first connect to Murdoch's VPN.
Currently, only one device can be connected to the VPN at a time.

### How To Connect to Murdoch's VPN

```bash
# Install OpenConnect on a Linux device
./scripts/install_vpn.sh

# Start the VPN connection on a Linux or macOS device if using OpenConnect
./scripts/connect_murdoch_vpn.sh
```

### How To Log In to Murdoch's Virtual Machine

From a terminal, run the following command and enter the password provided by Dan Wu:

```bash
ssh it08@10.51.33.30
```

### How To Log Out from Murdoch's Virtual Machine

In the same terminal session used for SSH, run:

```bash
logout
```

### How To Disconnect from Murdoch's VPN

```bash
# Stop the VPN connection if used OpenConnect
./scripts/disconnect_murdoch_vpn.sh
```

### How To Run

#### Node

```bash
# python -m src.node.index (Loop Amount, negative for infinite) (Push to Database? True for yes)
python -m src.node.index -1 true

# Alternatively, run
./scripts/run_node.sh
```

#### Server

```bash
python -m src.server.index

# Alternatively, run
./scripts/run_server.sh
```

### Config Files

This file has a few config files required, most of the config files are self explianatory, but the most important two are "data/server/suspicionFactors.json" and "data/node/sniffingConfig.json".

#### Windows

**./data/node/sniffingConfig.json**

```json title="./data/node/sniffingConfig.json"
{
    "node_id": <node id as it appears in the db. should look like "68a9420948417c1831739d6a">,
    "tshark_path": "C:\\Program Files\\Wireshark\\tshark.exe",

    "use_timeout": true,
    "timeout": 30,
    "max_packets": 5000,
    "interface": "Wi-Fi",
    "output_file": "./data/captures/capture.pcapng"
}
```

#### Linux

**./data/node/sniffingConfig.json**

```json title="./data/node/sniffingConfig.json"
{
    "node_id": <node id as it appears in the db. should look like "68a9420948417c1831739d6a">,
    "tshark_path": "/bin/dumpcap",

    "use_timeout": true,
    "timeout": 30,
    "max_packets": 5000,
    "interface": "wlan0",
    "output_file": "./data/captures/capture.pcapng"
}
```

#### MacOS

**./data/node/sniffingConfig.json**

```json title="./data/node/sniffingConfig.json"
{
  "node_id": <node id as it appears in the db. should look like "68a9420948417c1831739d6a">,
  "tshark_path": "/opt/homebrew/bin/tshark",

  "use_timeout": true,
  "timeout": 30,
  "max_packets": 5000,
  "interface": "Wi-Fi",
  "output_file": "./data/captures/capture.pcapng"
}
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

# Alternatively, run
./scripts/create_documentation.sh
```

| Type      | What Is Expected                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files     | Files should contain all of the following information: :file::, :date::, :author::, :brief::                                                                    |
| Functions | Functions should contain: :fn::, :date::, :author::, :brief::, :return::. As well as all parameters using the :param:: tag.                                     |
| Classes   | Classes should contain all of the following: :class::/:struct::, :date::, :author::, :brief::                                                                   |
| Variables | Variables should only require documentation if they are existing in a class or global. For this, only describing the variable in one line should be nessessary. |

## Writing Style

### Coupling / Cohesion

All modules for the code should be contained within their own folders and should keep interaction between modules to an absolute minimum.

### Testing

All modules should have tests which test expected cases, unexpected cases and edge cases. <br/>These tests should be written in their own executables. Documentation is not required for the testing files. However, try keep it clean so it is still understnadable.
