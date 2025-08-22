"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the server and sets up the main application.
"""
from database.Client import DatabaseClient

"""
:fn: server_main:
:date: 22/08/2025
:author: Cameron Sims
:brief: This function is the main entry point for the server side.
"""
def server_main():
    dbclient = DatabaseClient("./data/dbLogin.json")
    


# This is the main entry point for the server side.
if __name__ == "__main__":
    # Run the main server loop
    server_main()