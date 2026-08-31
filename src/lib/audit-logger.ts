import fs from 'fs';
import path from 'path';
import { AuditLogEntry } from './types';

const AUDIT_LOGS_FILE = path.join(process.cwd(), 'data', 'audit_logs.json');

// Default initial audit entries to populate security audit trail
const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-20260831-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor: {
      id: 'usr-admin-01',
      name: 'Dr. Rajesh Sharma',
      role: 'PRINCIPAL',
      email: 'principal@school.edu.in',
      ip: '192.168.1.100'
    },
    module: 'BROADCAST',
    action: 'BROADCAST_DISPATCHED',
    severity: 'WARNING',
    summary: 'Dispatched emergency rainfall weather advisory & early dispersal alert to 1,200 families.',
    details: { target: 'ALL_PARENTS', channel: 'WEB_PUSH_SMS', urgent: true },
    school_id: 'DPS2026',
    session: '2026-27'
  },
  {
    id: 'AUD-20260831-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    actor: {
      id: 'usr-tea-04',
      name: 'Sunita Verma',
      role: 'TEACHER',
      email: 'sunita.verma@school.edu.in',
      ip: '192.168.1.105'
    },
    module: 'EXAMINATION',
    action: 'MARKS_SUBMITTED',
    severity: 'INFO',
    summary: 'Submitted Unit Test 2 marks for Class 10 - Section A (Mathematics & Science - 28 scholars).',
    details: { class: 'Class 10 - A', exam: 'Unit Test 2', total_scholars: 28 },
    targetName: 'Class 10 - A',
    school_id: 'DPS2026',
    session: '2026-27'
  },
  {
    id: 'AUD-20260831-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: {
      id: 'usr-acc-01',
      name: 'Ramesh Kulkarni',
      role: 'ACCOUNTANT',
      email: 'accounts@school.edu.in',
      ip: '192.168.1.108'
    },
    module: 'FEES',
    action: 'FEE_COLLECTED',
    severity: 'INFO',
    summary: 'Collected Q2 Tuition & Transport Fee ₹18,500 for Scholar Aarav Sharma (SR-2026-C01-002) via UPI.',
    details: { invoice_id: 'INV-2026-089', amount: 18500, mode: 'UPI' },
    targetId: 'SR-2026-C01-002',
    targetName: 'Aarav Sharma',
    school_id: 'DPS2026',
    session: '2026-27'
  },
  {
    id: 'AUD-20260831-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: {
      id: 'usr-admin-01',
      name: 'Admin Desk',
      role: 'SUPERADMIN',
      email: 'admin@school.edu.in',
      ip: '192.168.1.100'
    },
    module: 'ATTENDANCE',
    action: 'ATTENDANCE_RECORDED',
    severity: 'INFO',
    summary: 'Locked morning attendance for 18 classes (504 total students - 94.2% Present).',
    details: { total_classes: 18, present_rate: '94.2%' },
    school_id: 'DPS2026',
    session: '2026-27'
  },
  {
    id: 'AUD-20260831-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actor: {
      id: 'usr-admin-01',
      name: 'Dr. Rajesh Sharma',
      role: 'PRINCIPAL',
      email: 'principal@school.edu.in',
      ip: '192.168.1.100'
    },
    module: 'STUDENTS',
    action: 'STUDENT_ENROLLED',
    severity: 'INFO',
    summary: 'Completed new CBSE OASIS admission for Scholar Vivaan Joshi into Class 1 - Section A.',
    details: { scholar_name: 'Vivaan Joshi', class: 'Class 1 - A', roll_no: 29 },
    targetId: 'SR-2026-C01-029',
    targetName: 'Vivaan Joshi',
    school_id: 'DPS2026',
    session: '2026-27'
  },
  {
    id: 'AUD-20260831-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    actor: {
      id: 'usr-admin-01',
      name: 'System Security Guard',
      role: 'SECURITY',
      email: 'security@cbse-erp.internal',
      ip: '192.168.1.1'
    },
    module: 'AUTH',
    action: 'SECURITY_LOGIN_SUCCESS',
    severity: 'SECURITY',
    summary: 'Super Administrator signed in with 2FA verification from authorized static subnet.',
    details: { auth_mode: 'PIN_2FA', device: 'Chrome on Windows 11' },
    school_id: 'DPS2026',
    session: '2026-27'
  }
];

