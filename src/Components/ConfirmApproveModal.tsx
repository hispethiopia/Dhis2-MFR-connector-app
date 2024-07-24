import { Button, ButtonStrip, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, Modal, ModalActions, ModalContent, ModalTitle, TableBody, TableHead } from '@dhis2/ui';
import React, { useState, useContext } from 'react'
import { useDataMutation } from '@dhis2/app-runtime'
import { AllChange, FetchedObjects } from '../model/Approvals.model';
import { MFRMapped } from '../model/MFRMapped.model';
import { generateId, generatePassword } from '../functions/helpers';
import { UserConfig } from '../model/Configuration.model';
import { CHANGE_TYPE_CREATE, CHANGE_TYPE_DISABLE, CHANGE_TYPE_UPDATE, MFR_FACILITY_TYPE_ATTRIBUTE_UID, MFR_IS_PHCU_ATTRIBUTE_UID, MFR_LAST_UPDATED_ATTRIBUTE_UID, MFR_LOCATION_ATTRIBUTE_UID, MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID, MFR_OPTION_SETS_ATTRIBUTE_CODE, MFR_OWNERSHIP_ATTRIBUTE_UID, MFR_SETTLEMENT_ATTRIBUTE_UID, USER_GROUPS_TO_SEND_MESSAGE, mfrMapping } from '../functions/constants';
import { FullScreenLoader } from './FullScreenLoader';
import { Message } from '../model/Message.model';
import { useLoggingContext } from './Logging';
import { MetadataContext } from '../App';

interface ModalProps {
    allChanges: AllChange | undefined;
    fetchedObjects: FetchedObjects | undefined;
    onAccept: Function;
    onReject: Function;
    selectedApproval: MFRMapped | null
    parentOrgUnitId: string;
}


interface MetadataAssignmentProps {
    metadataIds: string[];
    orgUnitId: string | undefined;
    assignmentType: "assign" | "unassign",
    metadatasFetched: any[];
}

