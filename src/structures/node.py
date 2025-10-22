"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module is used when we need to read from a node.

:date: 22/10/2025
:author: Aidil Zamri
:brief: Updated the attributes/members of the node to match the database for more information about the node
"""


class Node:
    """
    :class: Node
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class is used to refer to a node that exists 
    """
    def __init__(self, node_id: str = None, name: str = None, ip_address: str = None, mac_address: str = None, model: str = None, brand: str = None, ram_size: int = 0, ram_unit: str = None, storage_size: int = 0, storage_unit: str = None, storage_type: str = None, is_poe_compatible: bool = None, is_wireless_connectivity: bool = None, location_id: str = None):
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Creates a node object.
        :param node_id: The ID of the node.
        :param name: The name given to the node
        :param ip_address: The IP Address assigned to the node
        :param mac_address: The MAC Address of the ethernet or wifi interface on the IoT device
        :param model: The model of the IoT device
        :param brand: The brand of the IoT device
        :param ram_size: The RAM size of the IoT device (e.g. 512Mb)
        :param ram_unit: The unit of the IoT device's RAM (e.g. Mb or GB)
        :param storage_size: The storage size of the IoT device (e.g. 16GB, 128GB, 256GB or 512GB)
        :param storage_unit: The unit of the IoT device's storage (e.g. GB or TB)
        :param storage_type: The type of storage that the IoT device has (e.g. MicroSD, HDD or SSD)
        :param is_poe_compatible: True or false if the IoT device supports Power over Ethernet
        :param is_wireless_connectivity: True or false if the Iot device has wifi/bluetooth interface
        :param location_id: The location of the node.
        """
        
        self.id = node_id # This refers to the ID of one specific node.
        
        self.name = name
        self.ip_address = ip_address
        self.mac_address = mac_address
        self.model = model
        self.brand = brand
        self.ram_size = ram_size
        self.ram_unit = ram_unit
        self.storage_size = storage_size
        self.storage_unit = storage_unit
        self.storage_type = storage_type
        self.is_poe_compatible = is_poe_compatible
        self.is_wireless_connectivity = is_wireless_connectivity
        self.location_id = location_id


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
        self.name = data["name"]
        self.ip_address = data["ip_address"]
        self.mac_address = data["mac_address"]
        self.model = data["model"]
        self.brand = data["brand"]
        self.ram_size = data["ram_size"]
        self.ram_unit = data["ram_unit"]
        self.storage_size = data["storage_size"]
        self.storage_unit = data["storage_unit"]
        self.storage_type = data["storage_type"]
        self.is_poe_compatible = data["is_poe_compatible"]
        self.is_wireless_connectivity = ["is_wireless_connectivity"]
        self.location_id = data["location_id"]
    
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
            "name": self.name,
            "ip_address": self.ip_address,
            "mac_address": self.mac_address,
            "model": self.model,
            "brand": self.brand ,
            "ram_size": self.ram_size,
            "ram_unit": self.ram_unit,
            "storage_size": self.storage_size ,
            "storage_unit": self.storage_unit ,
            "storage_type": self.storage_type ,
            "is_poe_compatible": self.is_poe_compatible ,
            "is_wireless_connectivity": self.is_wireless_connectivity ,
        }