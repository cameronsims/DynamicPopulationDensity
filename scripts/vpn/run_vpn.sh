read username url < "./scripts/vpn/vpn_info.txt"

echo "Username: $username"
echo "URL: $url"

echo "Enter Password (this prompt is not hidden!):"
sudo openconnect -u "$username" --passwd-on-stdin --protocol=anyconnect --no-dtls -b "$url"

# sudo killall openconnect