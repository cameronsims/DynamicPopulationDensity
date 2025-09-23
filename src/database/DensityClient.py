"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines all important functions for interacting with the external database.
"""
from src.structures.density import Density
from src.database.ProtoClient import ClientDB as ProtoClient
from pymongo import MongoClient

class DensityDB(ProtoClient):
    """
    :class: NodeDB
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class handles interactions with the database for attendance, and relevent information. This information should be purged when formed into Density.
    """
    def __init__(self, db_client: MongoClient, collection:str):
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Initializes the NodeDB with a database client
        :param db_client: The database client to use for operations.
        :param collection: The name of the collection to use for historical data.
        """
        # We will store a copy of the client information, for use when we need access to information
        self.db_client = db_client

        # This is the list of nodes, and their metadata.
        self.collection = self.db_client[collection]


    def insert(self, attendance: Density):
        """ 
        :fn: insert
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Inserts a attendance record into the database.
        :param attendance: The structure of the attendance we are inserting
        """
        # This is the query that we are going to use to find.
        primary_key_query = { "node_id": attendance.node_id, "timestamp": attendance.timestamp }

        # This is the object that we are calling through
        attendance_data = attendance.serialise()
        
        # Create a new node document, this will be inserted into the database.
        self.insert_data(primary_key_query, attendance_data)

    def insert_many(self, attendence_history: list[Density]):
        """ 
        :fn: insert_many
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Inserts a list of attendance record into the database.
        :param attendence_history: The list of attendance we're inserting 
        """
        # This is the query that we are going to use to find.
        primary_key_query = None # { "node_id": attendence_history.node_id, "timestamp": attendence_history.timestamp }

        # The list of values 
        history_len = len(attendence_history)
        history = [ 0 ] * history_len
        
        # For each record
        i = 0
        while i < history_len:
            attendance = attendence_history[i]
            history[i] = attendance.serialise()
            i += 1
        
        # Insert all into the list 
        self.collection.insert_many(history)
