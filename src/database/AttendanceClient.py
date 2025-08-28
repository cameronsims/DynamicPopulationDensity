"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines all important functions for interacting with the external database.
"""
from src.structures.node import Node
from src.structures.attendance import Attendance   
from src.database.ProtoClient import ClientDB as ProtoClient

# MongoDB client
from pymongo import MongoClient

class AttendanceDB(ProtoClient):
    """
    :class: NodeDB
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class handles interactions with the database for attendance, and relevent information. This information should be purged when formed into HistoricAttendance.
    """
    def __init__(self, db_client: MongoClient, collection:str):
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Initializes the NodeDB with a database client
        :param db_client: The database client to use for operations.
        :param collection: The name of the collection to use for recent attendance.
        """
        # We will store a copy of the client information, for use when we need access to information
        self.db_client = db_client

        # This is the list of nodes, and their metadata.
        self.collection = self.db_client[collection]


    def insert(self, attendance: Attendance):
        """ 
        :fn: insert
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Inserts a attendance record into the database.
        :param attendance: The structure of the attendance we are inserting
        """
        # This is the query that we are going to use to find.
        primary_key_query = { "hash": attendance.hash }

        # This is the object that we are calling through
        attendance_data = attendance.serialise()
        
        # Create a new node document, this will be inserted into the database.
        self.insert_data(primary_key_query, attendance_data)