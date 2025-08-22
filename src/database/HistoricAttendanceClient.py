"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines all important functions for interacting with the external database.
"""
from structures.node import Node
from structures.attendance import Attendance, HistoricAttendance 
import database.protoclient as ProtoClient
from pymongo import MongoClient

"""
@class NodeDB
:date: 22/08/2025
:author: Cameron Sims
:brief: This class handles interactions with the database for attendance, and relevent information. This information should be purged when formed into HistoricAttendance.
"""
class HistoricAttendanceDB(ProtoClient):
    """
    :fn: __init__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Initializes the NodeDB with a database client
    :param db_client: The database client to use for operations.
    """
    def __init__(self, db_client: MongoClient):
        # We will store a copy of the client information, for use when we need access to information
        self.db_client = db_client

        # This is the list of nodes, and their metadata.
        self.collection = self.db_client['historic_attendance']


    """ 
    :fn: insert
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Inserts a attendance record into the database.
    :param attendance: The structure of the attendance we are inserting
    """
    def insert(self, attendance: HistoricAttendance):
        # This is the query that we are going to use to find.
        primary_key_query = { "node_id": attendance.node_id, "timestamp": attendance.timestamp }

        # This is the object that we are calling through
        attendance_data = attendance.serialise()
        
        # Create a new node document, this will be inserted into the database.
        self.insert_data(primary_key_query, attendance_data)