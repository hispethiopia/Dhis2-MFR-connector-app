import React, { useState, useContext, useEffect } from 'react';
import { useDataMutation, useAlert, useDataQuery } from '@dhis2/app-runtime';
import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, Switch, TableBody, TableHead } from '@dhis2/ui';
import { getApplicableConfigurations, remapAttributeValues, remapMFR, remapUsingId } from '../functions/services';
import { MFRMapped } from '../model/MFRMapped.model';
import { MetadataContext } from '../App';
import { CHANGE_TYPE_CREATE, CHANGE_TYPE_UPDATE, MFR_LOCATION_CODE, MFR_LOCATION_ATTRIBUTE_UID } from '../functions/constants';
import { CategoryOption, DataSet, OrganisationUnitGroup } from '../model/Metadata.model';
import { AffectedValues, AllChange, ChangeType, FetchedObjects, User, UserChange } from '../model/Approvals.model';
import { UserConfig } from '../model/Configuration.model';
import { ConfirmApproveModal } from './ConfirmApproveModal';
import { FullScreenLoader } from './FullScreenLoader';

const pendingApprovalsQuery = {
    approvalStatus: {
        resource: 'dataStore/Dhis2-MFRApproval',
        params: {
            fields: '.',
            paging: false,
        },
    },
};

const rejectedListQuery = {
    rejectedList: {
        resource: 'dataStore/Dhis2-MFR/rejectedList',

    }
}

const uploadRejectedListQuery = {
    resource: 'dataStore/Dhis2-MFR/rejectedList',
    type: 'update',
    data: ({ data }) => data
}

const userOrgUnitQuery = {
    organisationUnits: {
        resource: 'organisationUnits',
        params: ({ orgUnit }) => ({
            filter: "id:in:[" + orgUnit + "]",
            fields: "id,displayName,attributeValues[value,attribute[code]]"
        })
    }
}


const checkOrgUnitUsingMFRIDQuery = {
    organisationUnits: {
        resource: 'organisationUnits',
        params: ({ mfrId }) => ({
            filter: [
                "attributeValues.attribute.id:eq:" + MFR_LOCATION_ATTRIBUTE_UID,
                , "attributeValues.value:in:[" + mfrId + "]"
            ],
            fields: "id,displayName,attributeValues[value,attribute[id,code]]"
        })

    }
}

const usersQuery = {
    users: {
        resource: 'users',
        params: ({ ids }) => ({
            filter: "id:in:[" + ids + "]",
            fields: "*",
            paging: false
        })
    }
}

const userRolesQuery = {
    userRoles: {
        resource: 'userRoles',
        params: ({ ids }) => ({
            filter: "id:in:[" + ids + "]",
            fields: "*",
            paging: false
        })
    }
}

const userGroupsQuery = {
    userGroups: {
        resource: 'userGroups',
        params: ({ ids }) => ({
            filter: "id:in:[" + ids + "]",
            fields: "*",
            paging: false
        })
    }
}

const dataSetsQuery = {
    dataSets: {
        resource: 'dataSets',
        params: ({ ids }) => ({
            filter: "id:in:[" + ids + "]",
            fields: "*",
            paging: false
        })
    }
}

const organisationUnitGroupsQuery = {
    organisationUnitGroups: {
        resource: 'organisationUnitGroups',
        params: ({ ids }) => ({
            filter: "id:in:[" + ids + "]",
            fields: "*",
            paging: false
        })
    }
}

const categoryOptionsQuery = {
    categoryOptions: {
        resource: 'categoryOptions',
        params: ({ ids }) => ({
            filter: "id:in:[" + ids + "]",
            fields: "*",
            paging: false
        })
    }
}


const detailedOrgUnitQuery = {
    organisationUnits: {
        resource: "organisationUnits",
        params: ({ mfrId }) => ({
            filter: [
                "attributeValues.attribute.id:eq:" + MFR_LOCATION_ATTRIBUTE_UID,
                "attributeValues.value:eq:" + mfrId
            ],
            fields: "*,users[id,organisationUnits,username,userGroups[id,displayName],userRoles[id,displayName]],dataSets[id,displayName],organisationUnitGroups[id,displayName]"
        })
    }
}

