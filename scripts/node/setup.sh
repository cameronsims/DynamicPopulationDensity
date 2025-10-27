# Create a python virtual environment (venv)
python3 -m venv venv
source venv/bin/activate

# This method is for Debian based Linux Systems only (this includes RaspberryPI OS).
# Note: Please allow non-superusers to capture packets!
sudo apt install wireshark
# Install tshark properly, we needed the previous wireshark to install common dependencies.
sudo apt install -y tshark

# Install colorama
echo "Installing required python3-colorama"
sudo apt install python3-colorama

# Set perms
sudo chgrp wireshark /bin/dumpcap
sudo chmod 750 /bin/dumpcap
sudo setcap cap_net_raw,cap_net_admin+eip /bin/dumpcap

# Login.
sudo usermod -a -G wireshark $USER

# Used to install required xml libraries for c
sudo apt install -y libxslt1.1 libxml2

# To simply install all the packages for the project.
pip install -r requirements.txt

# IF the above does not work, please install manually.
pip install pymongo
pip install pyshark

echo "Setup has been completed, the program will be able to be run now."

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