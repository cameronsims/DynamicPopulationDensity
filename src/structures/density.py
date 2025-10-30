"""
:author: Cameron Sims
:date: 23/09/2025
:brief: This module is used to hold data from numerous points of history.
"""
from src.structures.node import Node
from datetime import datetime
from bson.objectid import ObjectId as ObjectID

class Density:
    """
    :class: Density
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class is used to refer to an attendance record that has been compiled.
    """
    def __init__(self, timestamp: datetime = datetime.now(), node: Node | str = None, total_entries: int = -1, estimation_factors: int = 1): 
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates an attendance object.
        :param timestamp: The timestamp of the attendance record, when it was observed.
        :param node: The Node that is associated with this attendance record.
        :param hash: The hash of the person that was observed, this is used to identify if this person is unique.
        """
        # Round the minutes down to last 30. 
        # This refers to the timestamp of the attendance record.
        self.timestamp = Density.roundToLast30Minutes(timestamp)

        # This refers to the ID of the node that observed this attendance record.
        self.node_id = -1 if node is None else node.id
        self.location_id = -1 if node is None else node.location_id

        # This refers to the total number of entries that were observed at this time.
        self.total_entries = total_entries
    
        # Estimations of people.
        self.estimation_factors = estimation_factors
        self.total_estimated_humans = int(self.total_entries / self.estimation_factors)

    def __hash__(self):
        """
        :fn: __hash__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Gives the timestamp to the historic record, this is used to identify if this record is unique.
        :return: The time accessed
        """
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.timestamp) + hash(self.node_id)
    
    def deserialise(self, data: dict):
        """
        :fn: deserialise
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Converts dict/JSON format to this object
        :param data: The data that we are reading through
        """
        # This is used to serialise the node, this is used to insert the node into the database.
        self.timestamp = data["date_time"]
        self.location_id = data["location_id"]
        self.node_id = data["node_id"]
        self.total_entries = data["total_estimated_devices"]
        self.total_estimated_humans = data["total_estimated_humans"]
        self.estimation_factors = data["estimation_factors"]
    
    def serialise(self) -> dict:
        """
        :fn: serialise
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Serialises the historic attendance into a dictionary format for database insertion.
        :return: A dictionary representation of the attendace.
        """
        print('location_id:', self.location_id, type(self.location_id))
        print('node_id:', self.node_id, type(self.node_id))

        # This is used to serialise the record, this is used to insert the node into the database.
        return {
            "date_time": self.timestamp,
            "location_id": self.location_id if (type(self.location_id) is type(ObjectID)) else ObjectID(self.location_id),
            "node_id": self.node_id if (type(self.node_id) is type(ObjectID)) else ObjectID(self.node_id),
            "total_estimated_devices": self.total_entries,
            "total_estimated_humans": self.total_estimated_humans,
            "estimation_factors": self.estimation_factors
        }
    
    def roundToLast30Minutes(timestamp: datetime) -> datetime:
        """
        :fn: roundToLast30Minutes
        :date: 03/09/2025
        :author: Cameron Sims
        :brief: Rounds a datetime down to 0 minutes or 30 minutes.
        :return: A datetime rounded down.
        """
        minutes =  0 if timestamp.minute < 30 else 30
        new_ts = datetime(timestamp.year, timestamp.month, timestamp.day, timestamp.hour, minutes)
        return new_ts