const maintainAssignment = (props: MetadataAssignmentProps) => {

    //This makes sure that all elements in metadataIds are unique.
    let tempArray = new Set(props.metadataIds)
    let payload: any[] = []
    tempArray.forEach(metadata => {
        let metadataObject = props.metadatasFetched[metadata]
        //First remove if it exists. Do this for assign as well so that duplicate assignments won't exist.
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


const createOrgUnit = (mfrObject: MFRMapped | null) => {
    let dhisObject = {
        id: "",
        attributeValues: [
            { "value": mfrObject?.mfrId, attribute: { "id": MFR_LOCATION_ATTRIBUTE_UID } },
            { "value": mfrObject?.operationalStatus, attribute: { "id": MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID } },
            { "value": mfrObject?.ownership, attribute: { "id": MFR_OWNERSHIP_ATTRIBUTE_UID } },
            { "value": mfrObject?.settlement, attribute: { "id": MFR_SETTLEMENT_ATTRIBUTE_UID } },
            { "value": mfrObject?.lastUpdated, attribute: { "id": MFR_LAST_UPDATED_ATTRIBUTE_UID } },
            { "value": mfrObject?.isPHCU, attribute: { "id": MFR_IS_PHCU_ATTRIBUTE_UID } },
            { "value": mfrObject?.FT, attribute: { "id": MFR_FACILITY_TYPE_ATTRIBUTE_UID } }
        ],
        code: mfrObject?.mfrCode,
        geometry: {
            type: "",
            coordinates: ["", ""]
        },
        name: mfrObject?.name,
        openingDate: new Date(mfrObject?.yearOpened ? mfrObject?.yearOpened : "").toISOString(),
        closedDate: "",
        parent: { "id": mfrObject?.parentDHISId },
        shortName: mfrObject ? mfrObject.name.substring(0, 50) : ""
    }

    dhisObject.geometry.type = "Point"
    let coordinates = [mfrObject ? mfrObject[mfrMapping.latitude] : "", mfrObject ? mfrObject[mfrMapping.longitude] : ""]
    dhisObject.geometry.coordinates = coordinates;

    return dhisObject;
}

//User update or create or disable.
/**
 * Required fields
 * mfrObject.hmisCode
 * config.suffix
 * parentId
 * 
 * 
 * @param config 
 * @param mfrObject 
 * @param orgUnitId 
 * @param parentId 
 * @returns 
 */
const createUser = (config: UserConfig, mfrObject: MFRMapped | null, orgUnitId: string | undefined, parentId: string) => {
    return {
        id: generateId(11),
        username: mfrObject?.mfrCode + config.suffix,
        disabled: false,
        organisationUnits: [{ "id": orgUnitId }],
        dataViewOrganisationUnits: [{ "id": parentId }],
        userRoles: config.userRoles.map(ur => { return { "id": ur } }),
        userGroups: config.userGroups.map(ug => { return { "id": ug } }),
        firstName: mfrObject?.hmisCode && mfrObject?.hmisCode !== "" ? mfrObject?.hmisCode : mfrObject?.name,
        surname: config.suffix,
        password: generatePassword(),
    }
}

const createOrganizationMutation = {
    resource: 'organisationUnits',
    type: 'create',
    data: ({ data }) => data
}

const updateMetadata = {
    resource: 'metadata',
    type: 'create',
    data: ({ data }) => data
}

const createMessageMutation = {
    resource: "messageConversations",
    type: 'create',
    data: ({ data }) => data,
}

const deleteApprovalMutation = {
    resource: 'dataStore/Dhis2-MFRApproval',
    id: ({ id }) => id,
    type: 'delete'
}


export const ConfirmApproveModal: React.FC<ModalProps> = ({
    allChanges, fetchedObjects, onAccept, onReject, selectedApproval, parentOrgUnitId
}) => {

    const { showAndSaveLog, showLogOnly } = useLoggingContext();


    const [expanded, setExpanded] = useState("");
    const [anyLoading, setAnyLoading] = useState(false)
    const [errorOccured, setErrorOccured] = useState<any>(null)
    const [finishedSaving, setFinishedSaving] = useState(false)

    const doPostErrorHandling = (e, message) => {
        showAndSaveLog({
            id: new Date().toISOString(),
            logType: 'Error',
            message: message,
            timestamp: new Date(),
            username: metadata.me.username
        })
        setAnyLoading(false);
        setErrorOccured(e);
    }

    const [metadataMutation] = useDataMutation(updateMetadata, {
        onError: (e) => {

            doPostErrorHandling(e, `Updating metdata of facility [${selectedApproval?.name}] failed`)
        }
    });

    const [messageMutation] = useDataMutation(createMessageMutation,
        {
            onError: (e) => {
                doPostErrorHandling(e, `Sending message of facility [${selectedApproval?.name}] failed`)
            }
        }
    )
    const [orgUnitMutation, { loading: loadingOrgUnitMutation, error: errorOrgUnitMutation }] = useDataMutation(createOrganizationMutation, {
        onError: (e) => {
            doPostErrorHandling(e, `Org unit [${selectedApproval?.name}] creation failed`);
        }
    });

    const [approvalDeleteMutation] = useDataMutation(deleteApprovalMutation, {
        onError: (e) => {
            doPostErrorHandling(e, `Deliting approval of facility [${selectedApproval?.name}] failed`)
        }
    })

    const metadata = useContext(MetadataContext)


    const handleApprove = async () => {
        setAnyLoading(true);
        //for orgUnit id, use the dhis2 object, if it is an update or use the mfr DHIS2 id if it exists otherwise create a new ID.
        let orgUnitId = allChanges?.dhisOrgUnitObject ? allChanges?.dhisOrgUnitObject.id :
            selectedApproval?.dhisId ? selectedApproval?.dhisId : generateId(11);
        let orgUnitCode = selectedApproval?.mfrCode;
        //if type is create, first create the orgUnit.

        //if type is update, I can send all the request in one post request.

        let dataSetPayload: any[] = [];
        let categoryOptionsPayload: any[] = [];
        let usersPayload: any[] = [];
        let orgUnitGroupsPayload: any[] = [];
        //Adding to set to make sure that there are no duplicates.
        //----------Data sets
        dataSetPayload.push(...maintainAssignment({
            assignmentType: "assign",
            metadataIds: allChanges?.newAssignments.dataSetsToAssign ?? [],
            metadatasFetched: fetchedObjects?.dataSets,
            orgUnitId
        }))

        dataSetPayload.push(...maintainAssignment(
            {
                assignmentType: "unassign",
                metadataIds: allChanges?.unassigns.dataSets ?? [],
                metadatasFetched: fetchedObjects?.dataSets,
                orgUnitId
            }))

        //----------Category options
        categoryOptionsPayload.push(...maintainAssignment(
            {
                assignmentType: "assign",
                metadataIds: allChanges?.newAssignments.cocToAssign ?? [],
                metadatasFetched: fetchedObjects?.categoryOptions,
                orgUnitId
            }))

        categoryOptionsPayload.push(...maintainAssignment(
            {
                assignmentType: "unassign",
                metadataIds: allChanges?.unassigns.coc ?? [],
                metadatasFetched: fetchedObjects?.categoryOptions,
                orgUnitId
            }
        ))

        //-------------Organisation unit groups.
        orgUnitGroupsPayload.push(...maintainAssignment(
            {
                assignmentType: "assign",
                metadataIds: allChanges?.newAssignments.ougToAssign ?? [],
                metadatasFetched: fetchedObjects?.orgUnitGroups,
                orgUnitId,
            }
        ))

        orgUnitGroupsPayload.push(...maintainAssignment({
            assignmentType: 'unassign',
            metadataIds: allChanges?.unassigns.oug ?? [],
            metadatasFetched: fetchedObjects?.orgUnitGroups,
            orgUnitId
        }))

        //------------Users
        let usersToCreate: any[] = [];
        allChanges?.newAssignments.usersToCreate.forEach(uc => {
            usersToCreate.push(...[createUser(uc, selectedApproval, orgUnitId, parentOrgUnitId)])
        });

        //look for users that need to be unassigned.
        let unassignedUsers = maintainAssignment({
            assignmentType: "unassign",
            metadataIds: allChanges?.unassigns.users.map(user => user.id) ?? [],
            metadatasFetched: fetchedObjects?.users,
            orgUnitId
        })

        allChanges?.changedUsers.forEach(userChange => {
            //These are users that need to be changed their roles and groups.
            let userObject = fetchedObjects?.users[userChange.userId]
            userObject.userGroups = userChange.userConfig.userGroups.map(group => { return { "id": group } })
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

            let orgUnitObject = createOrgUnit(selectedApproval)
            orgUnitObject.id = orgUnitId ?? ""

            let newMetaObjects: any = {
                users: usersPayload,
                dataSets: dataSetPayload,
                categoryOptions: categoryOptionsPayload,
                organisationUnitGroups: orgUnitGroupsPayload,
            }

            if (allChanges?.changeType === CHANGE_TYPE_CREATE) {
                //If orgUnit is create, send a post request to create the orgUnit first.
                let res = await orgUnitMutation({ data: orgUnitObject })
                await showAndSaveLog({
                    id: new Date().toISOString(),
                    logType: 'Success',
                    message: `Org unit [${selectedApproval?.name}] created, updating metadata`,
                    timestamp: new Date(),
                    username: metadata.me.username
                })
            } else if (allChanges?.changeType === CHANGE_TYPE_DISABLE) {
                orgUnitObject.name = orgUnitObject.name + "_closed"
                orgUnitObject.closedDate = new Date().toISOString()
                newMetaObjects.organisationUnits = [orgUnitObject]
            } else {
                newMetaObjects.organisationUnits = [orgUnitObject]
            }

            await metadataMutation({ data: newMetaObjects })
            await showAndSaveLog({
                id: new Date().toISOString(),
                logType: 'Success',
                message: `Org unit [${selectedApproval?.name}] Metadata assignment completed, updating users`,
                timestamp: new Date(),
                username: metadata.me.username
            })

            if (usersToCreate.length > 0) {
                let messageText = usersToCreate.map(user => { return `User created:${user.firstName} username:${user.username} password:${user.password}` }).join('\n')
                let message: Message = {
                    organisationUnits: [],
                    subject: "User created",
                    text: messageText,
                    userGroups: USER_GROUPS_TO_SEND_MESSAGE,
                    users: []
                }
                await messageMutation({
                    data: message
                })
            }

            await approvalDeleteMutation({ id: selectedApproval?.mfrId })

            setFinishedSaving(true)
            setAnyLoading(false);
            await showAndSaveLog({
                id: new Date().toISOString(),
                logType: 'Success',
                message: `Completed: Successfully ${allChanges?.changeType === CHANGE_TYPE_CREATE ? "created" : allChanges?.changeType === CHANGE_TYPE_UPDATE ? "updated" : "disabled"} facility ${selectedApproval?.name}`,
                timestamp: new Date(),
                username: metadata.me.username
            })

        } catch (e) {
            //No need to do anything here as errors are already handled within respective mutations
            console.error(e)
        } finally {
            //No need to do anything here as well.
            setAnyLoading(false);
        }

    }

    return (
        <Modal large>
            {anyLoading &&
                <FullScreenLoader />
            }
            <ModalTitle>
                {allChanges?.changeType}
            </ModalTitle>
            <ModalContent>
                {
                    finishedSaving &&
                    <div>
                        Finished updating facility.
                    </div>
                }
                {
                    errorOccured &&
                    <div>
                        Error saving facility<br /><br />{errorOccured.message}
                    </div>
                }
                {allChanges?.changeType === 'CHANGE_TYPE_UPDATE' || allChanges?.changeType === "CHANGE_TYPE_NEW_MAPPING" ? `Updating facility from 
                ${allChanges.dhisOrgUnitObject.displayName} to 
                ${selectedApproval?.name}` : ''}

                {errorOccured === null && finishedSaving === false &&
                    <DataTable>
                        <TableHead>
                            <DataTableRow>
                                <DataTableColumnHeader />
                                <DataTableColumnHeader>
                                    Metadata
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    Change type
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    Number of affected objects.
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </TableHead>
                        <TableBody>
                            <DataTableRow
                                expandableContent={
                                    <div >
                                        Data sets to assign: {allChanges?.newAssignments.dataSetsToAssign.map(ds => fetchedObjects?.dataSets[ds].displayName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "dataSetsAssign" ? setExpanded('dataSetsAssign') : setExpanded("")}
                                expanded={expanded === "dataSetsAssign"}>
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
                                    <div >
                                        {allChanges?.unassigns.dataSets.map(ds => fetchedObjects?.dataSets[ds].displayName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "dataSetsUnAssign" ? setExpanded('dataSetsUnAssign') : setExpanded("")}
                                expanded={expanded === "dataSetsUnAssign"}>
                                <DataTableCell>
                                    Data sets
                                </DataTableCell>
                                <DataTableCell>
                                    Unassign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.dataSets.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>


                            <DataTableRow
                                expandableContent={
                                    <div >
                                        Data sets to assign: {allChanges?.newAssignments.cocToAssign.map(co => fetchedObjects?.categoryOptions[co].displayName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "categoryOptionsAssign" ? setExpanded('categoryOptionsAssign') : setExpanded("")}
                                expanded={expanded === "categoryOptionsAssign"}>
                                <DataTableCell>
                                    Category Options
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
                                    <div >
                                        {allChanges?.unassigns.coc.map(co => fetchedObjects?.categoryOptions[co].displayName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "categoryOptionsUnAssign" ? setExpanded('categoryOptionsUnAssign') : setExpanded("")}
                                expanded={expanded === "categoryOptionsUnAssign"}>
                                <DataTableCell>
                                    Category options
                                </DataTableCell>
                                <DataTableCell>
                                    Unassign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.coc.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>


                            <DataTableRow
                                expandableContent={
                                    <div >
                                        Data sets to assign: {allChanges?.newAssignments.ougToAssign.map(oug => fetchedObjects?.orgUnitGroups[oug].displayName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "orgUnitGroupsAssign" ? setExpanded('orgUnitGroupsAssign') : setExpanded("")}
                                expanded={expanded === "orgUnitGroupsAssign"}>
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
                                    <div >
                                        {allChanges?.unassigns.oug.map(oug => fetchedObjects?.orgUnitGroups[oug].displayName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "orgUnitGroupsUnAssign" ? setExpanded('orgUnitGroupsUnAssign') : setExpanded("")}
                                expanded={expanded === "orgUnitGroupsUnAssign"}>
                                <DataTableCell>
                                    Organisation unit groups
                                </DataTableCell>
                                <DataTableCell>
                                    Unassign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.oug.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>


                            <DataTableRow
                                expandableContent={
                                    <div >
                                        {allChanges?.newAssignments.usersToCreate.map(userConfig => userConfig.suffix).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "usersCreate" ? setExpanded('usersCreate') : setExpanded("")}
                                expanded={expanded === "usersCreate"}>
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Create
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.newAssignments.usersToCreate.length ?? 0 +
                                        (allChanges?.newAssignments.usersToCreate.length ?? 0))}
                                </DataTableCell>
                            </DataTableRow>

                            <DataTableRow
                                expandableContent={
                                    <div >
                                        {allChanges?.changedUsers.map(userChange => userChange.userName).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "usersUpdate" ? setExpanded('usersUpdate') : setExpanded("")}
                                expanded={expanded === "usersUpdate"}>
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Update
                                </DataTableCell>
                                <DataTableCell>
                                    {allChanges?.changedUsers.length ?? 0}
                                </DataTableCell>
                            </DataTableRow>

                            <DataTableRow
                                expandableContent={
                                    <div >
                                        {allChanges?.unassigns.users.map(user => user.username).map(name => <>{name}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "usersUnAssign" ? setExpanded('usersUnAssign') : setExpanded("")}
                                expanded={expanded === "usersUnAssign"}>
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Unassign
                                </DataTableCell>
                                <DataTableCell>
                                    {(allChanges?.unassigns.users.length ?? 0)}
                                </DataTableCell>
                            </DataTableRow>

                            <DataTableRow
                                expandableContent={
                                    <div >
                                        {allChanges?.unassigns.users.filter(user => fetchedObjects?.users[user.id] && fetchedObjects.users[user.id].organisationUnits.length === 1 ? true : false
                                        ).map(user => <>{user.username}<br /></>)}
                                    </div>
                                }
                                onExpandToggle={() => expanded !== "usesDisable" ? setExpanded('usesDisable') : setExpanded("")}
                                expanded={expanded === "usesDisable"}>
                                <DataTableCell>
                                    Users
                                </DataTableCell>
                                <DataTableCell>
                                    Disable
                                </DataTableCell>
                                <DataTableCell>
                                    {allChanges?.unassigns.users.filter(user => fetchedObjects?.users[user.id] && fetchedObjects.users[user.id].organisationUnits.length === 1 ? true : false
                                    ).length}
                                </DataTableCell>
                            </DataTableRow>
                        </TableBody>


                    </DataTable>
                }
            </ModalContent>
            <ModalActions>
                {(finishedSaving || errorOccured !== null) &&
                    <ButtonStrip end>
                        <Button primary onClick={() => {
                            if (finishedSaving) {
                                onAccept(selectedApproval?.mfrId);
                            } else {
                                onReject();
                            }
                        }}>
                            Close
                        </Button>
                    </ButtonStrip>
                }
                {!finishedSaving && errorOccured === null &&
                    <ButtonStrip end>
                        <Button destructive onClick={() => handleApprove()} >
                            Yes
                        </Button>
                        <Button primary onClick={() => onReject()} >
                            No
                        </Button>
                    </ButtonStrip>
                }
            </ModalActions>
        </Modal >
    )
}