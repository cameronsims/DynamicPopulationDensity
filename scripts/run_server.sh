# Run the python script to run in the background
setsid run_server_squash_helper.sh > /dev/null 2>&1 < /dev/null &

# To kill the above line, please put the command...
# kill $(ps -fade | grep run_server_squash_helper.sh | grep -v grep | awk '{print $2}')

# We also want to run the webserver, this python script is how it is started.
./run_server_django.sh