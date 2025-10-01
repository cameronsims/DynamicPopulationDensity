"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the server and sets up the main application.
"""
from src.database.Client import DatabaseClient

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

def server_squash(dbclient: DatabaseClient, suspicion_factors_fname: str, strength_factors_fname: str):
    """
    :fn: server_squash:
    :date: 10/09/2025
    :author: Cameron Sims
    :brief: This function squashes the database nerds and converts the attendnace to historic data
    :param suspicion_factors_fname: The file name that we are reading from.
    :param strength_factors_fname: The file name that we are reading from.
    :param dbclient: The database client that we are reading from.
    """
    from json import load as json_load
    
    # Read the file
    suspicion_file = open(suspicion_factors_fname)
    suspicion_factors = json_load(suspicion_file)

    strength_file = open(strength_factors_fname)
    strength_factors = json_load(strength_file)

    # Squash the database
    if True:
        dbclient.convert_attendance_to_historic(suspicion_factors, strength_factors, False, True)
    
def server_main():
    """
    :fn: server_main:
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This function is the main entry point for the server side.
    """
    dbclient = DatabaseClient("./data/database/dbLogin_test.json")

    # Flatten the database.
    print("Squashing the Database Insertion.")
    server_squash(dbclient, "./data/server/suspicionFactors.json", "./data/server/strengthFactors.json")

    # Create histories and graphs, move this somewhere else.
    server_create_node_history(dbclient)
   


# This is the main entry point for the server side.
if __name__ == "__main__":
    # Run the main server loop
    server_main()