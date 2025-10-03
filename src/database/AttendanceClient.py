"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module defines all important functions for interacting with the external database.
"""
from src.structures.node import Node
from src.structures.attendance import Attendance
from src.structures.density import Density
from src.database.protoclient import ClientDB as protoclient

# MongoDB client
from pymongo import MongoClient

class AttendanceDB(protoclient):
    """
    :class: NodeDB
    :date: 22/08/2025
    :author: Cameron Sims
    :brief: This class handles interactions with the database for attendance, and relevent information. This information should be purged when formed into Density.
    """
    def __init__(self, db_client: MongoClient, collection:str):
        """
        :fn: __init__
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Initializes the NodeDB with a database client
        :param db_client: The database client to use for operations.
        :param collection: The name of the collection to use for recent attendance.
        """
        # We will store a copy of the client information, for use when we need access to information
        self.db_client = db_client

        # This is the list of nodes, and their metadata.
        self.collection = self.db_client[collection]


    def insert(self, attendance: Attendance):
        """ 
        :fn: insert
        :date: 22/08/2025
        :author: Cameron Sims
        :brief: Inserts a attendance record into the database.
        :param attendance: The structure of the attendance we are inserting
        """
        # This is the query that we are going to use to find.
        primary_key_query = {
            "timestamp": attendance.timestamp,
            "node_id": attendance.node_id,
            "device_id": attendance.device_id 
        }

        # This is the object that we are calling through
        attendance_data = attendance.serialise()
        
        # Create a new node document, this will be inserted into the database.
        self.insert_data(primary_key_query, attendance_data)

    def insert_many(self, attendence_history: list[Attendance]):
        """ 
        :fn: insert_many
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Inserts a list of attendance record into the database.
        :param attendence_history: The list of attendance we're inserting 
        """
        # This is the query that we are going to use to find.
        primary_key_query = None # { "node_id": attendence_history.node_id, "timestamp": attendence_history.timestamp }

        # The list of values 
        history_len = len(attendence_history)

        # If there is no history...
        if history_len < 1:
            print('Warning: There are no attendnace records to insert.')
            return

        history = [ 0 ] * history_len
        
        # For each record
        i = 0
        while i < history_len:
            attendance = attendence_history[i]
            history[i] = attendance.serialise()
            i += 1
        
        # Insert all into the list 
        self.collection.insert_many(history)

    def should_ignore_attendance(self, strength_options: dict, attendance: Attendance) -> bool:
        """
        :fn: get_frequencies
        :date: 01/10/2025
        :author: Cameron Sims
        :brief: Should we add this attendance to the frequency list?
        :param strength_options: Options for including macs if they fit criteria
        :param attendance: The attendance record we are checking
        :return: Returns boolean to if this packet is worth including
        """
        from src.structures.PacketType import PacketType

        if attendance.strength is not None:
            # Find the bounds.
            key_type = 'wifi' if (attendance.packet_type is PacketType.WIFI) else 'bluetooth'
            maximum_strength = int(strength_options[key_type]['highest'])
            minimum_strength = int(strength_options[key_type]['lowest'])

             # Check if it is within bounds...
            return (attendance.strength < minimum_strength)
        
        return strength_options['include_null']

    def get_frequencies(self, entries: list[dict], strength_options: dict) -> dict:
        """
        :fn: get_frequencies
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Gets frequencies in the entries.
        :param entries: The entries of the database
        :param strength_options: Options for including macs if they fit criteria
        :return: Returns a dictionary of timestamps->hashes
        """
        # The mac address frequencies, the amount of times they appear.
        freq = dict()

        for entry in entries:
            # Create an attendance from this.
            attendance = Attendance()
            attendance.deserialise(entry)

            # If the attendance has any strength option...
            if self.should_ignore_attendance(strength_options, attendance):
                continue

            # We round the time to last 30 minutes because we want to track time like this.
            timestamp = Density.roundToLast30Minutes(attendance.timestamp)
            mac_addr = attendance.device_id

            # Check if the mac address exists. 
            if timestamp in freq:
                if mac_addr in freq[timestamp]:
                    # Get the minimum and max of time 
                    earliest = min(timestamp, freq[timestamp][mac_addr][0])
                    latest   = max(timestamp, freq[timestamp][mac_addr][1])
                    frequency = freq[timestamp][mac_addr][2] + 1
                    freq[timestamp][mac_addr] = (earliest, latest, frequency)
                else:
                    freq[timestamp][mac_addr] = (timestamp, timestamp, 1)
            else:
                freq[timestamp] = dict() 
                freq[timestamp][mac_addr] = (timestamp, timestamp, 1)

        return freq

    def get_total_mac_occurances(self, freq: dict) -> dict:
        """
        :fn: get_total_mac_occurances
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Gets the amount of times mac addresses occur over several time period
        :param freq: Frequency map, timestamp and the mac addresses packets that were captured
        :return: Returns a dictionary of hashes
        """
        # Count how many times each of the mac addresses go over 4 half an hours.
        macs_over_times = dict()
        for ts in freq: 
            # These are the mac addresses 
            macs = freq[ts]

            # Go through the mac address counted at this time
            for mac in macs:
                if mac in macs_over_times:
                    macs_over_times[mac] += 1
                else:
                    macs_over_times[mac] = 1

        return macs_over_times

    def get_suspicious_macs(self, options: dict, mac_dict: dict, macs_over_times: dict) -> set:
        """
        :fn: get_suspicious_macs
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Gets the amount of macs which violate our rules!
        :param options: The option for suspicious macs
        :param mac_dict: The mac addresses and how many packets they had 
        :param macs_over_times: The mac addresses total occurances over different timestamps.
        :return: Returns a dictionary of hashes
        """
        # The suspicious macs
        suspicious_macs = set()

        # If the packets are detected outside of good hours...
        time_early = int(options['time']['earliest'])
        time_late = int(options['time']['latest'])
        min_packet_amount = int(options['min_packets'])
        max_timestamp_occurances = int(options['timestamp_occurances'])

        # If the mac has been in the count for over x amount of time, it will be considered suspicious and not count towards the full tally
        for mac in macs_over_times:
            frequency = macs_over_times[mac]
            if frequency > max_timestamp_occurances:
                suspicious_macs.add(mac)

        # If the packets suceed a certain amount of frequencies
        for ts in mac_dict:
            for mac in mac_dict[ts]:
                # If we already are a suspicious mac address
                mac_is_already_sus = mac in suspicious_macs

                if not mac_is_already_sus:
                    # Unpack the tuple
                    tpl = mac_dict[ts][mac]
                    early  = int(tpl[0].hour)
                    late   = int(tpl[1].hour)
                    amount = int(tpl[2])

                    # If there is too many packets, or before early or after late 
                    too_early = early < time_early
                    too_late = late > time_late

                    # If it doesn't appear very much...
                    too_little = amount < min_packet_amount

                    # add the mac address if it is suspicious
                    if too_early or too_late:
                        suspicious_macs.add(mac)

        # Give the set of suspicious macs...
        return suspicious_macs

    def calculate_total_unsuspicious_macs(self,  entries: list[dict], freq: dict, suspicious_macs: set) -> set:
        """
        :fn: calculate_total_unsuspicious_macs
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Get the amount of unsuspicious macs that we have.
        :param entries: The entries of the database
        :param freq: The frequency dict, lists timestamps to node_ids
        :param suspicious_macs: The mac addresses we do not trust.
        :return: Returns the nodes with the appropriate level of non-suspicious macs
        """
        nodes = dict()

        # Add the frequencies 
        for entry in entries:
            # Create an attendance from this.
            attendance = Attendance()
            attendance.deserialise(entry)

            # We round the time to last 30 minutes because we want to track time like this.
            timestamp = Density.roundToLast30Minutes(attendance.timestamp)

            # If the node exists in the dictionary, add to the freq of the timestamp
            node_id = attendance.node_id
            if not node_id in nodes:
                nodes[node_id] = dict()

            # Get all the macs in this address.
            
            # Show the set
            if timestamp in freq:
                # These are the unique macs at this timestamp
                unique_macs = set(freq[timestamp])

                # Get non suspicious macs
                nonsus_macs = unique_macs - suspicious_macs

                nodes[node_id][timestamp] = len(nonsus_macs)

        return nodes

    def convert_mac_accesses_to_history(self, full_nodes: list[Node], nodes: dict) -> list[Density]:
        """
        :fn: convert_mac_accesses_to_history
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Get the history from a collection of node data
        :return: Returns the nodes and the estimated populaton they have
        """
        # Create an array to send back 
        history = [ ]

        # For each node...
        for node_id in nodes:
            # Get the node 
            node = None 
            # Get the class instance of the node
            for potential_node in full_nodes:
                if potential_node.id == node_id:
                    node = potential_node

            # For each timestamp in that node.
            for ts in nodes[node_id]:
                # Get the frequency amount 
                freq = nodes[node_id][ts]

                # New Historic Attendance.
                historic = Density(ts, node, freq)
                history.append(historic)
        return history

    def squash(self, full_nodes: list[Node], sus_options: dict, strength_options: dict) -> list[Density]:
        """
        :fn: squash
        :date: 03/09/2025
        :author: Cameron Sims
        :brief: Summarises activity in the attendance collection, and creates various historic attedenance instances.
        :param full_nodes: A list of all nodes.
        :param sus_options: The option for suspicious macs
        :param strength_options: Options for including macs if they fit criteria
        :return: Returns an array of "Density" instances.
        """

        # Get all entries in the collection.
        entries = list(self.collection.find({}))

         # The mac address frequencies, the amount of times they appear.
        freq = self.get_frequencies(entries, strength_options)

        # Get the suspicious macs 
        macs_over_times = self.get_total_mac_occurances(freq)
        suspicious_macs = self.get_suspicious_macs(sus_options, freq, macs_over_times)

        # This is the map of every node, every 30 mins.
        nodes = self.calculate_total_unsuspicious_macs(entries, freq, suspicious_macs)

        print('Suspicious macs:', [mac for mac in suspicious_macs])
        print('Unsuspicious macs:')
        for node_id in nodes: 
            for timestamp in nodes[node_id]:
                print(timestamp, nodes[node_id][timestamp])
        
        return self.convert_mac_accesses_to_history(full_nodes, nodes)
