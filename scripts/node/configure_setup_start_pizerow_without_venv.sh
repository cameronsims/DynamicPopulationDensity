#!/bin/bash
# This method is for Debian based Linux Systems only (this includes RaspberryPI OS).
# Note: Please allow non-superusers to capture packets!

# Update and upgrade the system
echo "Updating and upgrading the system..."
sudo apt update && sudo apt upgrade -y

# Install python3 and pip3
echo "Installing python3 and pip3..."
sudo apt install python3 python3-pip -y

# Check if pip3 is installed
if ! command -v pip3 &> /dev/null
then
    echo "pip3 could not be found, please install pip3 and rerun the script."
    exit 1
fi

# Install wireshark and tshark
echo "Installing wireshark and tshark..."
echo "Please select 'Yes' when prompted to allow non-superusers to capture packets."
read -p "Press Enter to continue..."
sudo apt install wireshark -y
sudo apt install tshark -y

# setup wireshark permissions
echo "Setting up wireshark permissions..."
sudo dpkg-reconfigure wireshark-common
sudo usermod -aG wireshark $USER

# Check if tshark is installed
if ! command -v tshark &> /dev/null
then
    echo "tshark could not be found, please install tshark and rerun the script."
    exit 1
fi 

# Install required xml libraries
echo "Installing required XML libraries..."
sudo apt install python3-lxml libxml2-dev libxslt-dev -y
sudo apt install build-essential -y

# Set permissions for dumpcap
echo "Setting permissions for dumpcap..."
sudo chgrp wireshark /bin/dumpcap
sudo chmod +x /bin/dumpcap
sudo setcap cap_net_raw,cap_net_admin+eip /bin/dumpcap

# Install colorama
echo "Installing required python3-colorama"
sudo apt install python3-colorama

# Install Bluetooth and it's required packages
echo "Installing Bluetooh and it's required packages..."
sudo apt install Bluetooth bluez libdbus-1-dev libglib2.0-dev python3-bleak

# Install required Python packages
echo "Installing required Python packages..."
pip3 install pymongo --break-system-packages --root-user-action

pip3 show pymongo &> /dev/null
if [ $? -ne 0 ]; then
    echo "pymongo installation failed, please install it and run the program using venv."
    exit 1
fi

pip3 install pyshark --break-system-packages --root-user-action

pip3 show pyshark &> /dev/null
if [ $? -ne 0 ]; then
    echo "pyshark installation failed, please install it and run the program using venv."
    exit 1
fi


# Check if required files exist before finishing
echo "Verifying required files..."

