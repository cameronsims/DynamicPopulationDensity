"""
:author: Cameron Sims
:date: 23/09/2025
:brief: This module defines all important functions for interacting with the external database, specifically the "locations".
"""
from src.structures.location import Location
from src.database.ProtoClient import ClientDB as ProtoClient
from pymongo import MongoClient

class LocationDB(ProtoClient):
    """
    :class: LocationDB
    :date: 23/09/2025
    :author: Cameron Sims
    :brief: This class handles interactions with the database for locations.
    """
    def __init__(self, db_client: MongoClient, collection: str):
        """
        :fn: __init__
        :date: 23/09/2025
        :author: Cameron Sims
        :brief: Initializes the NodeDB with a database client
        :param db_client: The database client to use for operations.
        :param collection: The name of the collection to use for nodes.
        """
        # We will store a copy of the client information, for use when we need access to information
        self.db_client = db_client

        # This is the list of nodes, and their metadata.
        self.collection = self.db_client[collection]


    def insert(self, location: Location):
        """ 
        :fn: insert
        :date: 23/09/2025
        :author: Cameron Sims
        :brief: Inserts a new node into the database.
        :param location: The structure of the location we're inserting.
        """
        # This is the query that we are going to use to find.
        primary_key_query = { "id": location.id }

        # This is the object that we are calling through
        local_data = location.serialise()
        
        # Create a new node document, this will be inserted into the database.
        self.insert_data(primary_key_query, local_data)