//remove it once you have real server
export const nodesFixture = [
  {
    _id: "68f0af9f149c526815ce5f4a",
    name: "NODE001",
    ip_address: "10.51.33.101",
    mac_address: "B8:27:EB:12:34:56",
    model: "Raspberry Pi Zero W",
    brand: "Raspberry Pi Foundation",
    ram_size: 512, ram_unit: "MB",
    storage_size: 16, storage_unit: "GB", storage_type: "microSD",
    is_poe_compatible: true,
    is_wireless_connectivity: true,
    location_id: "68f0af9f149c526815ce5f47"
  },
  {
    _id: "68f0af9f149c526815ce5f4b",
    name: "NODE002",
    ip_address: "10.51.33.102",
    mac_address: "B8:27:EB:65:43:21",
    model: "Raspberry Pi Zero W",
    brand: "Raspberry Pi Foundation",
    ram_size: 512, ram_unit: "MB",
    storage_size: 16, storage_unit: "GB", storage_type: "microSD",
    is_poe_compatible: true,
    is_wireless_connectivity: false,
    location_id: "68f0af9f149c526815ce5f48"
  }
];

export const locationsFixture = [
  { _id: "68f0af9f149c526815ce5f47", name: "Library" },
  { _id: "68f0af9f149c526815ce5f48", name: "Cafeteria" }
];
