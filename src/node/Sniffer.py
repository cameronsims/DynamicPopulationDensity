"""
:author: Cameron Sims
:date: 27/08/2025
:brief: This module manages packet sniffing functionality, and it's interactions.
"""

from datetime import datetime
import pyshark 
from src.structures.attendance import Attendance

class Sniffer:
    """
    :class: Sniffer
    :date: 27/08/2025
    :author: Cameron Sims
    :brief: This class holds our database clients.
    """
    def __init__(self, config_file: str, debug_mode: bool = False): #, interface: str = "Wi-Fi", output_file: str = "./data/captures/capture.pcapng"):
        """
        :fn: __init__
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates and initialises the sniffer and the tshark instance.
        :param node_id: The node id that this sniffer instance refers to
        :param config_file: The file to configure this sniffer
        :param debug_mode: Used for debugging pyshark/tshark
        """
        # Read the file 
        self.debug_mode = debug_mode
        self.load_config(config_file)

        # Assigns the interface and output file.
        self.start_tshark(interface=self.interface, output_file=self.output_file)

    def load_config(self, config_file: str): #, interface: str = "Wi-Fi", output_file: str = "./data/captures/capture.pcapng"):
        """
        :fn: load_config
        :date: 05/09/2025
        :author: Cameron Sims
        :brief: Sets the config to a file
        :param config_file: The config file that this sniffer is going to use.
        """    
        # Read the file 
        from json import load as json_load
        config = json_load(open(config_file))

        # Read info from this config 
        self.interface           = str (config['interface'])
        self.output_file         = str (config['output_file'])
        self.tshark_path         = str (config['tshark_path'])
        self.default_max_packets = int (config["max_packets"])

        # This specific varaible is if we should use max packets or timeout
        self.use_timeout         = bool(config['use_timeout'])
        self.default_timeout     = int (config["timeout"])

        # This is a bit of self referential data, what node is this sniffer associated with?
        self.node_id             = int (config['node_id'])

    def __del__(self):
        """
        :fn: __del__
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Deletes the sniffer instance, stops tshark if it's running.
        """
        # If we have a capture instance, stop it.
        if hasattr(self, 'capture'):
            self.capture.close()
        # If we have a file capture instance, stop it.
        if hasattr(self, 'file_capture'):
            self.file_capture.close()

    def start_tshark(self, interface: str, output_file: str):
        """
        :fn: initialise_tshark
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Starts the tshark instance.
        :param interface: The network interface to capture packets on.
        :param output_file: The file to save the captured packets to.
        """
        # Create the live capture instance
        self.interface = interface
        self.output_file = output_file

    def start_sniffing(self, max_packets: int = None, timeout: int = None):
        """
        :fn: start_sniffing
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates a sniffing loop, writes these packets to a cache array.
        :param max_packets: The maximum number of packets to capture before stopping.
        :param timeout: The maximum time to capture packets for, in seconds.
        """

        # If we don't have anything for these...
        if max_packets is None:
            max_packets = self.default_max_packets
        if timeout is None:
            timeout = self.default_timeout

        # What do we iterate over? max_packets or timeout?
        time_str = f"over {timeout} seconds" if self.use_timeout else f"for {max_packets} packets"
        print(f"Sniffing over interface \"{self.interface}\" {time_str} placing in \"{self.output_file}\"")
        self.capture = pyshark.LiveCapture(
            interface=self.interface, 
            output_file=self.output_file,
            tshark_path=self.tshark_path)

        if self.debug_mode:
            self.capture.set_debug()
        
        if self.use_timeout:
            self.capture.sniff(timeout=timeout)
        else:
            for packet in self.capture.sniff_continuously(packet_count=max_packets):
                pass
        # We have finished capturing packets, return to the function that called this.
                
    
    def get_packets_from_file(self, output_file: str = None)-> list[Attendance]:
        """
        :fn: get_packets_from_file
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Gets the list of packets from a previously defined output file
        :param output_file: The file to read the captured packets from.
        """
        # If the output file is not defined, use the one defined in the constructor
        if output_file is None:
            output_file = self.output_file

        # Create the file capture instance
        self.file_capture = pyshark.FileCapture(output_file)
        self.file_capture.load_packets()

        packets = [ 0 ] * len(self.file_capture)
        i = 0
        for packet in self.file_capture:
            packets[i] = self.convert_packet_to_attendance(packet)
            i += 1
        return packets
    
    def convert_packet_to_attendance(self, packet: pyshark.packet.packet.Packet) -> dict:
        """
        :fn: convert_packet_to_attendance
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Converts a packet to an attendance record, suitable for database insertion.
        :param output_file: The file to read the captured packets from.
        """
        from datetime import datetime

        # This is our attendance record
        attendance_record = Attendance(
            # Timestamp, if we have a packet timestamp, use it.
            packet.sniff_time,#datetime.now(),
            # Node ID, if we have a node associated with this sniffer, add it.
            self.node_id,
            # If the Packet has a MAC Address, add it.
            None if (not 'eth' in packet) else packet.eth.src)

        timestamp = datetime.now()

        return attendance_record