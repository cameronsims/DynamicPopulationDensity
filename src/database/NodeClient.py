"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines all important functions for interacting with the external database.
"""
from src.structures.node import Node
from src.database.ProtoClient import ClientDB as ProtoClient
from pymongo import MongoClient

"""
@class NodeDB
:date: 22/08/2025
:author: Cameron Sims
:brief: This class handles interactions with the database for nodes, and their geolocational data.
"""
class NodeDB(ProtoClient):
    """
    :fn: __init__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Initializes the NodeDB with a database client
    :param db_client: The database client to use for operations.
    :param collection: The name of the collection to use for nodes.
    """
    def __init__(self, db_client: MongoClient, collection: str):
        # We will store a copy of the client information, for use when we need access to information
        self.db_client = db_client

        # This is the list of nodes, and their metadata.
        self.collection = self.db_client['nodes']


    """ 
    :fn: insert
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Inserts a new node into the database.
    :param node: The structure of the node we are inserting
    """
    def insert(self, node: Node):
        # This is the query that we are going to use to find.
        primary_key_query = { "id": node.id }

        # This is the object that we are calling through
        node_data = node.serialise()
        
        # Create a new node document, this will be inserted into the database.
        self.insert_data(primary_key_query, node_data)