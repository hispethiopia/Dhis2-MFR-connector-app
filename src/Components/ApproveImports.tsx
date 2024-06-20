import React, { useState, useContext } from 'react';
import { useDataMutation, useAlert } from '@dhis2/app-runtime';
import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, TableBody, TableHead } from '@dhis2/ui';
import { mfrObjects, prepareOrganizationsObject } from '../functions/services';
import { MFRMapped } from '../model/MFRMapped.model';
import { MetadataContext } from '../App';

const approvalStatusQuery = {
    approvalStatus: {
        resource: 'dataStore/Dhis2-MFRApproval',
        params: {
            fields: 'Key,name,parent,change,changeTo,approvalStatus',
            paging: false,
        },
    },
};

const createOrganizationMutation = {
    resource: 'organisationUnits',
    type: 'create',
    data: ({ data }) => data
}

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
    const [pendingApprovals, setPendingApprovals] = useState<MFRMapped[]>(mfrObjects);
    const metadata = useContext(MetadataContext)
    const [showLogs, setShowLogs] = useState(false);
    const [refreshLogs, setRefreshLogs] = useState(false);
    const [filterValue, setFilterValue] = useState('');
    const [mutate] = useDataMutation(createOrganizationMutation);
    const successAlert = useAlert('Approval status updated successfully!', { duration: 3000 });
    const errorAlert = useAlert('Failed to update approval status', { critical: true });

    console.log("Melaeke mfr objects are ", mfrObjects, metadata)

    /*useEffect(() => {
        if (metadata && dataStatus) {

            const pending = metadata.configurations.map(config => {
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
    }, [metadata, dataStatus]);*/

    const handleApproval = async (mfrObject: MFRMapped) => {
        console.log("Config inside handleApproval:", mfrObject);
        const key = mfrObject.mfrId;
        if (!key) {
            console.error("Invalid key:", key);
            return;
        }

        try {

            //Prepare the DHIS2 object based on configurations.
            let organizations = prepareOrganizationsObject(
                metadata?.configurations,
                mfrObject,
                "b3aCK1PTn5S"
            )

            console.log("About to mutate orgUnits to send is ", organizations)

            await mutate({//Here change the key of the mutate to path.
                //First check if the parent ID exists.
                key,
                data: organizations
            });
            console.log('Mutation successful!');
            /*
                        setPendingApprovals(prev =>
                            prev.map(c => (c.key === config.key ? { ...c, approvalStatus: status } : c))
                        );
            
                        setShowLogs(true);
                        successAlert.show();
                        refetch();
                        setRefreshLogs(prev => !prev);*/
        } catch (error) {
            console.error('Error updating approval status:', error);
            errorAlert.show();
        }
    };

    /*const filteredApprovals = pendingApprovals.filter(config =>
        config.name.toLowerCase().includes(filterValue.toLowerCase()) /*||
        /*config.parent.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.change.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.changeTo.toLowerCase().includes(filterValue.toLowerCase()) ||
        config.approvalStatus.toLowerCase().includes(filterValue.toLowerCase())
    );*/

    const handleFilterChange = event => {
        setFilterValue(event.target.value);
    };

    /*if (loadingMetadata || loadingStatus) return <span>Loading...</span>;
    if (errorMetadata || errorStatus) return <span>ERROR: {errorMetadata?.message || errorStatus?.message}</span>;
    if (!metadata || !dataStatus) return <span>No configurations available</span>;
*/
    return (
        <div className='container'>
            <h1>Pending Imports</h1>
            <input className='searchbar'
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
                    {pendingApprovals.map((pendingApproval, index) => (
                        <DataTableRow key={pendingApproval.mfrId}>
                            <DataTableCell>{pendingApproval.name}</DataTableCell>
                            <DataTableCell>{pendingApproval.lastUdated}</DataTableCell>
                            <DataTableCell>{pendingApproval.FT}</DataTableCell>
                            <DataTableCell>{"Create"}</DataTableCell>
                            <DataTableCell>{"Not Approved"}</DataTableCell>
                            <DataTableCell>
                                <Button secondary onClick={() => handleApproval(pendingApproval)}>
                                    Reject
                                </Button>
                            </DataTableCell>
                            <DataTableCell>
                                <Button primary onClick={() => handleApproval(pendingApproval)}>
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
