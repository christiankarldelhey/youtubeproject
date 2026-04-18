import { getAlertById, listAlerts, type AlertRecord } from '../db/repositories/alerts.repository.js';

export type ListAlertsInput = {
  provider?: string;
  limit: number;
  offset: number;
};

export async function getAlerts(input: ListAlertsInput): Promise<AlertRecord[]> {
  return listAlerts(input);
}

export async function getAlert(id: number): Promise<AlertRecord | null> {
  return getAlertById(id);
}
