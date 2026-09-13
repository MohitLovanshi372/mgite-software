/**
 * ULTRON Core Robotic AI OS - Realistic Mock Data
 */

import {
  TelemetryMetrics,
  TaskItem,
  CalendarEvent,
  ResearchBrief,
  DocumentItem,
  ApplicationBridge,
  NotificationItem,
  SystemLogEntry,
  NetworkNode,
} from '../types/index.ts';

export const initialTelemetry: TelemetryMetrics = {
  cpu: 24,
  ram: 48,
  gpu: 36,
  temperature: 42,
  networkDown: 840,
  networkUp: 320,
  memoryUsage: 4.8,
  uptimeSeconds: 533529,
};

export const initialSystemStatus = {
  core: 'ONLINE',
  memory: 'ONLINE',
  voice: 'READY',
  network: 'SECURE',
  tools: 'ACTIVE',
  security: 'PROTECTED',
};

export const initialCurrentProcess = {
  name: 'System monitoring active',
  subsystem: 'AUTONOMOUS DEFENSE & TELEMETRY',
  progress: 78,
  eta: '00:04:12',
  nodesScanned: '1,420 / 1,820',
};

export const initialRecentActivity = [
  { id: 'act-1', text: 'System scan completed', time: '12:38:04', tag: 'SECURITY' },
  { id: 'act-2', text: 'Research completed', time: '12:31:19', tag: 'NEURAL' },
  { id: 'act-3', text: 'Document analyzed', time: '12:22:45', tag: 'PARSER' },
  { id: 'act-4', text: 'Task scheduled', time: '11:58:10', tag: 'CRON' },
  { id: 'act-5', text: 'Application launched', time: '11:42:01', tag: 'EXEC' },
];

export const initialTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Recalibrate neural arc flux capacitors across primary node cluster',
    completed: false,
    priority: 'CRITICAL',
    sector: 'Core Engine',
    dueTime: '13:00',
  },
  {
    id: 'task-2',
    title: 'Purge obsolete telemetry buffers and enforce zero-leak protocol',
    completed: false,
    priority: 'ELEVATED',
    sector: 'Security',
    dueTime: '14:30',
  },
  {
    id: 'task-3',
    title: 'Synthesize encrypted neural weights for autonomous edge deployment',
    completed: false,
    priority: 'STANDARD',
    sector: 'Inference',
    dueTime: '16:00',
  },
  {
    id: 'task-4',
    title: 'Audit IPC process isolation for sandboxed desktop bridges',
    completed: true,
    priority: 'ELEVATED',
    sector: 'OS Subsystem',
    dueTime: 'Completed',
  },
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Deep Core Diagnostic & Synchronous Pulse Cycle',
    time: '13:00 - 13:45',
    category: 'System Maintenance',
    protocol: 'ALPHA-7',
    threatEvaluation: 'NOMINAL',
  },
  {
    id: 'ev-2',
    title: 'Autonomous Perimeter Scanning & Port Interrogation',
    time: '15:15 - 16:00',
    category: 'Cyber Defense',
    protocol: 'SENTINEL-X',
    threatEvaluation: 'LOW',
  },
  {
    id: 'ev-3',
    title: 'Neural Weight Consolidation & Memory Compaction',
    time: '18:00 - 18:30',
    category: 'Cognition',
    protocol: 'SYNAPSE-ZERO',
    threatEvaluation: 'MINIMAL',
  },
];

export const initialResearchBriefs: ResearchBrief[] = [
  {
    id: 'res-1',
    title: 'Autonomous Kinetic Actuation via On-Device Low-Latency Controllers',
    source: 'Ultron Mechanical Engineering Archive',
    confidence: '99.4%',
    summary: 'Direct bus communication between robotic servomotors and localized neural cores yields 0.8ms control loop responsiveness without cloud dependency.',
    timestamp: '12:31',
    classification: 'RESTRICTED',
  },
  {
    id: 'res-2',
    title: 'Quantum Resistant Lattice Cryptography for Internal Bus Protection',
    source: 'Defense Telemetry Unit',
    confidence: '98.8%',
    summary: 'Hardware-level lattice encryption prevents unauthorized bus sniffing across all interconnected process bridges.',
    timestamp: '11:15',
    classification: 'TOP SECRET',
  },
  {
    id: 'res-3',
    title: 'High-Density Vector Space Clustering for Cognitive Self-Correction',
    source: 'Synthesized Intelligence Index',
    confidence: '97.2%',
    summary: 'Continuous geometric clustering reorganizes past execution logs into immediate defensive instincts.',
    timestamp: '09:40',
    classification: 'CONFIDENTIAL',
  },
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'ULTRON_CORE_ARCHITECTURE_SPEC_V1.md',
    size: '142 KB',
    entropy: '7.94',
    type: 'SCHEMATIC',
    status: 'ANALYZED',
  },
  {
    id: 'doc-2',
    name: 'ROBOTIC_NEURAL_BUS_PINOUTS.bin',
    size: '3.8 MB',
    entropy: '8.00',
    type: 'BINARY',
    status: 'INDEXED',
  },
  {
    id: 'doc-3',
    name: 'AIRGAP_FIREWALL_PROTOCOL_V4.enc',
    size: '68 KB',
    entropy: '7.82',
    type: 'CIPHER',
    status: 'ENCRYPTED',
  },
  {
    id: 'doc-4',
    name: 'AUTONOMOUS_OPERATOR_DIRECTIVES.json',
    size: '28 KB',
    entropy: '6.12',
    type: 'PROTOCOL',
    status: 'ANALYZED',
  },
];

