"""
:author: Cameron Sims
:date: 22/08/2025  
:brief: This module creates our clients
"""
from src.database.NodeClient import NodeDB as NodeClient
from src.database.AttendanceClient import AttendanceDB as AttendanceClient
from src.database.HistoricAttendanceClient import HistoricAttendanceDB as HistoricAttendanceClient
    
class DatabaseClient:
    """
    :class: DatabaseClient
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class holds our database clients.
    """
    def __init__(self, login_file: str):
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Initializes the DatabaseClient with the database clients.
        """
        # Import the JSON module, used for reading the database login file
        from json import load as json_load

        # Open the database login file 
        with open(login_file, "r") as db_loginFile:
            # Read the JSON file, 
            db_login = json_load(db_loginFile)

            # Login.
            self.create_mongo_client(db_login)
            self.collections = db_login['collections']
            
            # Create the database clients
            self.node_client, self.attendance_client, self.historic_client = self.create_clients(self.collections)

    def __del__(self):
        """
        :fn: __del__
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Called to delete the instance of the client
        """
        self.mongo_client.close()

    def create_mongo_client(self, db_login : dict):
        """
        :fn: create_clients
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates the instance of the MongoDB Client.
        """
        # Import the MongoClient from pymongo
        from pymongo import MongoClient

        # Create the MongoClient
        self.mongo_client = MongoClient(db_login['ip'])
        self.mongo_database = self.mongo_client[db_login['name']]
    
    def create_clients(self, collections: dict):
        """ 
        :fn: create_clients
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates instances of our clients.
        :param collections: The dictonary of collections from the database login file.
        :return: A tuple of the node client, attendance client, and historic attendance client.
        """
        # Create the node client 
        node_client = NodeClient(self.mongo_database, collections['nodes'])

        # Create the attendance client 
        attendance_client = AttendanceClient(self.mongo_database, collections['attendance'])
       
        # Create the historic attendance client
        historic_client = HistoricAttendanceClient(self.mongo_database, collections['historic_attendance'])

        return (node_client, attendance_client, historic_client)
    
    def clear_clients(self):
        """ 
        :fn: clear_clients
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Deletes all data within our clients
        """
        for collection_name in self.collections:
            collection = self.mongo_database[collection_name]
            collection.delete_many({})

    def convert_attendance_to_historic(self, options: dict):
        """ 
        :fn: convert_attendance_to_historic
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Converts all the attendance to historic data
        :param options: Factors for suspicion
        """
        # Get the squashed data.
        squashed = self.attendance_client.squash(options)

        # Convert the squashed data to Historic Data client
        self.historic_client.insert_many(squashed)