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

echo "Setup has been completed, the program will be able to be run now."