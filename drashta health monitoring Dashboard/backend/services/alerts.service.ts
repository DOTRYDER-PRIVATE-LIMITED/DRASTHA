import { getAlertHistory, resolveActiveAlert, DbAlertRow } from '../../database/queries/alerts.queries.js';

export async function fetchAlertLogs(limit = 50): Promise<DbAlertRow[]> {
    return await getAlertHistory(limit);
}

export async function resolveAlert(alertType: string, deviceId = 'NTPC_SENSOR_BOX_01'): Promise<boolean> {
    return await resolveActiveAlert(alertType, deviceId);
}
