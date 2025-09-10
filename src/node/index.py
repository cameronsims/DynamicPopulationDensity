"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the client and sets up the main application.
"""

from src.structures.attendance import Attendance, HistoricAttendance
from src.database.Client import DatabaseClient
from src.node.Sniffer import Sniffer

from datetime import datetime, timedelta

def node_loop(sniffer: Sniffer, dbclient: DatabaseClient):
    """
    :fn: node_loop:
    :date: 05/09/2025
    :author: Cameron Sims
    :brief: This function is the loop for the node, this can be exited by CTRL+C
    :param sniffer: The sniffer instance we're using
    :param dbclient: The database client to read to.
    """
    while True:
        print("Start Sniffing...")
        sniffer.start_sniffing()

        print("Reading Packets from File...")
        packets = sniffer.get_packets_from_file()

        # Read into the packet
        print("Inserting Packets into Database...")
        dbclient.attendance_client.insert_many(packets)


def node_main():
    """
    :fn: node_main:
    :date: 05/09/2025
    :author: Cameron Sims
    :brief: This function is the main entry point for the node side.
    """
    # Sniffer that we are using.
    sniffer = Sniffer("./data/sniffingConfig.json")

    # Clear the attendance client, we don't want any data from previous hours to intersect.
    dbclient = DatabaseClient("./data/dbLogin.json")
    #dbclient.attendance_client.clear()

    # Enter the loop
    try:
        node_loop(sniffer, dbclient)
    except KeyboardInterrupt:
        print('Loop exiting...')

    print("Node has finished execution!")

    

# This is the main entry point for the server side.
if __name__ == "__main__":
    node_main()