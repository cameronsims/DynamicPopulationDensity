"""
:author: Aidil Zamri
:date: 22/10/2025
:brief: This module is used when we need to read from a node event.
"""

from src.structures.node import Node
from datetime import datetime

class NodeEvent:
    """
    :class: NodeEvent
    :date: 22/10/2025
    :author: Aidil Zamri
    :brief: This class is used to refer to a node event that was captured
    """
    def __init__(self, node: Node | str = None, is_powered: bool = None, is_receiving_data: bool = None, date_time: datetime = datetime.now):
        """
        :fn: __init__
        :date: 22/10/2025
        :author: Aidil Zamri
        :brief: Creates a node event object.
        :param node: The ID of the node.
        :param is_powered: The power status of the node
        :param is_receiving_data: The activity of the node (e.g. same area does not have any devices to detect through wireshark)
        :param date_time: The date and time the event(s) was captured
        """
                
        #  If the node_id is a node object...
        if type(node) == Node:
            self.node_id = -1 if node is None else node.id
        # If we only have a node id...
        else: 
            self.node_id = node

        self.is_powered = is_powered
        self.is_receiving_data = is_receiving_data
        self.date_time = date_time


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

        self.node_id = ["node_id"]
        self.is_powered = ["is_powered"]
        self.is_receiving_data = ["is_receiving_data"]
        self.date_time = ["date_time"]
    
    def serialise(self):
        """
        :fn: serialise
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Serialises the node event into a dictionary format for database insertion.
        :return: A dictionary representation of the node event.
        """
        # This is used to serialise the node event, this is used to insert the node into the database.
        return {

            "node_id": self.node_id,
            "is_powered": self.is_powered,
            "is_receivig_data": self.is_receiving_data,
            "date_time": self.date_time ,
        }