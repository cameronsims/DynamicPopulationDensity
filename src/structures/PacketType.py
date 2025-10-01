"""
:author: Cameron Sims
:date: 01/10/2025
:brief: This module is used to represent a type of packet (bluetooth/wifi/ethernet)
"""

from enum import Enum

class PacketType(Enum):
    """
    :enum: PacketType
    :date: 01/10/2025
    :author: Cameron Sims
    :brief: This enum is used to represent a type of packet (bluetooth/wifi/ethernet)
    """
    NONE      = 0
    BLUETOOTH = 1
    WIFI      = 2
    ETHERNET  = 3
    OTHER     = 4