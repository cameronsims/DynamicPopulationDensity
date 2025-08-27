"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the client and sets up the main application.
"""

from src.database.Client import DatabaseClient
from src.node.Sniffer import Sniffer
from datetime import datetime

# This is the main entry point for the server side.
if __name__ == "__main__":
    node_id = 0
    sniffer = Sniffer(node_id, "Wi-Fi", "./data/captures/capture.pcapng")

    dbclient = DatabaseClient("./data/dbLogin.json")

    print("Start Sniffing...")
    sniffer.start_sniffing(500)

    print("Reading Packets from File...")
    packets = sniffer.get_packets_from_file()

    print("Inserting Packets into Database...")
    for packet in packets:
        dbclient.attendance_client.collection.insert_one(packet.serialise())

