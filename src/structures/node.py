"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module is used when we need to read from a node.
"""


"""
@class Node
:date: 22/08/2025
:author: Cameron Sims
:brief: This class is used to refer to a node that exists 
"""
class Node:
    """
    :fn: __init__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Creates a node object.
    :param node_id: The ID of the node.
    :param node_latitude: The latitude of the node.
    :param node_longitude: The longitude of the node.
    :param node_description: The description of the node, i.e.: the room name or location.
    """
    def __init__(self, node_id, node_latitude, node_longitude, node_description):
        
        self.id = node_id # This refers to the ID of one specific node.
        
        # TODO: Add IP/MAC address of the node.
        self.ip = 1 # The last accessed IP address of the node.
        self.mac = 1 # The last accessed MAC address of the node.
        
        self.latitude = node_latitude # Refers to the latitude of one node.
        self.longitude = node_longitude # Refers to the longitude of the node.
        self.description = node_description # This is the description of the node, this is used to describe the node.


    """
    :fn: __hash__
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Creates a hash of the node, this is used to identify if this node is unique. Internally just the ID
    :return: The hash (id) of the node.
    """
    def __hash__(self):
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.id)
    
    """
    :fn: serialise
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Serialises the node into a dictionary format for database insertion.
    :return: A dictionary representation of the node.
    """
    def serialise(self):
        # This is used to serialise the node, this is used to insert the node into the database.
        return {
            "id": self.id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "description": self.description
        }