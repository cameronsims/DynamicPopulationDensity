"""
:author: Cameron Sims
:date: 22/08/2025  
:brief: This module creates our clients
"""
from database.NodeClient import NodeDB as NodeClient
from database.AttendanceClient import AttendanceDB as AttendanceClient
from database.HistoricAttendanceClient import HistoricAttendanceDB as HistoricAttendanceClient

""" 
:fn: create_clients
:date: 22/08/2025
:author: Cameron Sims
:brief: Creates instances of our clients.
:param db_login: The database login information, this is used to connect to the database.
:return: A tuple of the node client, attendance client, and historic attendance client.
"""
def create_clients(db_login):
    # Get the MongoDB client
    from pymongo import MongoClient

    # Create the MongoClient
    db_client = MongoClient(db_login['ip'])
    db_database = db_client[db_login['name']]

    # Create the node client 
    node_client = NodeClient(db_login)

    # Create the attendance client 
    attendance_client = AttendanceClient(db_login)
    # Create the historic attendance client
    historic_client = AttendanceClient.HistoricAttendanceClient(db_login)

    return (node_client, attendance_client, historic_client)
    
"""
@class DatabaseClient
:date: 22/08/2025
:author: Cameron Sims
:brief: This class holds our database clients.
"""
class DatabaseClient:
    """
    :fn: __init__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Initializes the DatabaseClient with the database clients.
    """
    def __init__(self, login_file: str):
        # Import the JSON module, used for reading the database login file
        from json import load as json_load

        # Open the database login file 
        with open(login_file, "r") as db_loginFile:
            # Read the JSON file, 
            db_login = json_load(db_loginFile)
            
            # Create the database clients
            self.node_client, self.attendance_client, self.historic_client = create_clients(db_login)