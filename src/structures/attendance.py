"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module is used to read one "ping" / person within a classroom.
"""
from src.structures.node import Node
from src.structures.PacketType import PacketType
from datetime import datetime

class Attendance:
    """
    :class: Attendance
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class is used to refer to an attendance record.
    """
    def __init__(self, timestamp: datetime = datetime.now(), node: Node | str = None, device_id: str = None, strength: int = None, packet_type: PacketType = PacketType.NONE): 
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates an attendance object.
        :param timestamp: The timestamp of the attendance record, when it was observed.
        :param node: The Node that is associated with this attendance record.
        :param device_id: The hash of the person that was observed, this is used to identify if this person is unique.
        :param strength: The signal strength of the device that was observed.
        """
        # This refers to the timestamp of the attendance record.
        self.timestamp = timestamp

        # This is the type of packet.
        self.packet_type = packet_type

        #  If the node_id is a node object...
        if type(node) == Node:
            self.node_id = -1 if node is None else node.id
        # If we only have a node id...
        else: 
            self.node_id = node

        # This refers to a hash, this is used to identify if this person is unique.
        self.device_id = device_id
        self.strength = strength

    def __hash__(self) -> str:
        """
        :fn: __hash__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Gives the hash to the attendance record, this is used to identify if this record is unique.
        :return: The hash of the attendance.
        """
        # This is used to create a hash of the node, this is used to identify if this node is unique.
        return hash(self.timestamp)
    
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
        self.node_id   = data["node_id"]
        self.device_id = data["device_id"]
        self.strength  = None if ("signal_strength"  not in data) else data["signal_strength"]
        self.packet_type = PacketType.NONE if ("packet_type" not in data) else PacketType(data["packet_type"])

    def serialise(self) -> dict:
        """
        :fn: serialise
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Serialises the attendance into a dictionary format for database insertion.
        :return: A dictionary representation of the attendace.
        """
        # This is used to serialise the record, this is used to insert the node into the database.
        return {
            "date_time": self.timestamp,
            "node_id": self.node_id,
            "device_id": self.device_id,
            "signal_trength": self.strength,
            "packet_type": self.packet_type.value
        }