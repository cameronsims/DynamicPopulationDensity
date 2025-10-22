"""
:author: Cameron Sims
:date: 27/08/2025
:brief: This module manages packet sniffing functionality, and it's interactions.
"""

from pyshark import LiveCapture, FileCapture
from pyshark.packet.packet import Packet
from src.structures.attendance import Attendance
from src.structures.PacketType import PacketType

class Sniffer:
    """
    :class: Sniffer
    :date: 27/08/2025
    :author: Cameron Sims
    :brief: This class holds our database clients.
    """
    def __init__(self, sniff_config_file: str, node_config_file: str): #, interface: str = "Wi-Fi", output_file: str = "./data/captures/capture.pcapng"):
        """
        :fn: __init__
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates and initialises the sniffer and the tshark instance.
        :param node_id: The node id that this sniffer instance refers to
        :param sniff_config_file: The file to configure this sniffer
        :param node_config_file: The file to configure the node info that this sniffer belongs to.
        """
        # Read the file 

        self.load_node_config(node_config_file)
        self.load_sniff_config(sniff_config_file)

        # Assigns the interface and output file.
        self.start_tshark(interface=self.interface, output_file=self.output_file)

    def load_node_config(self, config_file: str):
        """
        :fn: load_node_config
        :date: 08/10/2025
        :author: Cameron Sims
        :brief: Sets the metadata for what node this sniffer belongs to.
        :param config_file: The config file that this node is going to use.
        """ 
        from json import load as json_load
        config = json_load(open(config_file))

        # This is a bit of self referential data, what node is this sniffer associated with?
        self.node_id             = str (config['node_id']) 

    def load_sniff_config(self, config_file: str): #, interface: str = "Wi-Fi", output_file: str = "./data/captures/capture.pcapng"):
        """
        :fn: load_sniff_config
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

        self.use_json            = bool(config['use_json'])
        self.debug_mode          = bool(config['debug_mode'])

        # This specific varaible is if we should use max packets or timeout
        self.use_timeout         = bool(config['use_timeout'])
        self.default_timeout     = int (config["timeout"])

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

    def start_sniffing(self, max_packets: int = None, timeout: int = None, use_params: bool = True):
        """
        :fn: start_sniffing
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Creates a sniffing loop, writes these packets to a cache array.
        :param max_packets: The maximum number of packets to capture before stopping.
        :param timeout: The maximum time to capture packets for, in seconds.
        :param use_params: Uses a different method to save packets to files.
        """
        from os.path import exists as file_exists
        from os import remove as file_remove, chmod as file_perms
        import stat 

        # If we don't have anything for these, set them to default values, otherwise set it to the default.
        max_packets = self.default_max_packets if max_packets is None else max_packets
        timeout = self.default_timeout if timeout is None else timeout

        # What do we iterate over? max_packets or timeout?
        seconds_param_str = f"over {timeout} seconds"
        packets_param_str = f"for {max_packets} packets"
        time_str = seconds_param_str if self.use_timeout else packets_param_str
        print(f"Sniffing over interface \"{self.interface}\" {time_str} placing in \"{self.output_file}\"")

        # Delete and then Create the file 
        if file_exists(self.output_file):
            file_remove(self.output_file)
        with open(self.output_file, 'w') as file:
            # Close file with nothing.
            pass
            
        # Set maximum perms.
        file_perms(self.output_file, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

        self.capture = None 

        if use_params:
            self.capture = LiveCapture(
                interface=self.interface, 
                tshark_path=self.tshark_path,
                custom_parameters = [ '-w', self.output_file, '-F', 'pcapng' ],
                use_json = self.use_json
                #monitor_mode=True # Gets the strengths of connections, good to determine how far away they are.
            )
        else:
            self.capture = LiveCapture(
                interface=self.interface, 
                output_file=self.output_file,
                tshark_path=self.tshark_path,
                use_json = self.use_json
                #monitor_mode=True # Gets the strengths of connections, good to determine how far away they are.
            )

        if self.debug_mode:
            self.capture.set_debug()
        
        try:
            if self.use_timeout:
                self.capture.sniff(timeout=timeout)
            else:
                for packet in self.capture.sniff_continuously(packet_count=max_packets):
                    pass
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
        
        # Load the packets into the program, if not activated the packets won't be read.
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
    
    def get_packet_type(self, packet: Packet) -> PacketType:
        """
        :fn: get_packet_type
        :date: 01/10/2025
        :author: Cameron Sims
        :brief: The type of packet.
        """
        # If we have a bluetooth layer...
        if self.is_packet_bluetooth(packet):
            return PacketType.BLUETOOTH
        # Else, if we're dealing with Wi-Fi/Ethernet...
        elif 'eth' in packet:
            return PacketType.ETHERNET # Ethernet Source
        # Else if the packet has a "wlan" layer.
        elif 'wlan' in packet:
            return PacketType.WIFI # WLAN Source Address
        # If we don't know what we have, return None.
        return PacketType.NONE

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
        packet_type = self.get_packet_type(packet)

        if packet_type is PacketType.BLUETOOTH:
            return packet.blte.src # Bluetooth Source
        elif packet_type is PacketType.ETHERNET:
            return packet.eth.src # Ethernet Source
        elif packet_type is PacketType.WIFI:
            return packet.wlan.sa # WLAN Source Address
        
        # If we don't know what we have, return None.
        return None
    
    def get_signal(self, packet: Packet) -> int | None:
        """
        :fn: get_signal
        :date: 01/10/2025
        :author: Cameron Sims
        :brief: Gets the signal strength from a packet.
        :param packet: The packet to get the signal strength from.
        :return: Returns the signal strength of the packet.
        """

        # If the packet has radiotap data, not able to be picked up on Raspberry PI zeros
        if 'radiotap' in packet:
            return packet.radiotap.dbm_antsignal
        
        # If the packet is bluetooth, we can always get strength of signals!
        if self.is_packet_bluetooth(packet):
            return packet.btcommon.dbm_antsignal #; rssi = packet.btle.rssi

        return None

    
    def convert_packet_to_attendance(self, packet: Packet) -> dict:
        """
        :fn: convert_packet_to_attendance
        :date: 27/08/2025
        :author: Cameron Sims
        :brief: Converts a packet to an attendance record, suitable for database insertion.
        :param output_file: The file to read the captured packets from.
        """
        # Hashing algorithm...
        from hashlib import md5 as hash_md5

        # Packet information 
        packet_type = self.get_packet_type(packet)
        raw_mac_addr = self.get_packet_mac_address(packet)
        utf_mac_addr = raw_mac_addr.encode('utf-8')
        hashed_mac_addr = str(hash_md5(utf_mac_addr).hexdigest())
        signal = self.get_signal(packet)
        
        # This is our attendance record
        attendance_record = Attendance(
            packet.sniff_time, # Timestamp, if we have a packet timestamp, use it.
            self.node_id,      # Node ID, if we have a node associated with this sniffer, add it.
            hashed_mac_addr,   # If the Packet has a MAC Address, add it.
            signal,            # DBM signal, might be None
            packet_type        # The type of packet (bluetooth/wifi/ethernet)
        )

        return attendance_record