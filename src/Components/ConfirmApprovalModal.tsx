import React, { useContext, useState, useEffect } from 'react'
import { useLoggingContext } from './Logging'
import { AllChange, ChangeType } from '../model/Approvals.model';
import { useDataMutation, useAlert, useDataQuery } from '@dhis2/app-runtime';
import { getChanges } from '../functions/services';
import { MFRMapped } from '../model/MFRMapped.model';
import { MetadataContext } from '../App';
import { Button, ButtonStrip, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, Modal, ModalActions, ModalContent, ModalTitle, TableBody, TableHead } from '@dhis2/ui';
import { FullScreenLoader } from './FullScreenLoader';
import { generateId, generatePassword } from '../functions/helpers';
import { UserConfig } from '../model/Configuration.model';
import { CHANGE_TYPE_CREATE, MFR_FACILITY_TYPE_ATTRIBUTE_UID, MFR_IS_PHCU_ATTRIBUTE_UID, MFR_LAST_UPDATED_ATTRIBUTE_UID, MFR_LOCATION_ATTRIBUTE_UID, MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID, MFR_OWNERSHIP_ATTRIBUTE_UID, MFR_SETTLEMENT_ATTRIBUTE_UID, MFRMapping } from '../functions/constants';


interface ModalProps {
    existingDhisObject: any;
    changeType: ChangeType;
    pendingApproval: MFRMapped;
    onClose: Function;
    parentOrgUnitId: string;
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

const updateMetadata = {
    resource: 'metadata',
    type: 'create',
    data: ({ data }) => data
}

const deleteApprovalMutation = {
    resource: 'dataStore/Dhis2-MFRApproval',
    id: ({ id }) => id,
    type: 'delete'
}
const createMessageMutation = {
    resource: "messageConversations",
    type: 'create',
    data: ({ data }) => data,
}


const createOrganizationMutation = {
    resource: 'organisationUnits',
    type: 'create',
    data: ({ data }) => data
}


const metadataQuery = {
    organisationUnitGroups: {
        resource: 'organisationUnitGroups',
        params: ({ ougIds }) => ({
            filter: 'id:in:[' + ougIds + "]",
            fields: '*',
            paging: false
        })
    },
    categoryOptions: {
        resource: 'categoryOptions',
        params: ({ categoryOptionIds }) => ({
            filter: "id:in:[" + categoryOptionIds + "]",
            fields: '*',
            paging: false
        })
    },
    dataSets: {
        resource: 'dataSets',
        params: ({ dataSetIds }) => ({
            filter: "id:in:[" + dataSetIds + "]",
            fields: "*",
            paging: false
        })
    },
    userGroups: {
        resource: 'userGroups',
        params: ({ userGroupIds }) => ({
            filter: "id:in:[" + userGroupIds + "]",
            fields: "*",
            paging: false
        })
    },
    users: {
        resource: 'users',
        params: ({ userIds }) => ({
            filter: "id:in:[" + userIds + "]",
            fields: "*",
            paging: false
        })
    },
    userRoles: {
        resource: 'userRoles',
        params: ({ userRoleIds }) => ({
            filter: "id:in:[" + userRoleIds + "]",
            fields: "*",
            paging: false
        })
    }

}

interface MetadataAssignmentProps {
    metadataIds: string[];
    orgUnitId: string | undefined;
    assignmentType: "assign" | "Unassign",
    metadatasFetched: any[];
}

const maintainAssignment = (props: MetadataAssignmentProps) => {
    let tempArray = new Set(props.metadataIds)
    let payload: any[] = []
    tempArray.forEach(metadata => {
        let metadataObject = props.metadatasFetched[metadata]
        //first remove if it exists. Do this for assign as well so that duplicate assignments won't exist.
        metadataObject.organisationUnits = metadataObject.organisationUnits.filter(ou => {
            return ou.id !== props.orgUnitId
        })

        if (props.assignmentType === "assign") {
            metadataObject.organisationUnits.push({ "id": props.orgUnitId })
        }
        payload.push(metadataObject)
    })
    return payload;
}

const createUserPayload = (config: UserConfig, approval: MFRMapped, orgUnitId: string, parentId: string) => {
    return {
        id: generateId(11),
        username: approval.mfrCode + config.suffix,
        disabled: false,
        organisationUnits: [{ "id": orgUnitId }],
        dataViewOrganisationUnits: [{ "id": parentId }],
        userRoles: config.userRoles.map(ur => { return { "id": ur } }),
        userGroups: config.userGroups.map(ug => { return { 'id': ug } }),
        firstName: approval.hmisCode && approval.hmisCode !== "" ? approval.hmisCode : approval.name,
        surname: config.suffix,
        password: generatePassword()
    }
}

const generateOrgUnitObject = (orgUnitId: string, pendingApproval: MFRMapped, geometry: any, parentId: string) => {
    return {
        id: orgUnitId,
        code: pendingApproval.mfrCode,
        geometry: geometry,
        name: pendingApproval.name,
        openingDate: new Date(pendingApproval.yearOpened ? pendingApproval.yearOpened : "").toISOString(),
        closedDate: pendingApproval.operationalStatus === "Closed" ? pendingApproval.closedDate?.toISOString() : "",
        parent: { "id": parentId },
        shortName: pendingApproval.name.substring(0, 50),
        attributeValues: [
            { "value": pendingApproval.mfrId, attribute: { "id": MFR_LOCATION_ATTRIBUTE_UID } },
            { "value": pendingApproval.operationalStatus, attribute: { "id": MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID } },
            { "value": pendingApproval.ownership, attribute: { "id": MFR_OWNERSHIP_ATTRIBUTE_UID } },
            { "value": pendingApproval.settlement, attribute: { "id": MFR_SETTLEMENT_ATTRIBUTE_UID } },
            { "value": pendingApproval.lastUpdated, attribute: { "id": MFR_LAST_UPDATED_ATTRIBUTE_UID } },
            { "value": pendingApproval.isPHCU, attribute: { "id": MFR_IS_PHCU_ATTRIBUTE_UID } },
            { "value": pendingApproval.FT, attribute: { "id": MFR_FACILITY_TYPE_ATTRIBUTE_UID } }
        ]

    }
}


export const ConfirmApprovalModal: React.FC<ModalProps> = ({
    existingDhisObject, changeType, pendingApproval, onClose, parentOrgUnitId
}) => {

    const metadata = useContext(MetadataContext)
    const { showAndSaveLog, showLogOnly } = useLoggingContext();



    const [expanded, setExpanded] = useState("")
    const [anyLoading, setAnyLoading] = useState(true)
    const [errorOccured, setErrorOccured] = useState<any>(null);
    const [finishedSaving, setFinishedSaving] = useState(false)
    const [allChanges, setAllChanges] = useState<AllChange>();
    const [fetchedObjects, setFetchedObjects] = useState<any>();


    const { refetch: metadataRefetch } = useDataQuery(metadataQuery, { lazy: true })

    const { loading: loadingAssignedCategoryOptions, data: assignedCategoryOptions, error: errorAssignedCategoryOptions } = existingDhisObject ? useDataQuery(categoryOptionsFromOrgUnitQuery, {
        variables: { orgUnitId: existingDhisObject?.id }
    })
        : { loading: false, data: null, error: null }

    const doPostErrorHandling = (e, message) => {
        showAndSaveLog({
            id: new Date().toISOString(),
            logType: 'Error',
            message,
            timestamp: new Date(),
            username: metadata.me.username
        })
        setAnyLoading(false)
        setErrorOccured(e)
    }

    const [metadataMutation] = useDataMutation(updateMetadata, {
        onError: (e) => {
            doPostErrorHandling(e, `Updating metdata of facility [${pendingApproval.name}] failed.`)
        }
    })

    const [messageMutation] = useDataMutation(createMessageMutation, {
        onError: (e) => {
            doPostErrorHandling(e, `Org unit [${pendingApproval.name}] creation failed.`)
        }
    })

    const [approvalDeleteMutation] = useDataMutation(deleteApprovalMutation, {
        onError: (e) => {
            doPostErrorHandling(e, `Deliting approval of facility [${pendingApproval.name}] failed`)
        }
    })


    const getMetadata = async (allChanges: AllChange) => {
        setAnyLoading(true)


        let dataSetIds: string[] = []
        dataSetIds.push(...allChanges?.newAssignments.dataSetsToAssign)
        dataSetIds.push(...allChanges.unassigns.dataSets)

        let ougIds: string[] = []
        ougIds.push(...allChanges.newAssignments.ougToAssign)
        ougIds.push(...allChanges.unassigns.oug)

        let categoryOptionIds: string[] = []
        categoryOptionIds.push(...allChanges.newAssignments.cocToAssign)
        categoryOptionIds.push(...allChanges.unassigns.coc)

        let userIds: string[] = []
        userIds.push(...allChanges.unassigns.users.map(user => user.id))
        userIds.push(...allChanges.changedUsers.map(userChange => userChange.userId))

        let userRoleIds: string[] = []
        let userGroupIds: string[] = []
        allChanges.newAssignments.usersToCreate.forEach(config => {
            userRoleIds.push(...config.userRoles)
            userGroupIds.push(...config.userGroups)
        })

        allChanges.unassigns.users.forEach(user => {
            userRoleIds.push(...user.userRoles.map(ur => ur.id))
            userGroupIds.push(...user.userGroups.map(ug => ug.id))
        })

        allChanges.changedUsers.forEach(userChange => {
            userRoleIds.push(...userChange.userConfig.userRoles)
            userGroupIds.push(...userChange.userConfig.userGroups)
        })

        try {
            const response = await metadataRefetch(
                {
                    userRoleIds: [...new Set(userRoleIds)],
                    userIds: [...new Set(userIds)],
                    userGroupIds: [... new Set(userGroupIds)],
                    dataSetIds: [... new Set(dataSetIds)],
                    categoryOptionIds: [...new Set(categoryOptionIds)],
                    ougIds: [...new Set(ougIds)]
                }
            );
            let remapped = {};
            Object.keys(response).forEach(key => {
                remapped[key] = {}
                Object.keys(response[key][key]).forEach(item => {
                    remapped[key][response[key][key][item].id] = response[key][key][item]
                })
            })
            return remapped

        } catch (ex) {
            showLogOnly({
                id: new Date().toISOString(),
                logType: 'Error',
                message: "Error loading metadtata",
                timestamp: new Date(),
                username: metadata.me.username
            })
            console.error("Error loading metadata", ex)
        }
    }



    const handleApproval = async () => {
        setAnyLoading(true);
        //for orgUnitId, if it is an update use DHIS2 object, or use the mfr DHIS2 id if it exists otherwise create a new one.
        let orgUnitId = existingDhisObject ? existingDhisObject.id : pendingApproval.dhisId ?? generateId(11)
        let orgUnitCode = pendingApproval.mfrCode

        let dataSetPayload: any[] = [];
        let categoryOptionsPayload: any[] = [];
        let usersPayload: any[] = [];
        let orgUnitGroupsPayload: any[] = [];

        //For the comming ones, we are adding to sets to make sure no duplicates are added.
        dataSetPayload.push(...maintainAssignment({
            assignmentType: "assign",
            metadataIds: allChanges?.newAssignments.dataSetsToAssign ?? [],
            metadatasFetched: fetchedObjects.dataSets,
            orgUnitId
        }))

        dataSetPayload.push(...maintainAssignment({
            assignmentType: "Unassign",
            metadataIds: allChanges?.unassigns.dataSets ?? [],
            metadatasFetched: fetchedObjects.dataSets,
            orgUnitId
        }))

        categoryOptionsPayload.push(...maintainAssignment({
            assignmentType: "assign",
            metadataIds: allChanges?.newAssignments.cocToAssign ?? [],
            metadatasFetched: fetchedObjects.categoryOptions,
            orgUnitId
        }))

        categoryOptionsPayload.push(...maintainAssignment({
            assignmentType: "Unassign",
            metadataIds: allChanges?.unassigns.coc ?? [],
            metadatasFetched: fetchedObjects.categoryOptions,
            orgUnitId
        }))

        orgUnitGroupsPayload.push(...maintainAssignment({
            assignmentType: "assign",
            metadataIds: allChanges?.newAssignments.ougToAssign ?? [],
            metadatasFetched: fetchedObjects.organisationUnitGroups,
            orgUnitId
        }))

        orgUnitGroupsPayload.push(...maintainAssignment({
            assignmentType: "Unassign",
            metadataIds: allChanges?.unassigns.oug ?? [],
            metadatasFetched: fetchedObjects.organisationUnitGroups,
            orgUnitId
        }))

        let usersToCreate: any[] = [];

        allChanges?.newAssignments.usersToCreate.forEach(uc => {
            usersToCreate.push(...[createUserPayload(uc, pendingApproval, orgUnitId, parentOrgUnitId)])
        })

        //look for users that need to be unassigned.
        let unassignedUsers = maintainAssignment({
            assignmentType: 'Unassign',
            metadataIds: allChanges?.unassigns.users.map(user => user.id) ?? [],
            metadatasFetched: fetchedObjects.users,
            orgUnitId
        })

        allChanges?.changedUsers.forEach(userChange => {
            //These are users that need to be changed their roles and groups.
            let userObject = fetchedObjects.users[userChange.userId]
            userObject.userGroups = userChange.userConfig.userGroups.map(group => { return { 'id': group } })
            userObject.userRoles = userChange.userConfig.userRoles.map(role => { return { "id": role } })
            usersPayload.push(userObject)
        })

        let usersToDisable = unassignedUsers.filter(user => user.organisationUnits.length === 0)
        let usersToUnassign = unassignedUsers.filter(user => user.organisationUnits.length !== 0)

        usersToDisable.forEach(user => {
            user.disable = true;
        })

        usersPayload.push(...usersToDisable)
        usersPayload.push(...usersToUnassign)
        usersPayload.push(...usersToCreate)

        try {
            let orgUnitObject = generateOrgUnitObject(
                orgUnitId,
                pendingApproval,
                existingDhisObject && existingDhisObject.geometry && existingDhisObject.geometry.type === "Polygon" ?
                    existingDhisObject.geometry : { "type": "Point", "coordinates": [pendingApproval.longitude, pendingApproval.latitude] }
                , parentOrgUnitId
            )

            let metaObjects: any = {
                users: usersPayload,
                dataSets: dataSetPayload,
                categoryOptions: categoryOptionsPayload,
                organisationUnitGroups: orgUnitGroupsPayload,
            }

            if (changeType === CHANGE_TYPE_CREATE) {
                let res = await metadataMutation({ data: { organisationUnits: [orgUnitObject] } })
                await showAndSaveLog({
                    id: new Date().toISOString(),
                    logType: 'Success',
                    message: `Org unit [${pendingApproval.name}] created, updating metadata`,
                    timestamp: new Date(),
                    username: metadata.me.username
                })
            } else if (changeType === 'CHANGE_TYPE_DISABLE') {
                orgUnitObject.name = orgUnitObject.name + "_closed"
                orgUnitObject.closedDate = orgUnitObject.closedDate ?? new Date().toISOString();
            }
            metaObjects.organisationUnits = [orgUnitObject]

            await metadataMutation({ data: metaObjects })
            await showAndSaveLog({
                id: new Date().toISOString(),
                logType: 'Success',
                message: `Org unit [${pendingApproval.name}] metadata assignment completed. ${usersToCreate.length > 0 ? "Creating new users" : ""}`,
                timestamp: new Date(),
                username: metadata.me.username
            })

             await approvalDeleteMutation({ id: pendingApproval.mfrId })
            setFinishedSaving(true)
            setAnyLoading(false);
            await showAndSaveLog({
                id: new Date().toISOString(),
                logType: 'Success',
                message: `Completed Successfully: [${pendingApproval.name}]`,
                timestamp: new Date(),
                username: metadata.me.username
            })
        } catch (e) {
            console.error(e)
        } finally {
            setAnyLoading(false);
        }



    }


    useEffect(() => {
        const fetch = async () => {
            setAnyLoading(true)
            const allChanges = getChanges(
                pendingApproval,
                existingDhisObject,
                metadata.configurations,
                [],
                changeType)
            let tempFetchedData = await getMetadata(allChanges);
            setAllChanges(allChanges)
            setFetchedObjects(tempFetchedData)
            setAnyLoading(false);

        }
        if (assignedCategoryOptions) {
            fetch();
        }
    }, [assignedCategoryOptions])

    /**
     * This is when there is no existingDhisObject
     */
    useEffect(() => {
        const fetch = async () => {
            setAnyLoading(true)
            //find all changes.
            const allChanges = getChanges(
                pendingApproval,
                existingDhisObject,
                metadata.configurations,
                [],
                changeType
            )
            const tempFetchedData = await getMetadata(allChanges)
            setAllChanges(allChanges)
            setFetchedObjects(tempFetchedData)
            setAnyLoading(false);
        }
        if (!existingDhisObject) {
            fetch();
        }
    }, [])

    return (
        <Modal large>
            {anyLoading && <FullScreenLoader />}
            <ModalTitle>
                Confirm Approval?
            </ModalTitle>
            <ModalContent>
                {
                    finishedSaving &&
                    <div>
                        Finished saving.
                    </div>
                }
                {
                    errorOccured &&
                    <div>
                        Error saving facility <br /><br />{errorOccured.message}
                    </div>
                }
                {
                    errorOccured === null && finishedSaving === false && fetchedObjects &&
                    <DataTable>
                        <TableHead>
                            <DataTableRow>
                                <DataTableColumnHeader />
                                <DataTableColumnHeader>
                                    Metadata
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    Change Type
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    Number of affected objects
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </TableHead>
                        <TableBody>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Data sets to assign: {
                                            allChanges?.newAssignments.dataSetsToAssign
                                                .map(ds => fetchedObjects.dataSets[ds].displayName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "dataSetsAssign"}
                                onExpandToggle={() => expanded !== "dataSetsAssign" ? setExpanded("dataSetsAssign") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Data sets
                                </DataTableCell>
                                <DataTableCell>
                                    Assign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.newAssignments.dataSetsToAssign.length ?? 0)}
                                </DataTableCell>

                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Data sets to unassign: {
                                            allChanges?.unassigns.dataSets
                                                .map(ds => fetchedObjects.dataSets[ds].displayName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "dataSetsUnAssign"}
                                onExpandToggle={() => expanded !== "dataSetsUnAssign" ? setExpanded("dataSetsUnAssign") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Data sets
                                </DataTableCell>
                                <DataTableCell>
                                    UnAssign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.dataSets.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Category Options to assign: {
                                            allChanges?.newAssignments.cocToAssign
                                                .map(co => fetchedObjects.categoryOptions[co].displayName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "categoryOptionsAssign"}
                                onExpandToggle={() => expanded !== "categoryOptionsAssign" ? setExpanded("categoryOptionsAssign") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Category options
                                </DataTableCell>
                                <DataTableCell>
                                    Assign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.newAssignments.cocToAssign.length ?? 0)}
                                </DataTableCell>

                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Category options to unassign: {
                                            allChanges?.unassigns.coc
                                                .map(co => fetchedObjects.categoryOptions[co].displayName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "categoryOptionsUnAssign"}
                                onExpandToggle={() => expanded !== "categoryOptionsUnAssign" ? setExpanded("categoryOptionsUnAssign") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Category options
                                </DataTableCell>
                                <DataTableCell>
                                    UnAssign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.coc.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Organisation unit groups to assign: {
                                            allChanges?.newAssignments.ougToAssign
                                                .map(co => fetchedObjects.organisationUnitGroups[co].displayName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "ougAssign"}
                                onExpandToggle={() => expanded !== "ougAssign" ? setExpanded("ougAssign") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Organisation unit groups
                                </DataTableCell>
                                <DataTableCell>
                                    Assign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.newAssignments.ougToAssign.length ?? 0)}
                                </DataTableCell>

                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Organisation unit groups to unassign: {
                                            allChanges?.unassigns.oug
                                                .map(co => fetchedObjects.organisationUnitGroups[co].displayName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "ougUnAssign"}
                                onExpandToggle={() => expanded !== "ougUnAssign" ? setExpanded("ougUnAssign") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Organisation unit groups
                                </DataTableCell>
                                <DataTableCell>
                                    UnAssign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.coc.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Users to create: {
                                            allChanges?.newAssignments.usersToCreate
                                                .map(userConfig => userConfig.suffix)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "usersCreate"}
                                onExpandToggle={() => expanded !== "usersCreate" ? setExpanded("usersCreate") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Create
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.newAssignments.usersToCreate.length ?? 0)}
                                </DataTableCell>

                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Users to update: {
                                            allChanges?.changedUsers
                                                .map(userChange => userChange.userName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "usersUpdate"}
                                onExpandToggle={() => expanded !== "usersUpdate" ? setExpanded("usersUpdate") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Update
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.changedUsers.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>
                            <DataTableRow
                                expandableContent={
                                    <div>
                                        Users to disable: {
                                            allChanges?.unassigns.users
                                                .map(user => fetchedObjects.users[user.id].userName)
                                                .map(name => <>{name}<br /></>)
                                        }
                                    </div>
                                }
                                expanded={expanded === "usersDisable"}
                                onExpandToggle={() => expanded !== "usersDisable" ? setExpanded("usersDisable") : setExpanded('')}
                            >
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Disable
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.users.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>
                        </TableBody>
                    </DataTable>
                }
            </ModalContent>
            <ModalActions>
                {
                    (finishedSaving || errorOccured !== null) &&
                    <ButtonStrip end>
                        <Button primary onClick={() => onClose()}
                        >Close</Button>
                    </ButtonStrip>
                }
                {!finishedSaving && errorOccured === null &&
                    <ButtonStrip>
                        <Button destructive onClick={() => handleApproval()}>
                            Yes
                        </Button>
                        <Button primary onClick={() => onClose()}>
                            No
                        </Button>
                    </ButtonStrip>
                }
            </ModalActions>
        </Modal>
    )
}