"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines how a client should interact with the database
"""


class ClientDB:
    """
    :class: ClientDB 
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class handles interactions with the database.
    """
    
    # Used to refer to one specific collection in the database.
    collection = None

    def insert_data(self, primary_key_query, data):
        """ 
        :fn: insert_data
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Inserts a new node into the database.
        :param primary_key_query: The query to find if something with this primary key in the database exists.
        :param data: The data that we are inserting into the database.
        """
        # Create a new node document, this will be inserted into the database.
        self.collection.insert_one(data)

    def get(self, database_class: type, query: dict = {}):
        """
        :fn: get
        :date: 15/09/2025
        :author: Cameron Sims
        :brief: Gets current data, returns in a array format to the user.
        :param database_class: The class that we convert the data into the real object.
        :param query: The query that we use to find items within the database
        """
        items = []
        for data in self.collection.find():
            item =  database_class()
            item.deserialise(data)
            items.append(item)
        return items

    def clear(self):
        """ 
        :fn: clear
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Clears the current collection of any data.
        """
        self.collection.delete_many({})