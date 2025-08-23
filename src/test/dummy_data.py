"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This is used to wipe the database and create test data.
"""
from src.database.Client import DatabaseClient as DBClient
from src.structures.node import Node
from src.structures.attendance import Attendance, HistoricAttendance
from src.graph.Graphing import Graphing

from random import randint as random_int
from random import uniform as random_float

"""
:fn: clear
:date: 22/08/2025
:author: Cameron Sims
:brief: Clears the entire database
:param db_client: The database client to use for operations.
"""
def clear(db_client: DBClient):
    # Clear the database completely.
    db_client.clear_clients()
    

"""
:fn: create_node 
:date: 22/08/2025
:author: Cameron Sims
:brief: Creates nodes
:return: Creates a list of nodes.
"""
def create_nodes(amount:int = 4) -> list[Node]:
    # We want a few nodes 
    nodes = [ 0 ] * amount

    # Iterate over the nodes
    i = 0
    while i < amount:
        nodes[i] = Node(i+1, random_float(-90.00, 90.00), random_float(-180.00, 180.00), "Node " + str(i+1))
        i += 1
    return nodes

"""
:fn: create_history 
:date: 22/08/2025
:author: Cameron Sims
:brief: Creates historic attendance data
:param nodes: The nodes to create history for.
:param amount: The number of historic attendance records to create.
:return: Creates a list of nodes.
"""
def create_history(nodes:list[Node], amount:int = 200) -> list[HistoricAttendance]:
    # Create records for amount of history
    history = [ 0 ] * amount
    # Iterate over the history
    i = 0
    while i < amount:
        history[i] = HistoricAttendance(
            f"2025-08-22T10:{i%60:02d}:00Z",
            nodes[random_int(0, len(nodes) - 1)], # Randomly select a node
            total_entries=random_int(1, 100) # Random number of entries
        )
        i += 1
    return history

"""
:fn: create
:date: 22/08/2025
:author: Cameron Sims
:brief: Inserts new data into the entire database
:param db_client: The database client to use for operations.
:param node_amount: The number of nodes to create.
:param history_amount: The number of historic attendance records to create.
"""
def create(db_client: DBClient, node_amount:int=4, history_amount:int=200):
    # We want a few nodes 
    nodes = create_nodes(node_amount)

    # Insert nodes into the database
    for node in nodes:
        db_client.node_client.insert(node)

    # Create some historic attendance data
    history = create_history(nodes, history_amount)
    for record in history:
        db_client.historic_client.insert(record)

"""
:fn: make
:date: 22/08/2025
:author: Cameron Sims
:brief: Clears a database, creates dummy data and inserts it
:return: Returns the new database client that is completely cleared.
"""
def make():
    # Create a database client
    db_client = DBClient("./data/dbLogin_test.json")

    clear (db_client) # Clear the database 
    create(db_client) # Create dummy data

    # Read  the data to the graph module
    graph = Graphing()
    graph.create_node_total_activity(
        list(db_client.mongo_database['nodes'].find({})),
        list(db_client.mongo_database['historic_attendance'].find({})),
    )
    
    return db_client

# Main function to run the script
if __name__ == "__main__":
    # If this is run as a script, we want to create the database
    make()

    