const categoryOptionsFromOrgUnitQuery = {
    categoryOptions: {
        resource: "categoryOptions",
        params: ({ orgUnitId }) => ({
            filter: "organisationUnits.id:eq:" + orgUnitId,
            fields: "id,displayName"
        })
    }
}


const ApproveImports = () => {
    const metadata = useContext(MetadataContext)
    const [finishedLoading, setFinishedLoading] = useState(false)
    const [pendingApprovals, setPendingApprovals] = useState<MFRMapped[]>();
    const [anyLoading, setAnyLoading] = useState(true);


    let userOrgUnitIds = metadata.me.organisationUnits.map(orgUnit => { return orgUnit.id })
    const { refetch: checkOrgUnitUsingMFRIDRefetch } = useDataQuery(checkOrgUnitUsingMFRIDQuery, { lazy: true })
    const { refetch: organisationUnitDetailedRefetch } = useDataQuery(detailedOrgUnitQuery, { lazy: true })
    const { refetch: getCategoryOptionsFromOrgUnitRefetch } = useDataQuery(categoryOptionsFromOrgUnitQuery, { lazy: true })

    const { refetch: organisationUnitGroupsRefetch } = useDataQuery(organisationUnitGroupsQuery, { lazy: true })
    const { refetch: categoryOptionsRefetch } = useDataQuery(categoryOptionsQuery, { lazy: true })
    const { refetch: dataSetsRefetch } = useDataQuery(dataSetsQuery, { lazy: true })
    const { refetch: usersRefetch } = useDataQuery(usersQuery, { lazy: true })

    const { loading: loadingRejectedList, data: rejectedList, refetch: getRejectedList } = useDataQuery(rejectedListQuery)
    const [uploadRejectedList] = useDataMutation(uploadRejectedListQuery)

    const remappedRejectedList = {}
    if (rejectedList) {
        rejectedList.rejectedList.forEach(item => {
            remappedRejectedList[item] = true;
        })
    }


    const { loading: loadingUserOrgUnits, error: errorUserOrgUnits, data: userOrgUnits } = useDataQuery(userOrgUnitQuery, {
        variables: { orgUnit: userOrgUnitIds }
    })

    const [allChanges, setAllChanges] = useState<AllChange>();
    const [fetchedObjects, setFetchedObjects] = useState<FetchedObjects>();
    const [selectedApproval, setSelectedApproval] = useState<MFRMapped>();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [parentOrgUnitId, setParentOrgUnitId] = useState("");
    const [showRejectedList, setShowRejectedList] = useState(false);


    //fetch the mfr ids of the userOrgUnits to fetch from approval.


    //Get pending approvals from query
    //First get my orgUnit to fetch using the key.

    const [showLogs, setShowLogs] = useState(false);
    const [refreshLogs, setRefreshLogs] = useState(false);
    const [filterValue, setFilterValue] = useState('');


    const successAlert = useAlert('Approval status updated successfully!', { duration: 3000 });
    const errorAlert = useAlert('Failed to update approval status', { critical: true });



    /**
     * TODO: instead of getting all pending approvals and then filtering only those that apply to the user,
     * filter the appprovals from the server that only apply to the user.
     */
    const { loading: loadingPendingApprovals, error: errorPendingApprovals, data: allApprovals, refetch: refetchPendingApprovals } = useDataQuery(pendingApprovalsQuery)

    useEffect(() => {
        const doSequential = async () => {

            setAnyLoading(true);
            //Now all approvals are loaded.
            let userOrgUnitMFRIds: string[] = []
            userOrgUnits.organisationUnits.organisationUnits.forEach(userOrgUnit => {
                userOrgUnit.attributeValues.forEach(attVal => {
                    if (attVal.attribute.code === MFR_LOCATION_CODE) {
                        userOrgUnitMFRIds.push(attVal.value)
                    }
                })
            })

            let mappedApprovals = remapMFR(allApprovals.approvalStatus)
            let finalList: MFRMapped[] = []
            //Now handle PHCUs by creating duplicates for PHCUs, and looking for the parent of the health center.
            mappedApprovals.forEach(approval => {
                if (approval.isPHCU) {
                    //This is a PHCU, therefore we need to handle it's parent PHCU by adding another approval for the PHCU.
                    let phcuApproval: MFRMapped = { ...approval }
                    phcuApproval.mfrId = approval.mfrId + "_PHCU"
                    phcuApproval.facilityId = approval.facilityId + "_PHCU"
                    phcuApproval.mfrCode = approval.mfrCode + "_PHCU"
                    phcuApproval.dhisId = ""
                    //First replace multiple spaces in the name. Not replacing HC with PHCU because just incase hc is not found, PHCU will still be there
                    phcuApproval.name = (phcuApproval.name).replace(/\s+/g, ' ').replace(/health center/gi, '') + "_PHCU"

                    //PHCU approval already has the _PHCU
                    phcuApproval.reportingHierarchyId = phcuApproval.mfrId + "/" +
                        phcuApproval.reportingHierarchyId.split('/').slice(1).join('/')
                    approval.reportingHierarchyId = approval.mfrId + '/' + phcuApproval.reportingHierarchyId

                    phcuApproval.reportingHierarchyName = phcuApproval.name + "/"
                        + phcuApproval.reportingHierarchyName.split('/').slice(1).join('/')
                    approval.reportingHierarchyName = approval.name + "/" + phcuApproval.reportingHierarchyName

                    approval.isPHCU = false;
                    //Push both PHCU approval and approval.
                    finalList.push(phcuApproval)
                }
                finalList.push(approval)
            })
            //Now filter the approvals to only the ones that are applicable for this user only.
            const appropriateApprovals = finalList.filter(approval => {
                return userOrgUnitMFRIds.some(userOrgUnitMFRId => approval.reportingHierarchyId ? approval.reportingHierarchyId.includes(userOrgUnitMFRId) : false)
            });



            //Inorder to do it in chuncks, get orgUnits in chuncks.
            let dhisOrgUnitIds: string[] = []
            for (let approval of appropriateApprovals) {
                dhisOrgUnitIds.push(approval.reportingHierarchyId.split('/')[1])
                if (approval.dhisId && approval.dhisId !== "") {
                    dhisOrgUnitIds.push(approval.mfrId)
                }
            }

            let dhisOrgUnits: any = {}

            for (let i = 0; i < dhisOrgUnitIds.length; i += 50) {
                let ids = dhisOrgUnitIds.slice(i, i + 50);
                let response = await checkOrgUnitUsingMFRIDRefetch({ mfrId: ids.join(',') })
                remapAttributeValues(response.organisationUnits.organisationUnits)

                //Making it object based so that It can be easily found when searching.
                response.organisationUnits.organisationUnits.forEach(orgUnit => {
                    //Mapping both in dhis and mfr for easily finding the objects.
                    dhisOrgUnits[orgUnit.id] = orgUnit
                    dhisOrgUnits[orgUnit.attributeValues[MFR_LOCATION_ATTRIBUTE_UID]] = orgUnit
                })
            }

            for (let approval of appropriateApprovals) {
                //Look for the parent 
                const parentOrgUnit = dhisOrgUnits[approval.reportingHierarchyId.split('/')[1]]

                if (!parentOrgUnit) {
                    approval.error = true;
                    approval.errorMessage = "Org unit's parent is not imported in DHIS2. Parent is: " + approval.reportingHierarchyName.split('/')[1]
                    continue
                }

                //Check if the orgUnit with theDHISid exists and if it is different to that of MFR. 
                if (approval.dhisId && approval.dhisId !== "" && dhisOrgUnits[approval.mfrId] && dhisOrgUnits[approval.mfrId].id !== approval.dhisId) {
                    approval.error = true;
                    approval.errorMessage = `DHIS2 and MFR id imported in DHIS2 doesn't match pending approval. DHIS2_id_from_mfr=${approval.dhisId} while dhis2 id is ${parentOrgUnit.id}`
                    continue
                }
                approval.error = false;

                approval.parentDHISId = parentOrgUnit.id
                approval.parentExists = true;

            }
            setPendingApprovals(appropriateApprovals)
            setFinishedLoading(true)
            setAnyLoading(false)
        }
        if (userOrgUnits && allApprovals && !finishedLoading) {
            doSequential();
        }
    }, [userOrgUnits, allApprovals])


    const getChanges = async (mfrObject: MFRMapped): Promise<AllChange | null> => {
        try {
            const orgUnitResponse = await organisationUnitDetailedRefetch({ mfrId: mfrObject.mfrId })
            let existingOrgUnit = orgUnitResponse.organisationUnits.organisationUnits.length > 0 ? orgUnitResponse.organisationUnits.organisationUnits[0] : null
            let applicableConfigurations = getApplicableConfigurations(metadata.configurations, mfrObject)


            let dataSetsToBeAssigned: string[] = []
            let ougsTobeAssigned: string[] = []
            let catCombosToBeAssigned: string[] = []
            let userConfigsToBeAssigned: UserConfig[] = []

            applicableConfigurations.forEach(conf => {
                catCombosToBeAssigned.push(...conf.categoryOptionCombos);
                dataSetsToBeAssigned.push(...conf.dataSets)
                ougsTobeAssigned.push(...conf.orgUnitGroups)
                userConfigsToBeAssigned.push(...conf.userConfigs)
            });

            //This is objects to unassign from existing orgUnit, if the orgUnit exists already.
            let unasignedObjects: AffectedValues = {
                dataSets: [],
                categoryOptions: [],
                users: [],
                organisationUnitGroups: []
            }
            let unChangedObjects: AffectedValues = {
                dataSets: [],
                categoryOptions: [],
                users: [],
                organisationUnitGroups: []
            }
            let changedUsers: UserChange[] = [];
            if (existingOrgUnit) {
                //Get the metadata that are already assigned and check which one doesn't meet the current criteria.
                existingOrgUnit.dataSets.forEach((ds: DataSet) => {
                    if (!dataSetsToBeAssigned.includes(ds.id)) {
                        unasignedObjects.dataSets.push(ds.id);
                    } else {
                        unChangedObjects.dataSets.push(ds.id)
                    }
                })

                existingOrgUnit.organisationUnitGroups.forEach((orgUnitGroup: OrganisationUnitGroup) => {
                    if (!ougsTobeAssigned.includes(orgUnitGroup.id)) {
                        unasignedObjects.organisationUnitGroups.push(orgUnitGroup.id)
                    } else {
                        unChangedObjects.organisationUnitGroups.push(orgUnitGroup.id)
                    }
                })
                let categoryOptions = await getCategoryOptionsFromOrgUnitRefetch({ orgUnitId: existingOrgUnit.id })
                categoryOptions.categoryOptions.categoryOptions.forEach((co: CategoryOption) => {
                    if (!catCombosToBeAssigned.includes(co.id)) {
                        unasignedObjects.categoryOptions.push(co.id)
                    } else {
                        unChangedObjects.categoryOptions.push(co.id)
                    }
                })

                existingOrgUnit.users.forEach((user: User) => {
                    //find the configuration for this user.
                    let configurationFound = false;
                    userConfigsToBeAssigned.forEach((userConfig) => {
                        if (user.username.endsWith(userConfig.suffix)) {
                            //If the suffix is found, then the user has been found. 
                            //let userChanges = getUserChange(userConfig, user)
                            changedUsers.push({ userConfig, userId: user.id, userName: user.username })
                            configurationFound = true;
                        }
                    });
                    if (!configurationFound) {
                        // This means that the user is not found on any configuration. Therefore, unassign this user from this orgUnit.
                        unasignedObjects.users.push(user);
                    }
                })
            }

            //Filter users to create.

            let usersToCreate = userConfigsToBeAssigned.filter(userConfig => {
                let userNotFound = true;
                changedUsers.forEach(userChange => {
                    if (userChange.userName.endsWith(userConfig.suffix)) {
                        userNotFound = false;
                        return userNotFound;
                    }
                })
                return userNotFound;
            })

            /**
             * find the change type  
             */
            let changeType: ChangeType = existingOrgUnit ? CHANGE_TYPE_UPDATE : CHANGE_TYPE_CREATE;

            let allChange: AllChange = {
                newAssignments: {
                    dataSetsToAssign: dataSetsToBeAssigned.filter(ds => !unChangedObjects.dataSets.includes(ds)),
                    cocToAssign: catCombosToBeAssigned.filter(ds => !unChangedObjects.categoryOptions.includes(ds)),
                    ougToAssign: ougsTobeAssigned.filter(ds => !unChangedObjects.organisationUnitGroups.includes(ds)),
                    usersToCreate: usersToCreate
                },
                unassigns: {
                    coc: unasignedObjects.categoryOptions,
                    dataSets: unasignedObjects.dataSets,
                    oug: unasignedObjects.organisationUnitGroups,
                    users: unasignedObjects.users
                },
                unChangedAssignments: {
                    coc: unChangedObjects.categoryOptions,
                    dataSets: unChangedObjects.dataSets,
                    oug: unChangedObjects.organisationUnitGroups,
                    users: []
                },
                changedUsers: changedUsers,
                changeType: changeType,
                dhisOrgUnitObject: existingOrgUnit,
            }

            return allChange
        } catch (err) {
            console.error(err)
        } finally {

        }
        return null;
    }

    const handleReject = async (mfrObject: MFRMapped, rejected) => {
        setAnyLoading(true);
        let temp = rejectedList ? rejectedList.rejectedList : []

        if (rejected) {
            //We are now trying to unreject.
            temp = temp.filter(item => item !== mfrObject.mfrId + "_" + mfrObject.lastUpdated?.toISOString())
        }
        else {
            temp?.push(mfrObject.mfrId + "_" + mfrObject.lastUpdated?.toISOString())
        }


        //Make sure that there are no duplicates.
        const dataToSend = Array.from(new Set(temp))
        try {
            await uploadRejectedList({ data: dataToSend })
        } catch (e) {
            console.error("Error uploading rejected list")
        } finally {

        }
        await getRejectedList();
        setAnyLoading(false)
    }

    const handleApproval = async (mfrObject: MFRMapped) => {
        setAnyLoading(true);
        let changes = await getChanges(mfrObject)
        if (!changes) {
            //TODO show error here.
            console.error("Error has occured")
            return;
        }

        //Now we got all the changes to implement.
        //Now that the change is known, fetch all the affected metadatas
        //We need to get all metadata except unchanged ones. 

        let dataSetsToFetch: string[] = [];
        let orgUnitGroupsToFetch: string[] = []
        let categoryOptionsToFetch: string[] = []
        let usersToFetch: string[] = []
        let userRolesToFetch: string[] = []
        let userGroupsToFetch: string[] = []

        dataSetsToFetch.push(...changes?.newAssignments.dataSetsToAssign)
        dataSetsToFetch.push(...changes.unassigns.dataSets)

        orgUnitGroupsToFetch.push(...changes?.newAssignments.ougToAssign)
        orgUnitGroupsToFetch.push(...changes?.unassigns.oug)

        categoryOptionsToFetch.push(...changes?.newAssignments.cocToAssign)
        categoryOptionsToFetch.push(...changes?.unassigns.coc)

        usersToFetch.push(...changes.unassigns.users.map(user => user.id))
        usersToFetch.push(...changes.changedUsers.map(userChange => userChange.userId))

        changes.newAssignments.usersToCreate.forEach(config => {
            userRolesToFetch.push(...config.userRoles)
            userGroupsToFetch.push(...config.userGroups)
        })

        changes.unassigns.users.forEach(user => {
            userRolesToFetch.push(...user.userRoles.map(ur => ur.id))
            userGroupsToFetch.push(...user.userGroups.map(ug => ug.id))
        })

        changes.changedUsers.forEach(userChange => {
            userRolesToFetch.push(...userChange.userConfig.userRoles)
            userGroupsToFetch.push(...userChange.userConfig.userGroups)
        })


        /**
         * Making it into a set inorder to remove duplicates.
         */
        let orgUnitGroupsResponse = await organisationUnitGroupsRefetch({ ids: [...new Set(orgUnitGroupsToFetch)].join(',') })
        let dataSetResponse = await dataSetsRefetch({ ids: [...new Set(dataSetsToFetch)].join(',') })
        let categoryOptionsResponse = await categoryOptionsRefetch({ ids: [...new Set(categoryOptionsToFetch)].join(',') })
        let usersResponse = await usersRefetch({ ids: [...new Set(usersToFetch)].join(',') })

        remapUsingId(orgUnitGroupsResponse.organisationUnitGroups.organisationUnitGroups)
        remapUsingId(dataSetResponse.dataSets.dataSets)
        remapUsingId(categoryOptionsResponse.categoryOptions.categoryOptions)
        remapUsingId(usersResponse.users.users)

        //Now I have all the objects, I can start the changes now.
        setParentOrgUnitId(mfrObject.parentDHISId ?? "")

        setAllChanges(changes)
        setFetchedObjects({
            orgUnitGroups: orgUnitGroupsResponse.organisationUnitGroups.organisationUnitGroups,
            dataSets: dataSetResponse.dataSets.dataSets,
            categoryOptions: categoryOptionsResponse.categoryOptions.categoryOptions,
            users: usersResponse.users.users
        })

        setSelectedApproval(mfrObject)
        setShowConfirmModal(true)
        setAnyLoading(false);
        return;
    };

    const handleFilterChange = event => {
        setFilterValue(event.target.value);
    };

    return (
        <div className='container'>
            <h1>Pending Imports</h1>
            {anyLoading &&
                <FullScreenLoader />
            }
            <Switch checked={showRejectedList} onChange={() => setShowRejectedList(!showRejectedList)} label="Show rejected" />
            <input className='searchbar'
                type="text"
                placeholder="Search..."
                value={filterValue}
                onChange={handleFilterChange}
            />{
                finishedLoading &&
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
                                Facility type
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                Last updated
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                Approval Status
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>Reject</DataTableColumnHeader>
                            <DataTableColumnHeader>Approve</DataTableColumnHeader>
                        </DataTableRow>
                    </TableHead>
                    <TableBody>
                        {pendingApprovals?.filter(item => {
                            return item.name?.toLowerCase().includes(filterValue) || item.FT?.toLowerCase().includes(filterValue)
                        })?.map((pendingApproval, index) => {
                            let rejected = remappedRejectedList[pendingApproval.mfrId + "_" + pendingApproval.lastUpdated?.toISOString()]
                            return (
                                <>
                                    {((!rejected) || (rejected && showRejectedList)) &&
                                        <DataTableRow key={pendingApproval.mfrId}>
                                            <DataTableCell>{pendingApproval.name}</DataTableCell>
                                            <DataTableCell>{pendingApproval.reportingHierarchyName.split('/')[1]}</DataTableCell>
                                            <DataTableCell>{pendingApproval.FT}</DataTableCell>
                                            <DataTableCell>{pendingApproval.lastUpdated?.toISOString()}</DataTableCell>
                                            <DataTableCell>{rejected ? "Rejected" : "Pending"}</DataTableCell>
                                            <DataTableCell>
                                                <Button secondary onClick={async () => handleReject(pendingApproval, rejected)}>
                                                    {rejected ? "Un" : ""}Reject
                                                </Button>
                                            </DataTableCell>
                                            <DataTableCell>
                                                {!rejected &&
                                                    <Button title={pendingApproval.error ? pendingApproval.errorMessage : "Approve"}
                                                        disabled={pendingApproval.error} primary onClick={
                                                            () => {
                                                                try {
                                                                    handleApproval(pendingApproval)
                                                                } catch (e) {
                                                                    console.log("something went wrong in handle approval", e)
                                                                }
                                                                setAnyLoading(false)
                                                            }
                                                        }>
                                                        Approve
                                                    </Button>
                                                }
                                            </DataTableCell>
                                        </DataTableRow>
                                    }
                                </>
                            )
                        })}
                    </TableBody>
                </DataTable>
            }
            {
                showConfirmModal &&
                <ConfirmApproveModal
                    allChanges={allChanges}
                    fetchedObjects={fetchedObjects}
                    parentOrgUnitId={parentOrgUnitId}
                    selectedApproval={selectedApproval ? selectedApproval : null}
                    onAccept={async () => {
                        //do the actual deletion here.
                        /*
                                                await mutate({ id: itemToDelete?.key })
                                                setShowModal(false)
                                                setItemToDelete(null)
                                                refetch();
                                                successAlert.show();*/
                    }}
                    onReject={() => {
                        setShowConfirmModal(false)
                        setAllChanges(undefined)
                        setFetchedObjects(undefined)
                    }}
                />

            }
        </div>
    );
};

export default ApproveImports;