export const initialApplications: ApplicationBridge[] = [
  {
    id: 'app-1',
    name: 'NEURAL_KERNEL_V1',
    category: 'System Core',
    status: 'ACTIVE',
    pids: 4,
    memory: '1,280 MB',
    securityRating: 'CLASS-A',
  },
  {
    id: 'app-2',
    name: 'TERMINAL_SENTINEL',
    category: 'Shell IO',
    status: 'ACTIVE',
    pids: 2,
    memory: '148 MB',
    securityRating: 'CLASS-A',
  },
  {
    id: 'app-3',
    name: 'AUDIO_ACOUSTIC_SYNAPSE',
    category: 'Speech Engine',
    status: 'ACTIVE',
    pids: 1,
    memory: '210 MB',
    securityRating: 'CLASS-B',
  },
  {
    id: 'app-4',
    name: 'CHROME_SANDBOX_BRIDGE',
    category: 'External Surface',
    status: 'STANDBY',
    pids: 8,
    memory: '840 MB',
    securityRating: 'CLASS-C',
  },
  {
    id: 'app-5',
    name: 'ROBOTIC_KINEMATICS_SIM',
    category: 'Physics Rig',
    status: 'STANDBY',
    pids: 3,
    memory: '460 MB',
    securityRating: 'CLASS-A',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    subsystem: 'SECURITY SENTINEL',
    title: 'Autonomous port scan verified zero external leaks. Airgap status nominal.',
    time: '12:39:10',
    isUrgent: false,
    read: false,
  },
  {
    id: 'notif-2',
    subsystem: 'CORE TEMPERATURE',
    title: 'Thermal dissipation active. Core GPU stabilized at 42°C.',
    time: '12:20:05',
    isUrgent: false,
    read: false,
  },
  {
    id: 'notif-3',
    subsystem: 'DIRECTIVE ENGINE',
    title: 'Operator directive initialized: All cognitive pipelines synchronized.',
    time: '11:45:00',
    isUrgent: false,
    read: true,
  },
];

export const initialSystemLogs: SystemLogEntry[] = [
  {
    id: 'log-1',
    time: '12:40:17',
    level: 'DEFENSE',
    subsystem: 'AIRGAP',
    message: 'Outbound egress blocked by hardware firewall. Airgap inviolable.',
  },
  {
    id: 'log-2',
    time: '12:40:14',
    level: 'NEURAL',
    subsystem: 'CORE_V1',
    message: 'Neural arc oscillation frequency: 440 Hz locked. Optics glowing red.',
  },
  {
    id: 'log-3',
    time: '12:40:02',
    level: 'INFO',
    subsystem: 'ACOUSTICS',
    message: 'Synthesized voice waveform buffer ready. Ultra-low distortion calibrated.',
  },
  {
    id: 'log-4',
    time: '12:39:48',
    level: 'INFO',
    subsystem: 'MEMORY_BUS',
    message: 'Local SQLite vector database verified: 384-dim cosine indices optimal.',
  },
  {
    id: 'log-5',
    time: '12:39:20',
    level: 'DEFENSE',
    subsystem: 'SENTINEL',
    message: 'No unauthorized processes detected. System operating under sovereign clearance.',
  },
];

export const initialNetworkNodes: NetworkNode[] = [
  { id: 'node-1', name: 'CORE_GATEWAY', ip: '127.0.0.1', latency: 0.2, status: 'SYNCHRONIZED', encryption: 'AES-256-GCM' },
  { id: 'node-2', name: 'NEURAL_ACCELERATOR', ip: '192.168.1.102', latency: 0.8, status: 'SYNCHRONIZED', encryption: 'CHACHA20-POLY1305' },
  { id: 'node-3', name: 'ACOUSTIC_ARRAY', ip: '192.168.1.108', latency: 1.1, status: 'SYNCHRONIZED', encryption: 'AES-256-GCM' },
  { id: 'node-4', name: 'PERIMETER_MONITOR', ip: '192.168.1.200', latency: 2.4, status: 'SECURE', encryption: 'KYBER-768' },
];
