import * as XLSX from 'xlsx';
import type { VehicleRecord } from '../types/vehicle-record.types';
import type { NotificationLog } from '../types/notification.types';

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
  XLSX.writeFile(wb, `${filename}.xlsx`);
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
  a.download = `${filename}.csv`;
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
    { wch: 40 }, { wch: 40 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Records');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV(records: VehicleRecord[], filename = 'vehicle-records') {
  const rows = records.map(toRow);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const csv  = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
