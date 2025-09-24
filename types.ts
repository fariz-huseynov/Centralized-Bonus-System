
export enum WorkArea {
  Intake = 'Intake',
  Refurb = 'Refurb',
  Picking = 'Picking',
  Packing = 'Packing',
  Shipping = 'Shipping',
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  bonusNumber: string;
  payrollNumber: string;
  workAreas: WorkArea[];
  photo: string; // base64 data URL
  faceEmbedding: number[];
}

export interface AuditLog {
  id: string;
  employeeId: string;
  employeeName: string;
  action: string;
  timestamp: Date;
}

export interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- NEW TYPES FOR MENU/ROLES ---
export enum Permission {
  ManageEmployees = 'Manage Employees',
  ViewAnalytics = 'View Analytics',
  EditSettings = 'Edit Settings',
  ManageRoles = 'Manage Roles',
  GenerateAuditLogs = 'Generate Audit Logs',
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
  };
}