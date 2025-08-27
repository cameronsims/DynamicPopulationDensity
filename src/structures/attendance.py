"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module is used to read one "ping" / person within a classroom.
"""
from src.structures.node import Node
import datetime

"""
@class HistoricAttendance
:date: 22/08/2025
:author: Cameron Sims
:brief: This class is used to refer to an attendance record that has been compiled.
"""
class HistoricAttendance:
    """
    :fn: __init__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Creates an attendance object.
    :param timestamp: The timestamp of the attendance record, when it was observed.
    :param node: The Node that is associated with this attendance record.
    :param hash: The hash of the person that was observed, this is used to identify if this person is unique.
    """
    def __init__(self, timestamp: datetime.datetime = datetime.datetime.now(), node: Node = None, total_entries: int = -1): 
        # This refers to the timestamp of the attendance record.
        self.timestamp = timestamp

        # This refers to the ID of the node that observed this attendance record.
        self.node_id = -1 if node is None else node.id

        # This refers to the total number of entries that were observed at this time.
        self.total_entries = total_entries

    """
    :fn: __hash__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Gives the timestamp to the historic record, this is used to identify if this record is unique.
    :return: The time accessed
    """
    def __hash__(self):
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.timestamp)
    
    """
    :fn: deserialise
    :date: 23/08/2025
    :author: Cameron Sims
    :brief: Converts dict/JSON format to this object
    :param data: The data that we are reading through
    """
    def deserialise(self, data:dict):
        # This is used to serialise the node, this is used to insert the node into the database.
        self.timestamp = data["timestamp"]
        self.node_id = data["node_id"]
        self.total_entries = data["total_entries"]
    
    """
    :fn: serialise
    :date: 23/08/2025
    :author: Cameron Sims
    :brief: Serialises the historic attendance into a dictionary format for database insertion.
    :return: A dictionary representation of the attendace.
    """
    def serialise(self):
        # This is used to serialise the record, this is used to insert the node into the database.
        return {
            "timestamp": self.timestamp,
            "node_id": self.node_id,
            "total_entries": self.total_entries
        }

"""
@class Attendance
:date: 22/08/2025
:author: Cameron Sims
:brief: This class is used to refer to an attendance record.
"""
class Attendance:
    """
    :fn: __init__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Creates an attendance object.
    :param timestamp: The timestamp of the attendance record, when it was observed.
    :param node: The Node that is associated with this attendance record.
    :param hash: The hash of the person that was observed, this is used to identify if this person is unique.
    """
    def __init__(self, timestamp: datetime.datetime = datetime.datetime.now(), node: Node = None, hash=None): 
        # This refers to the timestamp of the attendance record.
        self.timestamp = timestamp

        # This refers to the ID of the node that observed this attendance record.

        # If we only have a node id...
        if type(node) == int:
            self.node_id = node
        # If the node_id is a node object...
        else: 
            self.node_id = -1 if node is None else node.id 

        # This refers to a hash, this is used to identify if this person is unique.
        self.hash = hash

    """
    :fn: __hash__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Gives the hash to the attendance record, this is used to identify if this record is unique.
    :return: The hash of the attendance.
    """
    def __hash__(self):
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.hash)
    
    """
    :fn: deserialise
    :date: 23/08/2025
    :author: Cameron Sims
    :brief: Converts dict/JSON format to this object
    :param data: The data that we are reading through
    """
    def deserialise(self, data:dict):
        # This is used to serialise the node, this is used to insert the node into the database.
        self.timestamp = data["timestamp"]
        self.node_id = data["node_id"]
        self.hash = data["hash"]

    """
    :fn: serialise
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Serialises the attendance into a dictionary format for database insertion.
    :return: A dictionary representation of the attendace.
    """
    def serialise(self):
        # This is used to serialise the record, this is used to insert the node into the database.
        return {
            "timestamp": self.timestamp,
            "node_id": self.node_id,
            "hash": self.hash
        }