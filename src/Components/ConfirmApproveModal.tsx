import { Button, ButtonStrip, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, Modal, ModalActions, ModalContent, ModalTitle, TableBody, TableHead } from '@dhis2/ui';
import React, { useState } from 'react'
import { useDataMutation } from '@dhis2/app-runtime'
import { AllChange, FetchedObjects } from '../model/Approvals.model';
import { MFRMapped } from '../model/MFRMapped.model';
import { generateId, generatePassword } from '../functions/helpers';
import { UserConfig } from '../model/Configuration.model';
import { CHANGE_TYPE_CREATE, CHANGE_TYPE_DISABLE, MFR_LOCATION_ATTRIBUTE_UID, MFR_OPTION_SETS_ATTRIBUTE_CODE, mfrMapping } from '../functions/constants';
import { FullScreenLoader } from './FullScreenLoader';

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
            { "value": mfrObject?.mfrId, attribute: { "id": MFR_LOCATION_ATTRIBUTE_UID } }
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


export const ConfirmApproveModal: React.FC<ModalProps> = ({
    allChanges, fetchedObjects, onAccept, onReject, selectedApproval, parentOrgUnitId
}) => {

    const [expanded, setExpanded] = useState("");
    const [orgUnitMutation] = useDataMutation(createOrganizationMutation);
    const [metadataMutation] = useDataMutation(updateMetadata);
    const [anyLoading, setAnyLoading] = useState(false)


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

            let metadata: any = {
                users: usersPayload,
                dataSets: dataSetPayload,
                categoryOptions: categoryOptionsPayload,
                organisationUnitGroups: orgUnitGroupsPayload,
            }
            if (allChanges?.changeType === CHANGE_TYPE_CREATE) {
                //If orgUnit is create, send a post request to create the orgUnit first.
                await orgUnitMutation({ data: orgUnitObject })
            } else if (allChanges?.changeType === CHANGE_TYPE_DISABLE) {
                orgUnitObject.name = orgUnitObject.name + "_closed"
                orgUnitObject.closedDate = new Date().toISOString()
                metadata.organisationUnits = [orgUnitObject]
            } else {
                metadata.organisationUnits = [orgUnitObject]
            }

            await metadataMutation({ data: metadata })

        } catch (e) {
            console.error(e)
        }finally{
            
        }
        setAnyLoading(false);

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

            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button destructive onClick={() => handleApprove()} >
                        Yes
                    </Button>
                    <Button primary onClick={() => onReject()} >
                        No
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal >
    )
}