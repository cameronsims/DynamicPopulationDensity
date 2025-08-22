"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines how a client should interact with the database
"""


"""
@class ClientDB 
:date: 22/08/2025
:author: Cameron Sims
:brief: This class handles interactions with the database.
"""
class ClientDB:
    # Used to refer to one specific collection in the database.
    collection = None

    """ 
    :fn: insert_data
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: Inserts a new node into the database.
    :param primary_key_query: The query to find if something with this primary key in the database exists.
    :param data: The data that we are inserting into the database.
    """
    def insert_data(self, primary_key_query, data):
        # Try check if the collection exists
        if self.collection.find(primary_key_query):
            # The node already exists. 
            print("Error: Node already exists in the database.")
            return 
        # Create a new node document, this will be inserted into the database.
        self.collection.insert_one(data)