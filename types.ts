
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
