"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the client and sets up the main application.
"""

from src.database.Client import DatabaseClient
from src.node.Sniffer import Sniffer

def node_loop(sniffer: Sniffer, dbclient: DatabaseClient, max_loops: int, insert_into_db: bool):
    """
    :fn: node_loop:
    :date: 05/09/2025
    :author: Cameron Sims
    :brief: This function is the loop for the node, this can be exited by CTRL+C
    :param sniffer: The sniffer instance we're using
    :param dbclient: The database client to read to.
    :param max_loops: The maximum amount of loops to run, -1 for infinite.
    :param insert_into_db: Boolean, should we add the packets we read into the database? (Should be True in production!)
    """
    i = 0
    while max_loops < 0 or i < max_loops:
        # Start the sniffer, save to file.
        print("Start Sniffing...")
        sniffer.start_sniffing()

        # Read the packets from what the sniffer inserted.
        print("Reading Packets from File...")
        packets = sniffer.get_packets_from_file()

        # Read into the packet
        if insert_into_db: 
            # Insert all packets into the database.
            print("Inserting Packets into Database...")
            dbclient.attendance_client.insert_many(packets)

        # Increment the loop amount
        i += 1


def node_main(max_loops: int, insert_into_db: bool):
    """
    :fn: node_main:
    :date: 05/09/2025
    :author: Cameron Sims
    :brief: This function is the main entry point for the node side.
    :param max_loops: The maximum amount of loops to run, -1 for infinite.
    :param insert_into_db: Boolean, should we add the packets we read into the database? (Should be True in production!)
    """
    # Sniffer that we are using.
    sniffer = Sniffer("./data/node/sniffingConfig.json")

    # Clear the attendance client, we don't want any data from previous hours to intersect.
    dbclient = DatabaseClient("./data/database/dbLogin.json")
    dbclient.attendance_client.clear()

    # Enter the loop
    try:
        node_loop(sniffer, dbclient, max_loops)
    except KeyboardInterrupt:
        print('Loop exiting due to Keyboard Interrupt...')

    print("Node has finished execution!")

    

# This is the main entry point for the server side.
if __name__ == "__main__":
    from sys import argv as sys_argv

    # These are all values that mean yes in terminal speak.
    truthy_answers = ['true', '1', 't', 'y', 'yes']

    # If we have a max loop argument, use it.
    len_sys_argv = len(sys_argv)
    max_loops = -1 if (len_sys_argv < 2) else int(sys_argv[1])
    insert_into_db = True if (len_sys_argv < 3) else (sys_argv[2].lower() in truthy_answers)

    # Run the main function
    node_main(max_loops, insert_into_db)