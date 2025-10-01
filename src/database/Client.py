"""
:author: Cameron Sims
:date: 22/08/2025  
:brief: This module creates our clients
"""
from src.structures.node import Node
from src.structures.density import Density
from src.database.NodeClient import NodeDB as NodeClient
from src.database.LocationClient import LocationDB as LocationClient
from src.database.AttendanceClient import AttendanceDB as AttendanceClient
from src.database.DensityClient import DensityDB as DensityClient
    
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
            self.node_client, self.location_client, self.attendance_client, self.historic_client = self.create_clients(self.collections)

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
        :return: A tuple of the node client, location client, attendance client, and historic attendance client.
        """
        # Create the node client 
        node_client = NodeClient(self.mongo_database, collections['nodes'])

        # Create a client that deals with location
        location_client = LocationClient(self.mongo_database, collections['locations'])

        # Create the attendance client 
        attendance_client = AttendanceClient(self.mongo_database, collections['attendance'])
       
        # Create the historic attendance client
        historic_client = DensityClient(self.mongo_database, collections['density'])

        return (node_client, location_client, attendance_client, historic_client)
    
    def clear_clients(self):
        """ 
        :fn: clear_clients
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Deletes all data within our clients, please only use this for testing. Should probably be removed in final product
        """
        for collection_name in self.collections:
            collection = self.mongo_database[collection_name]
            collection.delete_many({})

    def convert_attendance_to_historic(self, sus_options: dict, strength_options: dict, push_to_db: bool = False, clear_db: bool = False) -> list[Density]:
        """ 
        :fn: convert_attendance_to_historic
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Converts all the attendance to historic data
        :param sus_options: Factors for suspicion
        :param strength_options: Factor for strength
        :param push_to_db: Do we put the database elements into the database?
        :param clear_db: Do we clear the attendance database?
        :return: Returns the list of vaues gained from the function. 
        """
        # Get list of nodes
        full_nodes = self.node_client.get(Node)

        # Get the squashed data.
        squashed = self.attendance_client.squash(full_nodes, sus_options, strength_options)

        # Convert the squashed data to Historic Data client
        if push_to_db:
            self.historic_client.insert_many(squashed)

        if clear_db:
            self.attendance_client.clear()
        
        return squashed