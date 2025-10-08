#!/bin/bash
# Script to connect to Murdoch University's VPN using OpenConnect on a linux device
# Usage: 
# chmod +x ./connect_murdoch_vpn.sh
# ./connect_murdoch_vpn.sh


echo "Enter your username to connect to Murdoch's VPN:"
read username

sudo openconnect -u $username --passwd-on-stdin --protocol=anyconnect --no-dtls -b anyconnect.murdoch.edu.au


# sudo killall openconnect