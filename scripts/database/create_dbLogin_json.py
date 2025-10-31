# This script generates a dbLogin JSON file for every user. Currently, we only have four users [e.g., APP_USER_1 (backend_server), APP_USER_2 (node_lab_a), APP_USER_3 (node_lab_b), APP_USER_4 (node_lab_g)]. This script will be useful for larger deployment
import json
from dotenv import load_dotenv
import os
import stat

# Load .env file
print("Please provide the path file to the mongo-secrets.env to generate config file for node and server ")
load_dotenv(dotenv_path="../DynamicPopulationDensity/mongo-secrets.env")

print("This script generates a dbLogin JSON file for every user. Currently, we only have four users [e.g., APP_USER_1 (backend_server), APP_USER_2 (node_lab_a), APP_USER_3 (node_lab_b), APP_USER_4 (node_lab_g)]. This script will be useful for larger deployment.")

# Validate required environment variables
required_vars = ["APP_USER_1", "APP_PASS_1", "BIND_IP", "PORT", "APP_DB"]
missing = [v for v in required_vars if not os.getenv(v)]
if missing:
    raise EnvironmentError(f"Missing environment variables: {', '.join(missing)}")

# Build config dictionary
config = {
    "ip": f"mongodb://{os.getenv('APP_USER_1')}:{os.getenv('APP_PASS_1')}@{os.getenv('BIND_IP')}:{os.getenv('PORT')}/{os.getenv('APP_DB')}?authSource={os.getenv('APP_DB')}",
    "name": os.getenv("APP_DB"),
    "user": os.getenv("APP_USER_1"),
    "password": os.getenv("APP_PASS_1"),
    "bind_ip": os.getenv("BIND_IP"),
    "port": os.getenv("PORT"),
    "collections": {
        "nodes": "nodes",
        "nodeEvents": "nodeEvents",
        "locations": "locations",
        "density": "densityHistory",
        "attendance": "attendanceHistory"
    }
}

# Save JSON file securely
output_path = "../DynamicPopulationDensity/data/database/dbLogin_prod_server.json"
with open(output_path, "w") as f:
    json.dump(config, f, indent=4)

# Set secure file permissions (owner read/write only)
os.chmod(output_path, stat.S_IRUSR | stat.S_IWUSR)

print(f"JSON configuration saved to {output_path}")
print(f"File permissions set to 600 (read/write for owner only)")
print(f"Database: {config['name']}  |  Host: {config['bind_ip']}:{config['port']}")
