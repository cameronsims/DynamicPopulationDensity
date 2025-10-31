// ----- Collections with validation -----

// REGEX patterns for validation
const IPV4 = "^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$";
const MAC  = "^(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$";

// NODES collection: reference locations._id as location_id
db.createCollection("nodes", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: [
      "ip_address","mac_address","name","model","brand",
      "ram_size","ram_unit","storage_size","storage_unit","storage_type",
      "is_poe_compatible","is_wireless_connectivity","location_id"
    ],
    properties: {
      ip_address:             { bsonType: "string", pattern: IPV4 },
      mac_address:            { bsonType: "string", pattern: MAC },
      name:                   { bsonType: "string" },
      model:                  { bsonType: "string" },
      brand:                  { bsonType: "string" },
      ram_size:               { bsonType: "int", minimum: 1 },
      ram_unit:               { bsonType: "string", enum: ["MB","GB"] },
      storage_size:           { bsonType: "int", minimum: 1 },
      storage_unit:           { bsonType: "string", enum: ["GB","TB"] },
      storage_type:           { bsonType: "string", enum: ["microSD","SSD","HDD","eMMC"] },
      is_poe_compatible:      { bsonType: "bool" },
      is_wireless_connectivity:{ bsonType: "bool" },
      location_id:            { bsonType: "objectId", description: "FK -> locations._id" }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

// NODE EVENTS (collection to track node status changes)
db.createCollection("nodeEvents", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["node_id","is_powered","is_receiving_data","date_time"],
    properties: {
      node_id:            { bsonType: "objectId", description: "FK -> nodes._id" },
      is_powered:         { bsonType: "bool" },
      is_receiving_data:  { bsonType: "bool" },
      date_time:          { bsonType: "date" }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

// LOCATIONS collection (to be referenced by nodes.location_id and densityHistory.location_id fields)
db.createCollection("locations", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["name","building","level","room"],
    properties: {
      name:        { bsonType: "string" },
      description: { bsonType: "string" },
      building:    { bsonType: "string" },
      level:       { bsonType: "string" },
      room:        { bsonType: "string" }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

// ATTENDANCE HISTORY (collection to log detected devices by nodes) 
db.createCollection("attendanceHistory", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["node_id","packet_type","device_id","signal_strength","date_time"],
    properties: {
      node_id:         { bsonType: "objectId" },
      packet_type:     { bsonType: "int" },
      device_id:       { bsonType: "string" }, // using hashed device ids
      signal_strength: { bsonType: ["int", 'null'] },
      date_time:       { bsonType: "date" }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

// DENSITY HISTORY (collection to log estimated population density per location)
// reference locations._id as location_id
db.createCollection("densityHistory", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["location_id","total_estimated_humans","total_estimated_devices","estimation_factor","date_time"],
    properties: {
      location_id:             { bsonType: "objectId" },
      total_estimated_humans:  { bsonType: "int" },
      total_estimated_devices: { bsonType: "int" },
      estimation_factor:       { bsonType: "double" },
      date_time:               { bsonType: "date" }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

// ----- Indexes -----

// Unique indexes on nodes.mac_address and nodes.ip_address (only if the field is a string)
// to allow multiple documents with null or missing mac_address/ip_address
// (i.e., nodes without network interfaces)
db.nodes.createIndex(
  { mac_address: 1, ip_address: 1, name: 1 },
  { name: "node_natural_unique", unique: true }
);

// Unique index on locations (name, building, level, room)
// to prevent duplicate location entries
db.locations.createIndex(
  { name: 1, building: 1, level: 1, room: 1 },
  { name: "location_natural_unique", unique: true }
);

// Indexes to optimize queries on nodeEvents, attendanceHistory, and densityHistory
// sorting by date_time descending (most recent first) and filtering by node_id or location_id
db.nodeEvents.createIndex(
  { node_id: 1, date_time: -1 },
  { name: "node_date_desc" }
);

db.attendanceHistory.createIndex(
  { node_id: 1, device_id: 1, date_time: -1 },
  { name: "node_device_date_desc" }
);

db.densityHistory.createIndex(
  { location_id: 1, date_time: -1 },
  { name: "loc_date_desc" }
);

// ----- Seed data (insert locations first, then reference their _id from nodes) -----

// Insert sample locations
const locs = db.locations.insertMany([
  { name: "LOC001", description: "Cyber Security and Networking Lab A", building: "245", level: "3", room: "3.064" },
  { name: "LOC002", description: "Cyber Security and Networking Lab B", building: "245", level: "3", room: "3.063" },
  { name: "LOC003", description: "Mixed and Augmented Reality Studio Lab G", building: "245", level: "3", room: "3.062" }
]);

//// These hold the auto-generated _id values:
const [LOC1, LOC2, LOC3] = Object.values(locs.insertedIds);

// Insert sample nodes referencing the above locations
db.nodes.insertMany([
  {
    ip_address: "10.51.33.101", // Example IPv4 address, the actual IPs should be assigned as per network design
    mac_address: "B8:27:EB:12:34:56", // Example MAC address, the actual MACs should be the hardware MACs of the node
    name: "Lab A - Mehlam",
    model: "Raspberry Pi Zero W",
    brand: "Raspberry Pi Foundation",
    ram_unit: "MB",
    ram_size: 512,
    storage_unit: "GB",
    storage_size: 16,
    storage_type: "microSD",
    is_poe_compatible: true,
    is_wireless_connectivity: true,
    location_id: LOC1
  },
  {
    ip_address: "100.64.0.2", // Example IPv4 address, the actual IPs should be assigned as per network design
    mac_address: "00:e0:4c:36:05:dc", // Example MAC address, the actual MACs should be the hardware MACs of the node
    name: "Lab B - Cameron",
    model: "Raspberry Pi Zero W",
    brand: "Raspberry Pi Foundation",
    ram_unit: "MB",
    ram_size: 512,
    storage_unit: "GB",
    storage_size: 16,
    storage_type: "microSD",
    is_poe_compatible: true,
    is_wireless_connectivity: true,
    location_id: LOC2
  },
  {
    ip_address: "134.115.149.49", // Example IPv4 address, the actual IPs should be assigned as per network design
    mac_address: "00:e0:4c:36:05:cf", // Example MAC address, the actual MACs should be the hardware MACs of the node
    name: "Lab G - Nasrin",
    model: "Raspberry Pi Zero W",
    brand: "Raspberry Pi Foundation",
    ram_unit: "MB",
    ram_size: 512,
    storage_unit: "GB",
    storage_size: 32,
    storage_type: "microSD",
    is_poe_compatible: true,
    is_wireless_connectivity: true,
    location_id: LOC3
  }
]);
