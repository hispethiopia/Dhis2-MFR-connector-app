import React, { useState, useEffect } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';
import { TableHead, TableBody, DataTableRow, DataTableCell, DataTable, DataTableColumnHeader, ModalProps } from '@dhis2/ui';
import { Log } from '../model/Log.model';

const logsQuery = {
    logs: {
        resource: 'dataStore/Dhis2-MFRLogging',
        params: {
            fields: '.',
            order: 'id:desc',
            paging: true,
        },
    },
};

const Logs = () => {

    const css =
        `
.error-row {
    background-color: #ffcccc !important; /* Light red for errors */
}

.log-row {
    background-color: #fff4e5 !important; /* Light orange for log */
}

.success-row {
    background-color: #e6f7ff !important; /* Light blue for success */
}
    `

    const [logs, setLogs] = useState<Log[]>();
    const { loading, error, data, refetch } = useDataQuery(logsQuery, { lazy: true });

    useEffect(() => {
        refetch();
    }, [refetch]);

    useEffect(() => {
        if (data && data.logs) {
            setLogs(data.logs.entries.map(item => item.value));
        }
    }, [data]);

    if (loading) return <span>Loading logs...</span>;
    if (error) return <span>Error fetching logs: {error.message}</span>;


    const getRowStyle = (logType) => {
        switch (logType) {
            case 'Error':
                return 'error-row';
            case 'Log':
                return 'log-row';
            case 'Success':
                return 'success-row';
            default: return ''
        }
    }

    return (
        <div>
            <style>
                {css}
            </style>
            <h2>Logs</h2>
            <DataTable>
                <TableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>Time</DataTableColumnHeader>
                        <DataTableColumnHeader>Type</DataTableColumnHeader>
                        <DataTableColumnHeader>Username</DataTableColumnHeader>
                        <DataTableColumnHeader>message</DataTableColumnHeader>
                    </DataTableRow>
                </TableHead>
                <TableBody>
                    {logs?.map(log => (
                        <DataTableRow key={log.id} className={getRowStyle(log.logType)}>
                            <DataTableCell className={getRowStyle(log.logType)}>{log.timestamp}</DataTableCell>
                            <DataTableCell className={getRowStyle(log.logType)}>{log.logType}</DataTableCell>
                            <DataTableCell className={getRowStyle(log.logType)}>{log.username}</DataTableCell>
                            <DataTableCell className={getRowStyle(log.logType)}>{log.message}</DataTableCell>
                        </DataTableRow>
                    ))}
                </TableBody>
            </DataTable>
        </div>
    );
};

export default Logs;
