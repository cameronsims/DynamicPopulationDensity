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
    def __init__(self, node_id, interface: str = "Wi-Fi", output_file: str = "./data/captures/capture.pcapng"):
        """
        :fn: __init__
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates and initialises the sniffer and the tshark instance.
        :param interface: The network interface to capture packets on.
        :param output_file: The file to save the captured packets to.
        """
        # Assigns the interface and output file.
        self.start_tshark(interface=interface, output_file=output_file)

        # This is a bit of self referential data, what node is this sniffer associated with?
        self.node_id = node_id

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

    def start_sniffing(self, max_packets: int = 2500, timeout: int = 300):
        """
        :fn: start_sniffing
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates a sniffing loop, writes these packets to a cache array.
        :param max_packets: The maximum number of packets to capture before stopping.
        :param timeout: The maximum time to capture packets for, in seconds.
        """
        # What do we iterate over? max_packets or timeout?
        print(self.interface, self.output_file)
        self.capture = pyshark.LiveCapture(interface=self.interface, output_file=self.output_file)
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