// Helper to load audit logs from file
export function getAuditLogs(options?: {
  module?: string;
  severity?: string;
  search?: string;
  limit?: number;
}): AuditLogEntry[] {
  try {
    let logs: AuditLogEntry[] = [];

    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const content = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
      logs = JSON.parse(content);
    } else {
      logs = [...DEFAULT_AUDIT_LOGS];
      saveAllLogs(logs);
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      logs = [...DEFAULT_AUDIT_LOGS];
      saveAllLogs(logs);
    }

    // Apply filtering
    if (options?.module && options.module !== 'ALL') {
      logs = logs.filter(l => l.module === options.module);
    }

    if (options?.severity && options.severity !== 'ALL') {
      logs = logs.filter(l => l.severity === options.severity);
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      logs = logs.filter(l =>
        l.summary.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.actor.name.toLowerCase().includes(q) ||
        l.actor.role.toLowerCase().includes(q) ||
        (l.targetName && l.targetName.toLowerCase().includes(q)) ||
        (l.targetId && l.targetId.toLowerCase().includes(q))
      );
    }

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  } catch (error) {
    console.error('[AuditLogger] Error reading audit logs:', error);
    return DEFAULT_AUDIT_LOGS;
  }
}

// Save all logs to JSON file
function saveAllLogs(logs: AuditLogEntry[]): boolean {
  try {
    const dir = path.dirname(AUDIT_LOGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[AuditLogger] Error saving audit logs file:', err);
    return false;
  }
}

// Append new audit entry
export function logAuditEvent(entry: {
  actor?: { id?: string; name: string; role: string; email?: string; ip?: string };
  module: AuditLogEntry['module'];
  action: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
  summary: string;
  details?: Record<string, any>;
  targetId?: string;
  targetName?: string;
  school_id?: string;
  session?: string;
}): AuditLogEntry {
  const currentLogs = getAuditLogs();

  const newLog: AuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    actor: entry.actor || {
      id: 'admin_active',
      name: 'Dr. Rajesh Sharma',
      role: 'PRINCIPAL',
      ip: '127.0.0.1'
    },
    module: entry.module,
    action: entry.action.toUpperCase(),
    severity: entry.severity || 'INFO',
    summary: entry.summary,
    details: entry.details || {},
    targetId: entry.targetId,
    targetName: entry.targetName,
    school_id: entry.school_id || 'DPS2026',
    session: entry.session || '2026-27'
  };

  const updatedLogs = [newLog, ...currentLogs];
  
  // Keep max 5,000 entries in local store to prevent unbounded growth
  if (updatedLogs.length > 5000) {
    updatedLogs.length = 5000;
  }

  saveAllLogs(updatedLogs);
  return newLog;
}

// Convert audit logs to CSV string for compliance download
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = ['Log ID', 'Timestamp', 'Operator Name', 'Role', 'Module', 'Action', 'Severity', 'Summary', 'Target ID', 'Target Name', 'IP Address', 'JSON Details'];
  
  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.actor.name.replace(/"/g, '""')}"`,
    `"${l.actor.role}"`,
    `"${l.module}"`,
    `"${l.action}"`,
    `"${l.severity}"`,
    `"${l.summary.replace(/"/g, '""')}"`,
    `"${l.targetId || ''}"`,
    `"${(l.targetName || '').replace(/"/g, '""')}"`,
    `"${l.actor.ip || '127.0.0.1'}"`,
    `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
