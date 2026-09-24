/**
 * ULTRON Galaxy AI OS - Core Type Definitions
 */

export type NavigationPageId =
  | 'command_center'
  | 'chat'
  | 'voice'
  | 'tasks'
  | 'memory'
  | 'tools'
  | 'notifications'
  | 'settings'
  | 'glb_studio'
  | 'galaxy_view'
  | 'intelligence'
  | 'system_control'
  | 'youtube_media';

export type AIStateMode =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'SUCCESS'
  | 'ERROR'
  | 'SECURITY_ALERT';

export type CognitiveDirectiveStep = 'understand' | 'plan' | 'execute' | 'evolve';

export interface TelemetryMetrics {
  cpu: number;
  ram: number;
  gpu: number;
  temperature: number;
  networkDown: number;
  networkUp: number;
  memoryUsage: number;
  uptimeSeconds: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'CRITICAL' | 'ELEVATED' | 'STANDARD';
  sector: string;
  dueTime: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  category: string;
  protocol: string;
  threatEvaluation: string;
}

export interface ResearchBrief {
  id: string;
  title: string;
  source: string;
  confidence: string;
  summary: string;
  timestamp: string;
  classification: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  entropy: string;
  type: 'BINARY' | 'SCHEMATIC' | 'PROTOCOL' | 'CIPHER';
  status: 'ANALYZED' | 'INDEXED' | 'ENCRYPTED';
}

export interface ApplicationBridge {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'STANDBY' | 'TERMINATED';
  pids: number;
  memory: string;
  securityRating: string;
}

export interface NotificationItem {
  id: string;
  subsystem: string;
  title: string;
  time: string;
  isUrgent?: boolean;
  read: boolean;
}

export interface SystemLogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'NEURAL' | 'DEFENSE';
  subsystem: string;
  message: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  latency: number;
  status: 'SECURE' | 'SCANNING' | 'SYNCHRONIZED';
  encryption: string;
}
