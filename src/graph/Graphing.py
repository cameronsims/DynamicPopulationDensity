"""
:author: Cameron Sims
:date: 23/08/2025
:brief: This this is how we will interact with matplotlib
"""
from src.structures.node import Node
from src.structures.attendance import Attendance, HistoricAttendance

import matplotlib.pyplot as plt
import numpy as np

"""
@class Graphing 
:date: 23/08/2025
:author: Cameron Sims
:brief: This class graphs many types of array functions 
"""
class Graphing: 
    
    """
    :fn: __init__
    :date: 23/08/2025
    :author: Cameron Sims
    :brief: Creates the Graphing class for use with other parts of the program
    """
    def __init__(self):
        pass 

    """
    :fn: create_node_total_activity
    :date: 23/08/2025
    :author: Cameron Sims
    :brief: Creates a bar graph for each node, returning the plt.plot class
    :param nodes: The nodes that we are reading from
    :param history: The hisotrical activity we are plotting.
    """
    def create_node_total_activity(self, nodes: list[Node], history: list[HistoricAttendance]):
        # Create the bar categories and values 
        categories_len = len(nodes)
        categories = [ 0 ] * categories_len
        totals = [ 0 ] * categories_len

        node_id_to_index = dict()
        j = 0

        # Name the categories
        i = 0
        while i < categories_len:
            # Set the category 
            node = Node()
            node.deserialise(nodes[i])
            node_id_to_index[node.id] = i
            categories[i] = "Node ID#" + str(node.id)
            i += 1

        # For each record we have.
        for history_data in history:
            record = HistoricAttendance()
            record.deserialise(history_data)
            index = node_id_to_index[record.node_id]
            totals[index] += record.total_entries

        # Create the bar graph.
        plt.bar(categories, totals, color="blue")
        plt.title("Total Node Records")
        plt.xlabel("Nodes")
        plt.ylabel("Total Records")
        plt.show()