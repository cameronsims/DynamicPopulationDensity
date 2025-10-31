#!/bin/bash
# /opt/ict302/start_all.sh

echo "Starting Main Sniffer..."
python3 /opt/DynamicPopulationDensity/src/node/index.py &

echo "Starting Bluetooth Sniffer..."
python3 /opt/DynamicPopulationDensity/src/node/BleSniffer.py 

wait  # keeps the script running until background jobs end
