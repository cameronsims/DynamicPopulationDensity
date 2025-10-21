# VERY DANGEROUS SCRIPT, PLEASE KNOW WHAT YOU'RE DOING.

echo "This script will delete all files relating to the server, THIS IS VERY DANGEROUS TO THE PROJECT."
echo "If you understand and wish to continue, please type y"
read -p "Continue? (y/n): " confirm
# If yes...
if [[ "$confirm" =~ ^[Yy]$ ]]; then
    echo "Continuing..."
    rm -rf ./data/server
    rm -rf ./docs
    rm -rf ./src/server
    rm -rf ./src/test
    rm -rf ./.devcontainer
    rm -rf ./.github
    rm -rf ./frontend
  
# If no...
else
    echo "Exiting."
    exit 1
fi