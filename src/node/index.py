"""
:author: Cameron Sims
:date: 22/08/2025
:brief: This module initializes the client and sets up the main application.
"""

import pyshark

# This is the main entry point for the server side.
if __name__ == "__main__":
    capture = pyshark.LiveCapture(interface='eth0', output_file='captured_packets.pcap')
    packets = []
    for i, packet in enumerate(capture.sniff_continuously()):
        packets.append(packet)
        if packet_count and i + 1 >= packet_count:
            break

    for pkt in packets:
        print(pkt)