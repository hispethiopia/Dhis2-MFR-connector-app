// import { Button, ButtonStrip, Checkbox, InputField, Modal, ModalActions, ModalContent, ModalTitle } from '@dhis2/ui';
// import React from 'react'
// import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
// import { FullScreenLoader } from './FullScreenLoader';

// const query = {
//     settings: {
//         resource: 'dataStore/Dhis2-MFR/settings',
//         params: {
//             fields: 'name,Key',
//             paging: false,
//         },
//     rejectedList :{
//         resource: 'dataStore/Dhis2-MFR/rejectedList',
//     }
//     },
// }

// const createMutation = {
//     type: 'update',
//     resource: 'dataStore/Dhis2-MFR/settings',
//     data: ({ data }) => data
// }

// const deleteApprovalMutation = {
//     type: 'delete',
//     resource: 'dataStore/Dhis2-MFRApproval',
//     id: ({ id }) => id, // Specify the ID to delete from the Dhis2-MFRApproval namespace
// }
// const updateRejectedListMutation = {
//     type: 'update',
//     resource: 'dataStore/Dhis2-MFR/rejectedList',
//     data: ({ updatedList }) => updatedList, // Update the rejectedList
// }

// export const SettingsPage: React.FC = () => {


//     const { loading, error, data, refetch, called } = useDataQuery(query)
//     const settings = data ? data.settings : null;
//     const [mutate, { loading: saving, error: saveError }] = useDataMutation(createMutation)
//     const rejectedList = data ? data.rejectedList : []; // Get the rejectedList from the Dhis2-MFR namespace

//     const [deleteApproval, { loading: deletingApproval, error: deleteApprovalError }] = useDataMutation(deleteApprovalMutation)
//     const [updateRejectedList, { loading: updatingRejectedList, error: updateRejectedListError }] = useDataMutation(updateRejectedListMutation)

//     const handleCleanUpRejectedList = async () => {
//         if (rejectedList && Array.isArray(rejectedList)) {
//             // Loop through each entry in the rejectedList and remove the corresponding approval from Dhis2-MFRApproval namespace
//             for (let entry of rejectedList) {
//                 const id = entry.split('_')[0]; // Extract the ID (before the underscore)
//                 await deleteApproval({ id });
//             }

//             // After all deletions, clear the rejectedList
//             await updateRejectedList({ updatedList: [] });

//             // Refetch data to update the UI
//             await refetch();
//         }
//     }
//     return (
//         <>
//             {(loading || saving  || deletingApproval || updatingRejectedList ) && <FullScreenLoader />}
//             {!loading && !deletingApproval && !updatingRejectedList &&
//                 <div>
//                     <br />
//                     <br />
//                     <Button>
//                         Clean up Logs
//                     </Button>
//                     <br />
//                     <br />
//                     <Button>
//                         Clean up Messages
//                     </Button>
//                     <br />
//                     <br />
//                     <Button onClick={() => handleCleanUpRejectedList()}>
//                         Clean up rejected List
//                     </Button>
//                     <br />
//                     <br />
//                     <Checkbox label="Enable OrgUnit creations." checked={settings?.enableCreation}
//                         onChange={async (value) => {
//                             await mutate({
//                                 data:
//                                     settings ? { ...settings, enableCreation: value.checked } : { enableCreation: value.checked }
//                             })
//                             await refetch();
//                         }}>
//                     </Checkbox>
//                 </div >
//             }
//         </>
//     )
// }
import { Button, Checkbox } from '@dhis2/ui';
import React from 'react';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { FullScreenLoader } from './FullScreenLoader';

const query = {
    settings: {
        resource: 'dataStore/Dhis2-MFR/settings',
    },
    rejectedList: {
        resource: 'dataStore/Dhis2-MFR/rejectedList',
    },
};

const createMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFR/settings',
    data: ({ data }) => data,
};

const deleteApprovalMutation = {
    type: 'delete',
    resource: 'dataStore/Dhis2-MFRApproval',
    id: ({ id }) => id, 
};

const updateRejectedListMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFR/rejectedList',
    data: ({ updatedList }) => updatedList, 
};


export const SettingsPage: React.FC = () => {
    const { loading, error, data, refetch } = useDataQuery(query);
    const settings = data?.settings || null;
    const rejectedList = data?.rejectedList || [];

    const [mutate, { loading: saving }] = useDataMutation(createMutation);
    const [deleteApproval, { loading: deletingApproval }] = useDataMutation(deleteApprovalMutation);
    const [updateRejectedList, { loading: updatingRejectedList }] = useDataMutation(updateRejectedListMutation);

    const handleCleanUpRejectedList = async () => {
        if (rejectedList && Array.isArray(rejectedList)) {
            try {
                const currentDate = new Date();
                const THIRTY_DAYS_AGO = new Date();
                THIRTY_DAYS_AGO.setDate(currentDate.getDate() - 30);

                const entriesToDelete = rejectedList.filter(entry => {
                    const timestamp = entry.split('_')[1]; 
                    const entryDate = new Date(timestamp);
                    return entryDate < THIRTY_DAYS_AGO;
                });

                const remainingRejectedList = rejectedList.filter(entry => {
                    const timestamp = entry.split('_')[1];
                    const entryDate = new Date(timestamp);
                    return entryDate >= THIRTY_DAYS_AGO; 
                });

                await updateRejectedList({ updatedList: remainingRejectedList });

                for (let entry of entriesToDelete) {
                    const id = entry.split('_')[0]; 
                    
                    await deleteApproval({ id });
                }

                await refetch();
            } catch (error) {
                console.error('Error cleaning up rejected list and approvals:', error);
            }
        }
    };

    return (
        <>
            {(loading || saving || deletingApproval || updatingRejectedList) && <FullScreenLoader />}
            {!loading && !deletingApproval && !updatingRejectedList && (
                <div>
                    <br />
                    <br />
                    <Button>Clean up Logs</Button>
                    <br />
                    <br />
                    <Button>Clean up Messages</Button>
                    <br />
                    <br />
                    <Button onClick={() => handleCleanUpRejectedList()}>
                        Clean up rejected List before 30 days
                    </Button>
                    <br />
                    <br />
                    <Checkbox
                        label="Enable OrgUnit creations."
                        checked={settings?.enableCreation}
                        onChange={async (value) => {
                            await mutate({
                                data: settings
                                    ? { ...settings, enableCreation: value.checked }
                                    : { enableCreation: value.checked },
                            });
                            await refetch();
                        }}
                    />
                </div>
            )}
        </>
    );
};
