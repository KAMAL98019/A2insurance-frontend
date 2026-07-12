import * as XLSX from 'xlsx';
import type { VehicleRecord } from '../types/vehicle-record.types';
import type { NotificationLog } from '../types/notification.types';
import type { HealthInsuranceRecord } from '../types/health-insurance.types';
import type { FireInsuranceRecord } from '../types/fire-insurance.types';
import type { LabourInsuranceRecord } from '../types/labour-insurance.types';

function withDate(filename: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${filename}-${date}`;
}

const NOTIF_TYPE_LABEL: Record<string, string> = {
  EXPIRY_30:    '30-Day Alert',
  EXPIRY_15:    '15-Day Alert',
  EXPIRY_7:     '7-Day Alert',
  EXPIRY_TODAY: 'Expires Today',
  EXPIRED:      'Expired Alert',
  RENEWED:      'Renewal Alert',
  MANUAL:       'Manual',
};

function logToRow(log: NotificationLog, idx: number) {
  return {
    'S.No':    idx + 1,
    'Sent At': new Date(log.sentAt).toLocaleString('en-IN'),
    'Vehicle': log.vehicleRecord?.vehicleNumber ?? '-',
    'Owner':   log.vehicleRecord?.ownerName     ?? '-',
    'Mobile':  log.mobileNumber,
    'Type':    NOTIF_TYPE_LABEL[log.notificationType] ?? log.notificationType,
    'Status':  log.status,
    'Message': log.message,
  };
}

export function exportLogsToExcel(logs: NotificationLog[], filename = 'notification-logs') {
  const rows = logs.map(logToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  ws['!cols'] = [
    { wch: 6 }, { wch: 20 }, { wch: 14 }, { wch: 20 },
    { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Notification Logs');
  XLSX.writeFile(wb, `${withDate(filename)}.xlsx`);
}

export function exportLogsToCSV(logs: NotificationLog[], filename = 'notification-logs') {
  const rows = logs.map(logToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const csv  = XLSX.utils.sheet_to_csv(ws);
  // UTF-8 BOM (﻿) tells Excel to read the file as UTF-8, preserving Tamil characters
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${withDate(filename)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function toRow(r: VehicleRecord, idx: number) {
  return {
    'S.No':              idx + 1,
    'Vehicle Number':    r.vehicleNumber,
    'Owner Name':        r.ownerName,
    'Cell Number':       r.cellNumber,
    'Category':          r.category,
    'Policy Expiry':     new Date(r.policyExpiryDate).toLocaleDateString('en-IN'),
    'Insurance Company': r.insuranceCompany,
    'RC Document':       r.rcDocument       ?? '',
    'Insurance Doc':     r.insuranceDocument ?? '',
    'Aadhaar Doc':       r.aadhaarDocument   ?? '',
    'PAN Doc':           r.panDocument       ?? '',
    'Photo':             r.photo             ?? '',
    'Remarks':           r.remarks           ?? '',
    'Created At':        new Date(r.createdAt).toLocaleDateString('en-IN'),
  };
}

export function exportToExcel(records: VehicleRecord[], filename = 'vehicle-records') {
  const rows = records.map(toRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();

  // Column widths
  ws['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 12 },
    { wch: 16 }, { wch: 22 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
    { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Records');
  XLSX.writeFile(wb, `${withDate(filename)}.xlsx`);
}

export function exportToCSV(records: VehicleRecord[], filename = 'vehicle-records') {
  const rows = records.map(toRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const csv  = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${withDate(filename)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Health Insurance ────────────────────────────────────────────────────────────

function healthToRow(r: HealthInsuranceRecord, idx: number) {
  return {
    'S.No':               idx + 1,
    'Policy Number':      r.policyNumber,
    'Insurance Company':  r.insuranceCompanyName,
    'Policy Holder':      r.policyHolderName,
    'Mobile':             r.mobileNumber,
    'Email':              r.email             ?? '',
    'Date of Birth':      r.dateOfBirth       ? new Date(r.dateOfBirth).toLocaleDateString('en-IN') : '',
    'Gender':             r.gender            ?? '',
    'Address':            r.address           ?? '',
    'Policy Type':        r.policyType,
    'Start Date':         new Date(r.policyStartDate).toLocaleDateString('en-IN'),
    'End Date':           new Date(r.policyEndDate).toLocaleDateString('en-IN'),
    'Renewal Date':       new Date(r.renewalDate).toLocaleDateString('en-IN'),
    'Status':             r.policyStatus,
    'Sum Insured':        r.sumInsured,
    'Premium Amount':     r.premiumAmount,
    'Payment Mode':       r.paymentMode       ?? '',
    'Customer Type':      r.customerType,
    'Lead Source':        r.leadSource        ?? '',
    'Nominee Name':       r.nomineeName       ?? '',
    'Nominee Relation':   r.nomineeRelationship ?? '',
    'Nominee Mobile':     r.nomineeMobileNumber ?? '',
    'Remarks':            r.remarks           ?? '',
    'Created At':         new Date(r.createdAt).toLocaleDateString('en-IN'),
  };
}

export function exportHealthToExcel(records: HealthInsuranceRecord[], filename = 'health-insurance') {
  const rows = records.map(healthToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  ws['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 14 },
    { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 28 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
    { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Health Insurance');
  XLSX.writeFile(wb, `${withDate(filename)}.xlsx`);
}

export function exportHealthToCSV(records: HealthInsuranceRecord[], filename = 'health-insurance') {
  const rows = records.map(healthToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const csv  = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${withDate(filename)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Fire Insurance ──────────────────────────────────────────────────────────────

function fireToRow(r: FireInsuranceRecord, idx: number) {
  return {
    'S.No':               idx + 1,
    'Policy Number':      r.policyNumber,
    'Insurance Company':  r.insuranceCompanyName,
    'Insured Name':       r.insuredName,
    'Mobile':             r.mobileNumber,
    'Email':              r.email          ?? '',
    'Address':            r.address        ?? '',
    'GST Number':         r.gstNumber      ?? '',
    'Business Type':      r.businessType   ?? '',
    'Start Date':         new Date(r.policyStartDate).toLocaleDateString('en-IN'),
    'End Date':           new Date(r.policyEndDate).toLocaleDateString('en-IN'),
    'Renewal Date':       new Date(r.renewalDate).toLocaleDateString('en-IN'),
    'Status':             r.policyStatus,
    'Sum Insured':        r.sumInsured,
    'Net Premium':        r.netPremium,
    'CGST':               r.cgst           ?? '',
    'SGST':               r.sgst           ?? '',
    'Stamp Duty':         r.stampDuty      ?? '',
    'Total Premium':      r.totalPremium,
    'Receipt Number':     r.receiptNumber  ?? '',
    'Receipt Date':       r.receiptDate    ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '',
    'Agent Name':         r.agentName      ?? '',
    'Agent Code':         r.agentCode      ?? '',
    'Financier':          r.financierName  ?? '',
    'Customer Type':      r.customerType,
    'Lead Source':        r.leadSource     ?? '',
    'Remarks':            r.remarks        ?? '',
    'Created At':         new Date(r.createdAt).toLocaleDateString('en-IN'),
  };
}

export function exportFireToExcel(records: FireInsuranceRecord[], filename = 'fire-insurance') {
  const rows = records.map(fireToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  ws['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 14 },
    { wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
    { wch: 16 }, { wch: 28 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Fire Insurance');
  XLSX.writeFile(wb, `${withDate(filename)}.xlsx`);
}

export function exportFireToCSV(records: FireInsuranceRecord[], filename = 'fire-insurance') {
  const rows = records.map(fireToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const csv  = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${withDate(filename)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Labour Insurance ────────────────────────────────────────────────────────────

function labourToRow(r: LabourInsuranceRecord, idx: number) {
  return {
    'S.No':                 idx + 1,
    'Policy Number':        r.policyNumber,
    'Insurance Company':    r.insuranceCompanyName,
    'Insured Name':         r.insuredName,
    'Mobile':               r.mobileNumber,
    'Email':                r.email                 ?? '',
    'Address':              r.address               ?? '',
    'Business Description': r.businessDescription   ?? '',
    'GST Number':           r.gstNumber             ?? '',
    'Intermediary Code':    r.intermediaryCode       ?? '',
    'Intermediary Name':    r.intermediaryName       ?? '',
    'Start Date':           new Date(r.policyStartDate).toLocaleDateString('en-IN'),
    'End Date':             new Date(r.policyEndDate).toLocaleDateString('en-IN'),
    'Renewal Date':         new Date(r.renewalDate).toLocaleDateString('en-IN'),
    'Status':               r.policyStatus,
    'No. of Employees':     r.numberOfEmployees     ?? '',
    'Wages Per Employee':   r.wagesPerEmployee      ?? '',
    'Total Declared Wages': r.totalDeclaredWages    ?? '',
    'Premium':              r.premium,
    'CGST':                 r.cgst                  ?? '',
    'SGST':                 r.sgst                  ?? '',
    'Total Premium':        r.totalPremium,
    'Receipt Number':       r.receiptNumber         ?? '',
    'Receipt Date':         r.receiptDate           ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '',
    'Labour Policy Type':   r.labourPolicyType,
    'Customer Type':        r.customerType,
    'Lead Source':          r.leadSource            ?? '',
    'Remarks':              r.remarks               ?? '',
    'Created At':           new Date(r.createdAt).toLocaleDateString('en-IN'),
  };
}

export function exportLabourToExcel(records: LabourInsuranceRecord[], filename = 'labour-insurance') {
  const rows = records.map(labourToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  ws['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 14 },
    { wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 18 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 10 },
    { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
    { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Labour Insurance');
  XLSX.writeFile(wb, `${withDate(filename)}.xlsx`);
}

export function exportLabourToCSV(records: LabourInsuranceRecord[], filename = 'labour-insurance') {
  const rows = records.map(labourToRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const csv  = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${withDate(filename)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
