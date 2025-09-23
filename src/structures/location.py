"""
:author: Cameron Sims
:date: 23/09/2025
:brief: This module is used to represent a place.
"""

class Location:
    """
    :class: Attendance
    :date: 23/09/2025
    :author: Cameron Sims
    :brief: This class is used to refer to an attendance record.
    """
    def __init__(self, id: str = None, name: str = None, description: str = None): 
        """
        :fn: __init__
        :date: 23/09/2025
        :author: Cameron Sims
        :brief: Creates a location object.
        :param id: The ID given by MongoDB
        :param name: The name of the location
        :param description: A brief description of the location
        """
        self.id = id
        self.name = name 
        self.description = description

    def __hash__(self) -> str:
        """
        :fn: __hash__
        :date: 23/09/2025
        :author: Cameron Sims
        :brief: Gives the hash to the location record, this is used to identify if this record is unique.
        :return: The hash of the location.
        """
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.name)
    
    def deserialise(self, data: dict):
        """
        :fn: deserialise
        :date: 23/09/2025
        :author: Cameron Sims
        :brief: Converts dict/JSON format to this object
        :param data: The data that we are reading through
        """
        # This is used to serialise the node, this is used to insert the node into the database.
        self.id = data["_id"]
        self.name = data["name"]
        self.description = data["description"]

    def serialise(self) -> dict:
        """
        :fn: serialise
        :date: 23/09/2025
        :author: Cameron Sims
        :brief: Serialises the attendance into a dictionary format for database insertion.
        :return: A dictionary representation of the attendace.
        """
        # This is used to serialise the record, this is used to insert the node into the database.
        return {
            "name": self.name,
            "description": self.description
        }