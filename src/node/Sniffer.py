"""
:author: Cameron Sims
:date: 27/08/2025
:brief: This module manages packet sniffing functionality, and it's interactions.
"""

from pyshark import LiveCapture, FileCapture
from pyshark.packet.packet import Packet
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
        self.node_id             = str (config['node_id'])

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

        # Put any other tshark initialisation code here...
        pass

    def start_sniffing(self, max_packets: int = None, timeout: int = None):
        """
        :fn: start_sniffing
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates a sniffing loop, writes these packets to a cache array.
        :param max_packets: The maximum number of packets to capture before stopping.
        :param timeout: The maximum time to capture packets for, in seconds.
        """

        # If we don't have anything for these, set them to default values, otherwise set it to the default.
        max_packets = self.default_max_packets if max_packets is None else max_packets
        timeout = self.default_timeout if timeout is None else timeout

        # What do we iterate over? max_packets or timeout?
        seconds_param_str = f"over {timeout} seconds"
        packets_param_str = f"for {max_packets} packets"
        time_str = seconds_param_str if self.use_timeout else packets_param_str
        print(f"Sniffing over interface \"{self.interface}\" {time_str} placing in \"{self.output_file}\"")
        
        self.capture = LiveCapture(
            interface=self.interface, 
            output_file=self.output_file,
            tshark_path=self.tshark_path
            #monitor_mode=True # Gets the strengths of connections, good to determine how far away they are.
        )

        if self.debug_mode:
            self.capture.set_debug()
        
        try:
            if self.use_timeout:
                self.capture.sniff(timeout=timeout)
            else:
                self.capture.sniff_continuously(packet_count=max_packets)
        finally:
            # We have finished capturing packets, return to the function that called this.
            self.capture.close()
                    
    
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
        self.file_capture = FileCapture(
            input_file=output_file, 
            #use_json=True, 
            #include_raw=True, 
            tshark_path=self.tshark_path)
        self.file_capture.load_packets()

        len_file_capture = len(self.file_capture)
        packets = [ 0 ] * len_file_capture
        i = 0
        for packet in self.file_capture:
            # get the attendance instance of this packet...
            attendance = self.convert_packet_to_attendance(packet)

            # If we have space in the array, use it, otherwise append.
            if i < len_file_capture:
                packets[i] = attendance
            else:
                packets.append(attendance)
            i += 1
        return packets
    
    def is_packet_bluetooth(self, packet: Packet) -> bool:
        """
        :fn: is_packet_bluetooth
        :date: 30/09/2025
        :author: Cameron Sims
        :brief: Returns whether a packet is a bluetooth packet or not.
        :param packet: The packet we're testing.
        :return: Returns true if the packet is a bluetooth packet, false otherwise.
        """
        return ('btle' in packet)
    
    def get_packet_mac_address(self, packet: Packet) -> str:
        """
        :fn: get_packet_mac_address
        :date: 30/09/2025
        :author: Cameron Sims
        :brief: Gets the MAC address from a packet, whether it is Bluetooth, Wi-Fi or Ethernet.
        :param packet: The packet to get the MAC address from.
        :return: Returns the MAC address of the packet, whether it is Bluetooth, Wi-Fi or Ethernet.
        """
        # If we have a bluetooth layer...
        if self.is_packet_bluetooth(packet):
            return packet.blte.src # Bluetooth Source
        # Else, if we're dealing with Wi-Fi/Ethernet...
        elif 'eth' in packet:
            return packet.eth.src # Ethernet Source
        # Else if the packet has a "wlan" layer.
        elif 'wlan' in packet:
            return packet.wlan.sa # WLAN Source Address
        # If we don't know what we have, return None.
        return None
            

    
    def convert_packet_to_attendance(self, packet: Packet) -> dict:
        """
        :fn: convert_packet_to_attendance
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Converts a packet to an attendance record, suitable for database insertion.
        :param output_file: The file to read the captured packets from.
        """

        """
            packet.frame_info.time: Sep 29, 2025 09:17:52.787352000 W. Australia Standard Time
            packet.frame_info.time_epoch: 1759108672.787352000
            Epoch time the packet was caught, in unix time and then in seconds.
            
            packet.frame_info.time_relative: 24.980908000
            Time the packet was caught after we started sniffing.

            packet.frame_info.time_delta: 0.000412000
            Time difference between this packet and the previous packet.
        """

        # Packet information 
        # - packet.radiotap.dbm_antsignal: Doesn't work with Raspberry PI Zero Ws

        # Mac Address info...
        mac_addr = self.get_packet_mac_address(packet)

        # If the packet is bluetooth, we can get strength of signals!
        if self.is_packet_bluetooth(packet):
            signal = packet.btcommon.dbm_antsignal
            rssi = packet.btle.rssi
            print(f'Packet \"{mac_addr}\":', signal, rssi)
        
        # This is our attendance record
        attendance_record = Attendance(
            packet.sniff_time, # Timestamp, if we have a packet timestamp, use it.
            self.node_id,      # Node ID, if we have a node associated with this sniffer, add it.
            mac_addr           # If the Packet has a MAC Address, add it.
        )

        return attendance_record