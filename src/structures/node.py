"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module is used when we need to read from a node.
"""


class Node:
    """
    :class: Node
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class is used to refer to a node that exists 
    """
    def __init__(self, node_id: str = None, location_id: str = None, node_description: str = None):
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates a node object.
        :param node_id: The ID of the node.
        :param location_id: The location of the node.
        :param node_description: The description of the node, i.e.: the room name or location.
        """
        
        self.id = node_id # This refers to the ID of one specific node.
        
        # TODO: Add IP/MAC address of the node.
        self.ip = 1 # The last accessed IP address of the node.
        self.mac = 1 # The last accessed MAC address of the node.
        
        self.location_id = location_id
        self.description = node_description # This is the description of the node, this is used to describe the node.

    def __hash__(self):
        """
        :fn: __hash__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates a hash of the node, this is used to identify if this node is unique. Internally just the ID
        :return: The hash (id) of the node.
        """
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.id)
    
    def deserialise(self, data:dict):
        """
        :fn: deserialise
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Converts dict/JSON format to this object
        :param data: The data that we are reading through
        """
        # This is used to serialise the node, this is used to insert the node into the database.
        self.id = str(data["_id"])
        self.location_id = data["location_id"]
        self.description = data["description"]
    
    def serialise(self):
        """
        :fn: serialise
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Serialises the node into a dictionary format for database insertion.
        :return: A dictionary representation of the node.
        """
        # This is used to serialise the node, this is used to insert the node into the database.
        return {
            "location_id": self.id,
            "description": self.description
        }