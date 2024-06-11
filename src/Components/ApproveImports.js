import React, { useState, useEffect } from 'react';
import { useDataMutation, useDataQuery, useAlert } from '@dhis2/app-runtime';
import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, TableBody, TableHead } from '@dhis2/ui';
import classes from '../App.module.css';
import { generateId } from '../functions/helpers';

const configurationsQuery = {
    configurations: {
        resource: 'dataStore/Dhis2-MFR',
        params: {
            fields: 'name,Key', 
            paging: false,
        },
    },
};

const approvalStatusQuery = {
    approvalStatus: {
        resource: 'dataStore/Dhis2-MFRApproval',
        params: {
            fields: 'Key,name,parent,change,changeTo,approvalStatus',
            paging: false,
        },
    },
};

const updateApprovalStatusMutation = {
    resource: 'dataStore/Dhis2-MFRApproval',
    type: 'update',
    id: ({ key }) => key,
    data: ({ approvalStatus, name, parent, change, changeTo }) => ({
        approvalStatus,
        name,
        parent,
        change,
        changeTo
    }),
};

const ApproveImports = () => {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [refreshLogs, setRefreshLogs] = useState(false);
    const [filterValue, setFilterValue] = useState('');
    const { loading: loadingConfigs, error: errorConfigs, data: dataConfigs } = useDataQuery(configurationsQuery);
    const { loading: loadingStatus, error: errorStatus, data: dataStatus, refetch } = useDataQuery(approvalStatusQuery);
    const [mutate] = useDataMutation(updateApprovalStatusMutation);
    const successAlert = useAlert('Approval status updated successfully!', { duration: 3000 });
    const errorAlert = useAlert('Failed to update approval status', { critical: true });

    useEffect(() => {
        if (dataConfigs && dataStatus) {
            console.log('Configurations:', dataConfigs.configurations);
            console.log('Approval Status:', dataStatus.approvalStatus);

            const pending = dataConfigs.configurations.map(config => {
                const status = dataStatus.approvalStatus.find(status => status.key === config.key);
                const key = config.key || generateId(11); 
                return {
                    ...config,
                    key,
                    approvalStatus: status ? status.approvalStatus : 'pending',
                    parent: status?.parent || '',
                    change: status?.change || '',
                    changeTo: status?.changeTo || ''
                };
            });
            setPendingApprovals(pending);
        }
    }, [dataConfigs, dataStatus]);

    const handleApproval = async (status, config) => {
        console.log("Config inside handleApproval:", config);
        const key = config.key; 
        if (!key) {
            console.error("Invalid key:", key);
            return;
        }

        try {
            await mutate({
                key,
                approvalStatus: status,
                name: config.name,
                parent: config.parent,
                change: config.change,
                changeTo: config.changeTo
            });
            console.log('Mutation successful!');

            setPendingApprovals(prev =>
                prev.map(c => (c.key === config.key ? { ...c, approvalStatus: status } : c))
            );

            setShowLogs(true);
            successAlert.show();
            refetch();
            setRefreshLogs(prev => !prev);
        } catch (error) {
            console.error('Error updating approval status:', error);
            errorAlert.show();
        }
    };

    const filteredApprovals = pendingApprovals.filter(config =>
        config.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.parent.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.change.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.changeTo.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.approvalStatus.toLowerCase().includes(filterValue.toLowerCase())
    );

    const handleFilterChange = event => {
        setFilterValue(event.target.value);
    };

    if (loadingConfigs || loadingStatus) return <span>Loading...</span>;
    if (errorConfigs || errorStatus) return <span>ERROR: {errorConfigs?.message || errorStatus?.message}</span>;
    if (!dataConfigs || !dataStatus) return <span>No configurations available</span>;

    return (
        <div className={classes.container}>
            <h1>Pending Imports</h1>
            <input className={classes.searchbar}
                type="text"
                placeholder="Search..."
                value={filterValue}
                onChange={handleFilterChange}
            />
            <DataTable>
                <TableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>
                            Name
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            Parent
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            Change
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            Change To
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            Approval Status
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>Reject</DataTableColumnHeader>
                        <DataTableColumnHeader>Approve</DataTableColumnHeader>
                    </DataTableRow>
                </TableHead>
                <TableBody>
                    {filteredApprovals.map((config, index) => (
                        <DataTableRow key={config.key}>
                            <DataTableCell>{config.name}</DataTableCell>
                            <DataTableCell>{config.parent}</DataTableCell>
                            <DataTableCell>{config.change}</DataTableCell>
                            <DataTableCell>{config.changeTo}</DataTableCell>
                            <DataTableCell>{config.approvalStatus}</DataTableCell>
                            <DataTableCell>
                                <Button secondary onClick={() => handleApproval('rejected', config)}>
                                    Reject
                                </Button>
                            </DataTableCell>
                            <DataTableCell>
                                <Button primary onClick={() => handleApproval('approved', config)}>
                                    Approve
                                </Button>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </TableBody>
            </DataTable>
          </div>
    );
};

export default ApproveImports;
