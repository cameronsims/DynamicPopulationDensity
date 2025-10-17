# Create a python virtual environment (venv)
python3 -m venv venv
source venv/bin/activate

# This method is for Debian based Linux Systems only (this includes RaspberryPI OS).
# Note: Please allow non-superusers to capture packets!
sudo apt install wireshark
# Install tshark properly, we needed the previous wireshark to install common dependencies.
sudo apt install -y tshark

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