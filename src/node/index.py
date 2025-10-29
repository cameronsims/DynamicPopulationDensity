"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the client and sets up the main application.
"""
from colorama import Fore, Back, Style

from pyshark.capture.capture import TSharkCrashException
from src.database.Client import DatabaseClient
from src.node.Sniffer import Sniffer

NODE_INFO_FNAME = "./data/node/nodeInfo.json"
SNIFFING_FNAME  = "./data/node/sniffingConfig.json"
DBLOGIN_FNAME   = "./data/database/dbLogin_prod_node_lab_a.json"

def node_loop(sniffer: Sniffer, dbclient: DatabaseClient, max_loops: int, insert_into_db: bool, use_params: bool):
    """
    :fn: node_loop:
    :date: 05/09/2025
    :author: Cameron Sims
    :brief: This function is the loop for the node, this can be exited by CTRL+C
    :param sniffer: The sniffer instance we're using
    :param dbclient: The database client to read to.
    :param max_loops: The maximum amount of loops to run, -1 for infinite.
    :param insert_into_db: Boolean, should we add the packets we read into the database? (Should be True in production!)
    :param use_params: Used if we want to use tshark more directly, helps with some errors to do with capture files.
    """
    i = 0
    while max_loops < 0 or i < max_loops:
        try:
            # Start the sniffer, save to file.
            print("Start Sniffing...")
            sniffer.start_sniffing(use_params=use_params)

            # Read the packets from what the sniffer inserted.
            print("Reading Packets from File...")
            packets = sniffer.get_packets_from_file()
        except TSharkCrashException:
            print(f'{Back.YELLOW}Tshark crashed! Restarting...{Style.RESET_ALL}')
            sniffer = Sniffer(SNIFFING_FNAME, NODE_INFO_FNAME)

        # Read into the packet
        if insert_into_db: 
            # Insert all packets into the database.
            print("Inserting Packets into Database...")
            dbclient.attendance_client.insert_many(packets)

        # Increment the loop amount
        i += 1


def node_main(max_loops: int, insert_into_db: bool, use_params: bool):
    """
    :fn: node_main:
    :date: 05/09/2025
    :author: Cameron Sims
    :brief: This function is the main entry point for the node side.
    :param max_loops: The maximum amount of loops to run, -1 for infinite.
    :param insert_into_db: Boolean, should we add the packets we read into the database? (Should be True in production!)
    :param use_params: Used if we want to use tshark more directly, helps with some errors to do with capture files.
    """
    from pymongo.errors import ServerSelectionTimeoutError

    # Sniffer that we are using.
    sniffer = Sniffer(SNIFFING_FNAME, NODE_INFO_FNAME)

    successfully_exited = True

    # Clear the attendance client, we don't want any data from previous hours to intersect.
    try:
        dbclient = DatabaseClient(DBLOGIN_FNAME)

        # Enter the loop
        node_loop(sniffer, dbclient, max_loops, insert_into_db, use_params)
    except ServerSelectionTimeoutError as e:
        print(f"{Back.RED}Error: Cannot find the server, are you sure you're connected and the MongoDB is at \"{dbclient.ip_address}\"{Style.RESET_ALL}")
        successfully_exited = False
    except KeyboardInterrupt:
        print('Loop exiting due to Keyboard Interrupt...')

    colour_code = f"{Fore.GREEN}{Back.RESET}" if successfully_exited else f"{Fore.RED}{Back.RESET}"
    print(f"{colour_code}Node has finished execution!{Style.RESET_ALL}")

    

# This is the main entry point for the server side.
if __name__ == "__main__":
    from sys import argv as sys_argv

    # These are all values that mean yes in terminal speak.
    truthy_answers = ['true', '1', 't', 'y', 'yes']

    # If we have a max loop argument, use it.
    len_sys_argv = len(sys_argv)
    max_loops = -1 if (len_sys_argv < 2) else int(sys_argv[1])
    insert_into_db = True if (len_sys_argv < 3) else (sys_argv[2].lower() in truthy_answers)
    use_params = False if (len_sys_argv < 4) else (sys_argv[3].lower() in truthy_answers)

    # Run the main function
    node_main(max_loops, insert_into_db, use_params)