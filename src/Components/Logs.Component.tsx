import React, { useState, useEffect } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';
import { TableHead, TableBody, DataTableRow, DataTableCell, DataTable, DataTableColumnHeader, ModalProps } from '@dhis2/ui';
import { Log } from '../model/Log.model';

const logsQuery = {
    logs: {
        resource: 'dataStore/Dhis2-MFRLogging',
        params: {
            fields: '.',
            order: 'id:asc',
            paging: true,
        },
    },
};

const Logs = () => {
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

    return (
        <div>
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
                        <DataTableRow key={log.id}>
                            <DataTableCell>{log.timestamp}</DataTableCell>
                            <DataTableCell>{log.logType}</DataTableCell>
                            <DataTableCell>{log.username}</DataTableCell>
                            <DataTableCell>{log.message}</DataTableCell>
                        </DataTableRow>
                    ))}
                </TableBody>
            </DataTable>
        </div>
    );
};

export default Logs;
