#!/bin/bash
# This method is for Debian based Linux Systems only (this includes RaspberryPI OS).
# Attempt to enable and start the systemd service file for the node
echo "Attempting to enable and start the systemd service file for the node..."

echo "Copying ict302-node.service file into systmd directory: /etc/systemd/system/..."
sudo cp ict302-node.service /etc/systemd/system/

echo "Reloading systemd to recognise ict302-node.service file..."
sudo systemctl daemon-reload

echo "Enabling ict302-node.service file to start automatically on boot..."
sudo systemctl enable ict302-node.service

echo "Starting ict302-node.service file..."
sudo systemctl start ict302-node.service

echo "Checking status of the ict302-node.service..."
sudo systemctl status ict302-node.service