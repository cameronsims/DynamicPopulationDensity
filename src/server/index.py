"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the server and sets up the main application.
"""
from src.database.Client import DatabaseClient

DBLOGIN_FNAME    = "./data/database/dbLogin.json"
SUSFACTORS_FNAME = "./data/server/suspicionFactors.json"
STRFACTORS_FNAME = "./data/server/strengthFactors.json"

def server_create_node_history(dbclient: DatabaseClient): 
    """
    :fn: server_create_node_history:
    :date: 09/09/2025
    :author: Cameron Sims
    :brief: This function creates a graph which can be used to show activity from the nodes.
    :param dbclient: The database client that we are reading from.
    """
    from src.structures.node import Node
    from src.graph.Graphing import Graphing
    from src.structures.density import Density
    
    # Get our nodes and our history 
    nodes = dbclient.node_client.get(Node)

    # Get history from the database.
    history = dbclient.historic_client.get(Density)
    
    graph_client = Graphing()
    graph_client.create_node_total_activity(nodes, history).show()
    
    for node in nodes:
        graph_client.create_node_timeline(node, history).show()

def server_squash(dbclient: DatabaseClient, suspicion_factors_fname: str, strength_factors_fname: str, push_to_db: bool, clear_db: bool):
    """
    :fn: server_squash:
    :date: 10/09/2025
    :author: Cameron Sims
    :brief: This function squashes the database nerds and converts the attendnace to historic data
    :param suspicion_factors_fname: The file name that we are reading from.
    :param strength_factors_fname: The file name that we are reading from.
    :param dbclient: The database client that we are reading from.
    :param push_to_db: Do we put the database elements into the database?
    :param clear_db: Do we clear the attendance database?
    """
    from json import load as json_load
    from time import sleep as time_sleep
    
    # Read the file
    suspicion_file = open(suspicion_factors_fname)
    suspicion_factors = json_load(suspicion_file)

    strength_file = open(strength_factors_fname)
    strength_factors = json_load(strength_file)

    # Read the json file, for frequency
    frequency_json = open('./data/server/frequency.json', 'r')
    frequency_data = json_load(frequency_json)
    frequency = int(frequency_data['seconds'])

    # Squash the database
    print("Squashing the Database Insertion.")
    while True:
        #dbclient.convert_attendance_to_historic(suspicion_factors, strength_factors, push_to_db, clear_db)
        print('huh')

        # Sleep for however long.
        time_sleep(frequency)

def server_main(push_to_db: bool, clear_db: bool):
    """
    :fn: server_main:
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This function is the main entry point for the server side.
    :param push_to_db: Do we put the database elements into the database?
    :param clear_db: Do we clear the attendance database?
    """

    dbclient = DatabaseClient(DBLOGIN_FNAME)

    # Flatten the database.
    server_squash(dbclient, SUSFACTORS_FNAME, STRFACTORS_FNAME, push_to_db, clear_db)
    
    # Create histories and graphs, move this somewhere else.
    if False:
        server_create_node_history(dbclient)
   


# This is the main entry point for the server side.
if __name__ == "__main__":

    # These are all values that mean yes in terminal speak.
    truthy_answers = ['true', '1', 't', 'y', 'yes']

    # If we have a max loop argument, use it.
    from sys import argv as sys_argv
    len_sys_argv = len(sys_argv)
    insert_db = True if (len_sys_argv < 2) else (sys_argv[1].lower() in truthy_answers)
    clear_db  = True if (len_sys_argv < 3) else (sys_argv[2].lower() in truthy_answers)

    # Run the main server loop
    server_main(insert_db, clear_db)