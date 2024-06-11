import React, { useState, useEffect } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';
import { TableHead, TableBody, DataTableRow, DataTableCell ,DataTable, DataTableColumnHeader } from '@dhis2/ui';

const logsQuery = {
    logs: {
        resource: 'dataStore/Dhis2-MFRApproval',
        params: {
            fields: 'timestamp,message,key,name,Key,approvalStatus',
            order: 'timestamp:asc',
            paging: false,
        },
    },
};

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const { loading, error, data, refetch } = useDataQuery(logsQuery, { lazy: true });

    useEffect(() => {
        refetch();
    }, [refetch]);

    useEffect(() => {
        if (data && data.logs) {
            setLogs(data.logs);
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
                        <DataTableColumnHeader>Timestamp</DataTableColumnHeader>
                        <DataTableColumnHeader>Name</DataTableColumnHeader>
                        <DataTableColumnHeader>status</DataTableColumnHeader>
                    </DataTableRow>
                </TableHead>
                <TableBody>
                    {logs.map(log => (
                        <DataTableRow key={log.timestamp}>
                                                
                            <DataTableCell>{new Date(log.timestamp).toLocaleString()}</DataTableCell>
                            <DataTableCell>{log.name}</DataTableCell> 
                            <DataTableCell>{log.approvalStatus}</DataTableCell>
                        </DataTableRow>
                    ))}
                </TableBody>
            </DataTable>
        </div>
    );
};

export default Logs;
