"""
:author: Cameron Sims
:date: 23/08/2025
:brief: This this is how we will interact with matplotlib
"""
from src.structures.node import Node
from src.structures.density import Density

import matplotlib.pyplot as plt
import numpy as np

class Graphing: 
    """
    :class: Graphing 
    :date: 23/08/2025
    :author: Cameron Sims
    :brief: This class graphs many types of array functions 
    """
    
    def __init__(self):
        """
        :fn: __init__
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Creates the Graphing class for use with other parts of the program
        """
        pass 

    def create_node_timeline(self, node: Node, history: list[Density]):
        """
        :fn: create_node_timeline
        :date: 09/09/2025
        :author: Cameron Sims
        :brief: Creates a bar graph for one node, showing it's activity throughout time.
        :param node: The node that we are using
        :param history: The hisotrical activity we are plotting over one node.
        :return: Returns a plot class, please use .show() on the variable to show the graph.
        """
        import matplotlib.dates as mpltdates # Used to show dates on matplotlib

        # Add the history into these arrays, timestamp-amount
        quantities = [] # This is y, a simple list of integers.
        timestamps = [] # This is x, we will be using a bar graph. (Not a histogram as we might not have continiuous data)

        # We will look through the history, only adding if it is the same node id.
        for record in history:
            if record.node_id == node.id:
                quantities.append(record.total_entries)
                timestamps.append(record.timestamp)

        # Create a bar graph 
        dates = mpltdates.date2num(timestamps) # Format the dates in a nice format
        plt.bar(dates, quantities, width=0.05)
        plt.gca().xaxis.set_major_formatter(mpltdates.DateFormatter('%Y-%m-%d %H:%M'))
        plt.gcf().autofmt_xdate()

        plt.title("Activity for Node#" + str(node.id))
        plt.xlabel("Timestamp")
        plt.ylabel("Amount of Devices")
        return plt



    def create_node_total_activity(self, nodes: list[Node], history: list[Density]):
        """
        :fn: create_node_total_activity
        :date: 23/08/2025
        :author: Cameron Sims
        :brief: Creates a bar graph for each node, returning the plt.plot class
        :param nodes: The nodes that we are reading from
        :param history: The hisotrical activity we are plotting.
        :return: Returns a plot class, please use .show() on the variable to show the graph.
        """
        # Create the bar categories and values 
        categories_len = len(nodes)
        categories = [ 0 ] * categories_len
        totals = [ 0 ] * categories_len

        node_id_to_index = dict()
        j = 0

        # Name the categories
        i = 0
        for node in nodes:
            # Set the category 
            node_id_to_index[node.id] = i
            categories[i] = f"Node ID#{node.id}"
            i += 1

        # For each record we have.
        for record in history:
            #print(record.node_id, record.location_id)
            index = node_id_to_index[record.node_id]
            totals[index] += record.total_entries

        # Create the bar graph.
        plt.bar(categories, totals, color="blue")
        plt.title("Total Node Records")
        plt.xlabel("Nodes")
        plt.ylabel("Total Records")
        return plt