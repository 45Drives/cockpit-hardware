/**
 * TypeScript types for the unified hardware collector output.
 * These match the JSON shapes returned by collect.py sections.
 */

// ---------------------------------------------------------------------------
// CPU
// ---------------------------------------------------------------------------

export interface CpuInfo {
  socket: string;
  model: string;
  maxSpeed: string;
  currentSpeed: string;
  temperature: string;
}

export interface CpuData {
  cpus: CpuInfo[];
}

// ---------------------------------------------------------------------------
// RAM
// ---------------------------------------------------------------------------

export interface RamModule {
  locator: string;
  type: string;
  size: string;
  manufacturer: string;
  serialNumber: string;
  temperature: string;
}

// ---------------------------------------------------------------------------
// PCI
// ---------------------------------------------------------------------------

export interface PciSlot {
  slot: string;
  type: string;
  availibility: string; // Matches existing frontend typo
  busAddress: string;
  cardType: string;
  cardModel: string;
  firmwareVersion: string;
}

// ---------------------------------------------------------------------------
// SATA
// ---------------------------------------------------------------------------

export interface SataPartition {
  Name: string;
  Size: string;
  Type: string;
  "Mount Point": string;
}

export interface SataConnection {
  Path: string;
  Connector: string;
  Device: string;
  Partitions: SataPartition[];
}

export interface SataData {
  "SATA Info": SataConnection[];
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export interface NetworkConnection {
  connectionName: string;
  connectionState: string;
  connectionType: string;
  mac: string;
  ipv4: string;
  ipv6: string;
  pciSlot: string;
  busAddress: string;
}

// ---------------------------------------------------------------------------
// IPMI LAN
// ---------------------------------------------------------------------------

export interface IpmiLan {
  ipAddress: string;
  subnetMask: string;
  macAddress: string;
  defaultGatewayIp: string;
}

// ---------------------------------------------------------------------------
// Motherboard
// ---------------------------------------------------------------------------

export interface MotherboardData {
  manufacturer: string;
  productName: string;
  serialNumber: string;
  cpus: CpuInfo[];
  sensorReadings: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Unified collector response (collect.py output)
// ---------------------------------------------------------------------------

export interface HardwareData {
  motherboard?: MotherboardData;
  cpu?: CpuData;
  ram?: RamModule[];
  pci?: PciSlot[];
  sata?: SataData;
  network?: NetworkConnection[];
  ipmi?: IpmiLan;
}
