# TODO: ADD WEB SERVER COMMAND

sudo cp /opt/DynamicPopulationDensity/scripts/node/ict302-webserver.service /etc/systemd/system/
sudo cp /opt/DynamicPopulationDensity/scripts/node/ict302-bridgeserver.service /etc/systemd/system/

sudo systemctl daemon-reload

sudo chmod +x ./scripts/node/start_all_webserver.sh

cd src/server/frontend/hive-matrix/
sudo npm install

sudo systemctl enable ict302-webserver.service
sudo systemctl enable ict302-bridge.service
sudo systemctl start ict302-webserver.service
sudo systemctl start ict302-webserver.service

