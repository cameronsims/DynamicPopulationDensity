#!/usr/bin/env python3
# BleSniffer.py — scan BLE adverts, dedupe in a rolling window, and store to MongoDB
# Collections written: nodeEvents, attendanceHistory, densityHistory

import asyncio
import hashlib
import time
import os
from datetime import datetime, timezone
from collections import defaultdict, deque

from bleak import BleakScanner
from pymongo import MongoClient
from bson import ObjectId
from zoneinfo import ZoneInfo


# =======================
# CONFIG
# =======================
ESTIMATION_FACTOR = int(os.getenv("ESTIMATION_FACTOR", "3"))
SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL", "15"))     # seconds per scan
ROLLING_WINDOW = int(os.getenv("ROLLING_WINDOW", "300"))  # seconds
RSSI_THRESHOLD = int(os.getenv("RSSI_THRESHOLD", "-70"))  # ignore very weak signals
HASH_SALT = os.getenv("HASH_SALT", "ICT302HIVEMETRICS")
LOG_FILE = os.getenv("LOG_FILE", "/opt/DynamicPopulationDensity/src/node/log/ble_sniffer.log")

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://dpd_node_lab_a:nzMvTAB7yZPhCqZCTvQb9tTm@10.51.33.30:27017/dynamicpopulationdensity_db?authSource=dynamicpopulationdensity_db")
DB_NAME = os.getenv("DB_NAME", "dynamicpopulationdensity_db")

# Foreign keys (from existing Node & Location documents)
NODE_ID_STR = os.getenv("NODE_ID", "68f0af9f149c526815ce5f4c")
LOCATION_ID_STR = os.getenv("LOCATION_ID", "68f0af9f149c526815ce5f49") 

# Collection names (aligning with your dictionary)
COL_NODE_EVENTS = "nodeEvents"              # (Entity – NodeEvent)
COL_ATTENDANCE = "attendanceHistory"        # (Entity – AttendanceHistory)
COL_DENSITY = "densityHistory"              # (Entity – DensityHistory)

# =======================
# STATE
# =======================
seen = defaultdict(deque)  # seen[hashed_addr] -> deque[timestamps]


def _utcnow():
    return datetime.now(ZoneInfo("Australia/Perth"))


def ensure_log_dir():
    log_dir = os.path.dirname(LOG_FILE)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)


def log_to_file(message: str):
    ensure_log_dir()
    with open(LOG_FILE, "a") as f:
        f.write(message + "\n")


def hash_addr(addr: str) -> str:
    """Hash BLE MAC address with salt for privacy; store as device_id."""
    return hashlib.sha256((HASH_SALT + addr).encode()).hexdigest()


def prune_old(now_epoch: int):
    """Remove addresses not seen within the rolling window."""
    cutoff = now_epoch - ROLLING_WINDOW
    dead = []
    for addr, dq in seen.items():
        while dq and dq[0] < cutoff:
            dq.popleft()
        if not dq:
            dead.append(addr)
    for addr in dead:
        del seen[addr]


def estimate_count() -> int:
    """Estimated humans given current unique devices."""
    return int(len(seen) / ESTIMATION_FACTOR)


def _as_object_id(maybe_hex: str):
    """Convert 24-char hex to ObjectId or return None if invalid/empty."""
    try:
        return ObjectId(maybe_hex) if maybe_hex else None
    except Exception:
        return None


# Prepare Mongo client & collections up-front
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
node_events_col = db[COL_NODE_EVENTS]
attendance_col = db[COL_ATTENDANCE]
density_col = db[COL_DENSITY]

NODE_ID = _as_object_id(NODE_ID_STR)
LOCATION_ID = _as_object_id(LOCATION_ID_STR)

if NODE_ID is None:
    print("[WARN] NODE_ID is not set or invalid; related documents will be inserted with a null node_id.")
if LOCATION_ID is None:
    print("[WARN] LOCATION_ID is not set or invalid; densityHistory will use null location_id.")


async def run_scan():
    """Continuously scan BLE devices and write to MongoDB"""
    while True:
        now_epoch = int(time.time())
        now_ts = _utcnow()

        # Scan
        devices = await BleakScanner.discover(timeout=SCAN_INTERVAL)

        # Record whether we received data this interval
        is_receiving = len(devices) > 0

        # Append to 'seen' (rolling de-dup)
        new_attendance_docs = []
        for d in devices:
            rssi = getattr(d, "rssi", None)
            if rssi is not None and rssi < RSSI_THRESHOLD:
                continue

            # Hash the BLE MAC to device_id
            device_id = hash_addr(d.address)

            # Track presence
            seen[device_id].append(now_epoch)

            # AttendanceHistory document (per device detection)
            # Data dictionary mapping:
            #  node_id: ObjectId (FK)
            #  packet_type: Int32 (e.g.,  0 = NONE, Bluetooth = 1, Wifi = 2, Ethernet = 3, Other = 4)
            #  device_id: String (hashed)
            #  signal_strength: Int32 (RSSI if available else None)
            #  date_time: Date (UTC)
            new_attendance_docs.append({
                "node_id": NODE_ID,
                "packet_type": 1,
                "device_id": device_id,
                "signal_strength": int(rssi) if rssi is not None else None,
                "date_time": now_ts,
            })

        # Housekeeping
        prune_old(now_epoch)
        total_devices = len(seen)
        total_estimated_humans = estimate_count()

        # Local log line
        log_line = (
            f"{now_ts.isoformat()}Z "
            f"devices_seen={total_devices} "
            f"total_estimated_humans={total_estimated_humans} "
            f"estimation_factor={ESTIMATION_FACTOR}"
        )
        print(log_line)
        log_to_file(log_line)

        # =======================
        # MongoDB Writes
        # =======================

        # NodeEvent (heartbeat per scan window)
        # Data dictionary mapping:
        #   node_id (FK), is_powered, is_receiving_data, date_time
        try:
            node_events_col.insert_one({
                "node_id": NODE_ID,
                "is_powered": True,                 # process is running
                "is_receiving_data": is_receiving,  # saw any adverts this interval
                "date_time": now_ts,
            })
        except Exception as e:
            print(f"[MongoDB] NodeEvent insert failed: {e}")

        # AttendanceHistory (batch)
        if new_attendance_docs:
            try:
                attendance_col.insert_many(new_attendance_docs, ordered=False)
            except Exception as e:
                print(f"[MongoDB] AttendanceHistory insert failed: {e}")

        # DensityHistory (snapshot per scan window)
        # Data dictionary mapping:
        #   location_id (FK), node_id (FK),
        #   total_estimated_humans, total_estimated_devices, estimation_factor, date_time
        try:
            density_col.insert_one({
                "location_id": LOCATION_ID,
                "node_id": NODE_ID,
                "total_estimated_humans": int(total_estimated_humans),
                "total_estimated_devices": int(total_devices),
                "estimation_factor": float(ESTIMATION_FACTOR),
                "date_time": now_ts,
            })
        except Exception as e:
            print(f"[MongoDB] DensityHistory insert failed: {e}")

        # tiny pause before the next cycle
        await asyncio.sleep(1)


if __name__ == "__main__":
    print("[BLE Scanner] Starting scan + Mongo logging…")
    try:
        asyncio.run(run_scan())
    except KeyboardInterrupt:
        print("\n[BLE Scanner] Stopped by user.")
    finally:
        try:
            client.close()
        except Exception:
            pass