# Check for database folder and it's files existence
echo "Checking for ../DynamicPopulationDensity/src/database directory and its files..."
if [ ! -d "../DynamicPopulationDensity/src/database" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database directory not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/database/AttendanceClient.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database/AttendanceClient.py file not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/database/Client.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database/Client.py file not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/database/DensityClient.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database/DensityClient.py file not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/database/LocationClient.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database/LocationClient.py file not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/database/NodeClient.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database/NodeClient.py file not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/database/ProtoClient.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/database/ProtoClient.py file not found!"
    exit 1
fi

# Check for index.py and Sniffer.py
echo "Checking for ../DynamicPopulationDensity/src/node/index.py and Sniffer.py files..."
if [ ! -f "../DynamicPopulationDensity/src/node/index.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/node/index.py file not found!"
    exit 1
fi

if [ ! -f "../DynamicPopulationDensity/src/node/Sniffer.py" ]; then
    echo "Error: ../DynamicPopulationDensity/src/node/Sniffer.py file not found!"
    exit 1
fi

# Check database connection
echo "Checking database connection..."

# Check if user is developing/deploying from home or school network
read -p "Are you configuring the node on school or home network (school/home)? " network
echo "$network"

if [ "$network" == "home" ]; then
    echo "Installing openconnect and network-manager-openconnect-gnome..."
    sudo apt install openconnect -y
    sudo apt install network-manager-openconnect-gnome -y
    echo "openconnect and network-manager-openconnect-gnome installation completed."

    echo "Please connect to Murdoch's VPN..."
    chmod +x ../DynamicPopulationDensity/scripts/vpn/connect_murdoch_vpn.sh
    sudo ../DynamicPopulationDensity/scripts/vpn/connect_murdoch_vpn.sh
    echo "Connection to Murdoch's VPN successful."
fi

# Check if user have stored the mongo-secrets.env in the root directory
read -p "Have you stored the mongo-secrets.env in the root directory [e.g /root/mongo-secrets.env] (y/n)" isStored
echo "$isStored"

if [ "$isStored" == "y" ]; then
    # Check for .env file
    echo "Checking for /root/mongo-secrets.env file..."
    if [ ! -f "/root/mongo-secrets.env" ]; then
        echo "Error: /root/mongo-secrets.env file not found!"
        exit 1
    fi

    echo "Checking if /root/mongo-secrets.env file is readable..."
    if [ ! -r "/root/mongo-secrets.env" ]; then
        echo "Error: /root/mongo-secrets.env file is not readable!"
        exit 1
    fi
    # retrieve the MongoDB connection string from the environment variable or file
    SECRETS_FILE="/root/mongo-secrets.env"
    # shellcheck disable=SC1090
    source "$SECRETS_FILE"

    # Required env vars (using APP_* per your connection below)
    : "${APP_USER_2:?Missing APP_USER_2 in ${SECRETS_FILE}}"
    : "${APP_PASS_2:?Missing APP_PASS_2 in ${SECRETS_FILE}}"
    : "${APP_DB:?Missing APP_DB in ${SECRETS_FILE}}"
    : "${BIND_IP:?Missing BIND_IP in ${SECRETS_FILE}}"

    DB_URI="mongodb://${APP_USER_2}:${APP_PASS_2}@${BIND_IP}:27017/${APP_DB}?authSource=${APP_DB}"

    # Check MongoDB connection using pymongo
    echo "Verifying MongoDB connection..."
    if ! python3 -c "from pymongo import MongoClient; client = MongoClient('$DB_URI'); client.admin.command('ping')" &> /dev/null; then
        echo "Error: Unable to connect to MongoDB. Please ensure MongoDB is running and accessible."
        exit 1
    fi 
fi 

# Check if user would like to install raspberry pi connect lite
read -p "Would you like to install Raspberry Pi Connect Lite to remote into the node? (y/n) " install_rp_connect
if [ "$install_rp_connect" == "y" ]; then
    echo "Installing Raspberry Pi Connect Lite..."
    sudo apt install rpi-connect-lite
    echo "Raspberry Pi Connect Lite installation completed."
    echo "Sign in onto raspberry pi connect"
    rpi-connect on
    rpi-connect signin
    sudo systemctl enable user@$USER.service
    sudo systemctl start user@$USER.service
fi

echo "Setup node has been completed, the program will be able to be run now."

# Attempt to enable and start the systemd service file for the node
echo "Attempting to enable and start the systemd service file for the node..."
echo "The node will start sniffing for MAC Address if successully"
echo "Copying ict302-node.service file into systmd directory: /etc/systemd/system/..."
sudo cp ../DynamicPopulationDensity/scripts/node/ict302-node.service /etc/systemd/system/

echo "Reloading systemd to recognise ict302-node.service file..."
sudo systemctl daemon-reload

echo "Enabling ict302-node.service file to start automatically on boot..."
sudo systemctl enable ict302-node.service

echo "Starting ict302-node.service file..."
sudo systemctl start ict302-node.service

echo "Checking status of the ict302-node.service..."
sudo timeout 5 systemctl status ict302-node.service

echo "Checking journal of the ict302-node.service..."
sudo timeout 10 journalctl -u ict302-node.service -f
