import { Button, ButtonStrip, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, Modal, ModalActions, ModalContent, ModalTitle, TableBody, TableHead } from '@dhis2/ui';
import React, { useState, useContext, useEffect } from 'react'
import { useDataMutation, useDataQuery } from '@dhis2/app-runtime';
import { MFRMapped } from '../model/MFRMapped.model';
import { CHANGE_TYPE_CREATE, CHANGE_TYPE_NEW_MAPPING, CHANGE_TYPE_UPDATE, MFR_FACILITY_TYPE_ATTRIBUTE_UID, MFR_IS_PHCU_ATTRIBUTE_UID, MFR_LAST_UPDATED_ATTRIBUTE_UID, MFR_LOCATION_ATTRIBUTE_UID, MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID, MFR_OWNERSHIP_ATTRIBUTE_UID, MFR_SETTLEMENT_ATTRIBUTE_UID } from '../functions/constants';
import { FullScreenLoader } from './FullScreenLoader';
import { MetadataContext } from '../App';
import { useLoggingContext } from './Logging';
import { findMatchingNames } from '../functions/services';
import { ChangeType } from '../model/Approvals.model';
import { ConfirmApprovalModal } from './ConfirmApprovalModal';

interface ModalProps {
    pendingApproval: MFRMapped,
    rejectStatus: boolean,
    onClose: Function;
    onCloseAndRefresh: Function
}

/**
 * We just need to get the Id here, because if it is a missmatch, we will ignore everything
 */
const checkOrgUnitUsingMFRIDQuery = {
    organisationUnits: {
        resource: 'organisationUnits',
        params: ({ mfrIds }) => ({
            filter: [
                "attributeValues.attribute.id:eq:" + MFR_LOCATION_ATTRIBUTE_UID,
                , "attributeValues.value:in:[" + mfrIds + "]"
            ],
            fields: "*,attributeValues[value,attribute[id,code]],users[*],ancestors[id,displayName],children[id,displayName]"//we want children because we will check siblings for new creations.
        })
    }
}

const checkOrgUnitUsingMFRCodeQuery = {
    organisationUnits: {
        resource: 'organisationUnits',
        params: ({ mfrCode }) => ({
            filter: [
                "code:eq:" + mfrCode
            ],
            fields: "id"
        })
    }
}

const getOrganisationunitWithDhisId = {
    organisationUnits: {
        resource: 'organisationUnits',
        params: ({ dhisId }) => ({
            filter: "id:eq:" + dhisId,
            fields: "*,attributeValues[value,attribute[id,code]],users[*],ancestors[id,displayName],children[id,displayName]"
        })
    }
}

const getHealthCenterParentDetails = {
    organisationUnits: {
        resource: 'organisationUnits',
        params: ({ dhisId }) => ({
            filter: "id:eq:" + dhisId,
            fields: "parent[*,attributeValues[value,attribute[id,code]],users[*],ancestors[id,displayName],children[id,displayName]]"
        })
    }
}



const settingsQuery = {
    settings: {
        resource: 'dataStore/Dhis2-MFR/settings',
        params: {
            fields: 'name,Key',
            paging: false,
        },
    },
}

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

export const ApproveDetailModal: React.FC<ModalProps> = ({
    pendingApproval, rejectStatus, onClose, onCloseAndRefresh
}) => {

    const metadata = useContext(MetadataContext)

    const { showAndSaveLog, showLogOnly } = useLoggingContext();

    const handlePostRequestError = (message) => {
        showAndSaveLog({
            id: new Date().toISOString(),
            logType: 'Error',
            message: message,
            timestamp: new Date(),
            username: metadata.me.username
        })
    }

    const [errorMessages, setErrorMessages] = useState<string[]>([])
    const [warningMessages, setWarningMessages] = useState<string[]>([])
    const [orgUnit, setOrgUnit] = useState<any>(null);
    const [parentOrgUnit, setParentOrgUnit] = useState<any>(null);
    const [changeType, setChangeType] = useState<ChangeType | null>(null)
    const [approve, setApprove] = useState(false)

    //getFacility and parent.
    let mfrIds = pendingApproval?.reportingHierarchyId.split("/").slice(0, 2);
    //Get DHIS2 orgUnit using the MFR id and the DHIS2 id.
    const { loading: loadingOrgUnitWithMFRId, error: errorOrgUnitWithMFRId, data: ouWithMFRid, refetch: getOrgUnitsWithMfrId } = useDataQuery(checkOrgUnitUsingMFRIDQuery, {
        variables: { mfrIds: mfrIds?.join(',') }
    })

    //Since calling using attribute values takes a lot of time to respond, only call it when it is necessary.
    const { loading: loadingOrgUnitWithMFRCode, error: errorOrgUnitWithMFRCode, data: ouWithMFRCode } = useDataQuery(checkOrgUnitUsingMFRCodeQuery, {
        variables: { mfrCode: pendingApproval?.mfrCode }
    })

    const { loading: loadingHealthCenter, error: errorHealthCenter, data: healthCenter } = pendingApproval.healthCenterId ? useDataQuery(getHealthCenterParentDetails, {
        variables: { dhisId: pendingApproval.healthCenterId }
    }) : { loading: null, error: null, data: null }
    let phcuItem = null

    if (healthCenter?.organisationUnits.organisationUnits[0]?.parent &&
        healthCenter?.organisationUnits.organisationUnits[0]?.parent.displayName.includes("PHCU")) {
        //Now this means that the parent of the health center is found and it is a phcu.
        let tempPhcu = healthCenter?.organisationUnits.organisationUnits[0]?.parent
        tempPhcu.attributeValues.forEach(attribute => {
            tempPhcu.attributeValues[attribute.attribute.id] = attribute.value
            tempPhcu.attributeValues[attribute.attribute.code] = attribute.value
        })
        if ((tempPhcu.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] === ""
            && tempPhcu.attributeValues[MFR_FACILITY_TYPE_ATTRIBUTE_UID] === "") ||
            tempPhcu.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] === pendingApproval.mfrId
        ) {
            //This means that the PHCU is not already mapped, so this is a new mapping. or
            //the phcu is already mapped and has the same expected MFR ID.
            phcuItem = tempPhcu;
        } else {
            //If the above doesn't match, then the PHCU is a new PHCU which needs to be created.
            phcuItem = null;
        }
    }

    const { loading: loadingOrgUnitWithDhisId, error: errorOrgUnitWithDhisId, data: ouWithDhisIdData } = pendingApproval.dhisId ? useDataQuery(getOrganisationunitWithDhisId, {
        variables: { dhisId: pendingApproval?.dhisId }
    }) : { loading: false, error: null, data: null };
    const ouWithDhisId = ouWithDhisIdData?.organisationUnits.organisationUnits[0]
    if (ouWithDhisId) {
        ouWithDhisId.attributeValues.forEach(attribute => {
            ouWithDhisId.attributeValues[attribute.attribute.id] = attribute.value
            ouWithDhisId.attributeValues[attribute.attribute.code] = attribute.value
        })
    }
    const { loading: loadingSettings, error: errorSettings, data: settingsData } = useDataQuery(settingsQuery)
    const settings = settingsData?.settings

    const { loading: loadingRejectedList, data: rejectedList, refetch: getRejectedList } = useDataQuery(rejectedListQuery, { lazy: true })
    const [uploadRejectedList] = useDataMutation(uploadRejectedListQuery, {
        onError: (e) => {
            handlePostRequestError("Reject request failed. Error is " + e.message);
        }
    })

    const allLoading = (loadingOrgUnitWithMFRCode || loadingOrgUnitWithMFRId || loadingRejectedList)

    useEffect(() => {
        if (!loadingOrgUnitWithDhisId && !loadingOrgUnitWithMFRCode && !loadingOrgUnitWithMFRId) {
            let errors: string[] = [];
            let tempChangeType: ChangeType | null = null;
            /**
             * Here compare the DHISid in the pendingApproval with that we get from DHIS2 using the MFR id, and the MFR code are the same, 
             * if they are not the same, then there is a msismatch and we can't map this facility.
             */
            let orgUnitWithMFRId: any = null;
            let parentOrgUnit: any = null;
            ouWithMFRid?.organisationUnits.organisationUnits.forEach(ou => {
                ou.attributeValues.forEach(attribute => {
                    ou.attributeValues[attribute.attribute.id] = attribute.value
                    ou.attributeValues[attribute.attribute.code] = attribute.value
                })
                if (ou.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] === pendingApproval?.mfrId) {
                    orgUnitWithMFRId = ou
                }
                if (ou.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] === pendingApproval?.reportingHierarchyId.split('/')[1]) {
                    parentOrgUnit = ou;
                }
            })

            let orgUnitWithDhisId = pendingApproval.isPHCU ? phcuItem : ouWithDhisId
            console.log("Melaeke phcu item is ", phcuItem, orgUnitWithDhisId, ouWithDhisIdData)


            let orgUnitWithMFRCode = ouWithMFRCode.organisationUnits.organisationUnits[0]

            //Get the orgUnit with DHISid and then make sure the change type reflects that.

            if (orgUnitWithMFRCode && !orgUnitWithMFRId ||
                !orgUnitWithMFRCode && orgUnitWithMFRId ||
                (orgUnitWithMFRId && orgUnitWithMFRCode?.id !== orgUnitWithMFRId?.id)
            ) {
                //If one exists and the other doesn't exist, then there is a wrong missmatch
                errors.push(`Mapping with MFR id and MFR code is not pointing to the same facility.
                    mfrId:"${pendingApproval?.mfrId}" mfrCode:"${pendingApproval?.mfrCode}"`)
            }
            if (orgUnitWithMFRCode && pendingApproval?.dhisId && orgUnitWithMFRCode.id !== pendingApproval.dhisId) {
                errors.push(`Mapping that is done using MFR id and DHIS2 id are not pointing to the same orgUnit.
                    Facility id ${pendingApproval?.mfrId} already pointing to a facility in DHIS2 with Id ${orgUnitWithMFRCode.id} `)
            }
            if (pendingApproval.dhisId && !orgUnitWithDhisId) {
                errors.push(`DHIS2 id from MFR is not pointing to an existing facility.
                    Dhis2 id from MFR is ${pendingApproval?.dhisId}`)
            }
            if (orgUnitWithDhisId.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] !== "" &&
                orgUnitWithDhisId.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] !== pendingApproval.mfrId
            ) {
                errors.push(`The MFR id pointed by the dhisObject is different from the pending approval. Please look at MFR id on the fields.`)
                setOrgUnit(orgUnitWithDhisId)
            }

            if (errors.length === 0 && orgUnitWithMFRId) {
                setOrgUnit(orgUnitWithMFRId)
            } else if (errors.length === 0 && orgUnitWithDhisId) {
                setOrgUnit(orgUnitWithDhisId)
            }


            //Find change type only if there are no errors.
            if (errors.length === 0) {
                if (orgUnitWithMFRId?.attributeValues[MFR_LOCATION_ATTRIBUTE_UID] === pendingApproval.mfrId) {
                    tempChangeType = CHANGE_TYPE_UPDATE
                } else if (pendingApproval.dhisId && orgUnitWithDhisId) {
                    tempChangeType = CHANGE_TYPE_NEW_MAPPING
                } else if (orgUnitWithDhisId) {
                    //This means that there is a mapping already done.
                    tempChangeType = CHANGE_TYPE_UPDATE
                } else {
                    tempChangeType = CHANGE_TYPE_CREATE
                }

                if (parentOrgUnit) {
                    console.log("Melaeke parentOrgunit is ", parentOrgUnit)
                    setParentOrgUnit(parentOrgUnit)

                    if (parentOrgUnit?.children.length > 0 && tempChangeType === CHANGE_TYPE_CREATE) {
                        const siblingsWithSimilarNames = findMatchingNames(pendingApproval?.name, parentOrgUnit.children.map(ou => ou.displayName))
                        if (siblingsWithSimilarNames.length > 0) {
                            const warningMessages = [`There are already facilities with the following names, please make sure the facility you are importing is different. ${siblingsWithSimilarNames.join(" , ")}`]
                            setWarningMessages(warningMessages);
                        }
                    }
                } else {
                    errors.push(`Parent facility not imported into DHIS2. Parent facility id is "${pendingApproval?.reportingHierarchyId.split('/')[1]}`)
                }

                setChangeType(tempChangeType)
            }


            if (tempChangeType === CHANGE_TYPE_CREATE && !settings?.enableCreation) {
                warningMessages.push("Facility creation not allowed because of system settings.")
            }
            setErrorMessages(errors)
        }
    }, [ouWithMFRCode, ouWithMFRid, ouWithDhisId, healthCenter])

    const getCellStyle = (condition) => ({
        backgroundColor: condition ? 'lightgreen' : ''
    })

    const handleReject = async (reject) => {
        //First get the rejected list
        try {
            const rejectedList = await getRejectedList();
            let temp = rejectedList ? rejectedList.rejectedList : []
            if (reject) {
                temp.push(pendingApproval?.mfrId + "_" + pendingApproval?.lastUpdated?.toISOString());
            } else {
                temp = temp.filter(item => item !== pendingApproval?.mfrId + "_" + pendingApproval?.lastUpdated?.toISOString())
            }
            //then push the rejected list to the array and then post it.
            const payLoad = Array.from(new Set(temp))
            uploadRejectedList({ data: payLoad })
            await showAndSaveLog({
                message: `Facility ${reject ? "Un" : ""}Rejected, mfrCode=${pendingApproval?.mfrCode}, lastUpdated on mfr=${pendingApproval?.lastUpdated?.toISOString()}`,
                id: new Date().toISOString(),
                logType: 'Log',
                timestamp: new Date(),
                username: metadata.me.username
            })
            onCloseAndRefresh();
        }
        catch (e) {
        }
    }

    const onCloseConfirmApprovalModal = () => {
        setApprove(false)
    }

    const oldHierarchy = orgUnit?.ancestors.map(item => item.displayName).join('/');
    const newHierarchy = !parentOrgUnit ? "" : parentOrgUnit?.ancestors.map(item => item.displayName).join('/') + "/" + parentOrgUnit?.displayName

    {/**If polygon, just show polygon, but if point, show the point. */ }
    const locationOld = orgUnit?.geometry?.type === "Point" ? orgUnit.geometry.coordinates.join(" / ") : orgUnit?.geometry?.type
    const locationNew = pendingApproval?.longitude + " / " + pendingApproval?.latitude

    return (
        <>
            {approve && changeType &&
                <ConfirmApprovalModal
                    parentOrgUnitId={parentOrgUnit.id}
                    changeType={changeType}
                    existingDhisObject={orgUnit}
                    pendingApproval={pendingApproval}
                    onClose={onCloseConfirmApprovalModal}
                    onCloseSuccessful={() => {
                        setApprove(false)
                        onCloseAndRefresh();
                    }}
                />

            }
            <Modal large>
                {allLoading &&
                    <FullScreenLoader />
                }
                {changeType && errorMessages.length === 0 &&
                    <h1>Status: {changeType === CHANGE_TYPE_NEW_MAPPING ? "New mapping" :
                        changeType === CHANGE_TYPE_CREATE ? "Create new facility" :
                            changeType === CHANGE_TYPE_UPDATE ? "Update orgUnit" : changeType}
                        <br />   Operation: {pendingApproval.operationalStatus === "Closed" ? "Closing" :
                            pendingApproval.operationalStatus === "Operational" ? "Operational" :
                                pendingApproval.operationalStatus === "Curently Not Operational" ? "Closing" :
                                    pendingApproval.operationalStatus === "Suspended" ? "Closing" : pendingApproval.operationalStatus
                        }
                    </h1>

                }{
                    errorMessages.length > 0 &&
                    <h1>Error</h1>
                }
                <ModalContent>
                    <DataTable>
                        <TableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    Field
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    Old
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    New
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </TableHead>
                        <TableBody>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.name !== orgUnit?.name)} >Name</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.name !== orgUnit?.name)} >{orgUnit?.name}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.name !== orgUnit?.name)} >{pendingApproval?.name}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.mfrCode !== orgUnit?.code)} >Code</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.mfrCode !== orgUnit?.code)}>{orgUnit?.code}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.mfrCode !== orgUnit?.code)}>{pendingApproval?.mfrCode}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.mfrId !== orgUnit?.attributeValues[MFR_LOCATION_ATTRIBUTE_UID])}>MFR id</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.mfrId !== orgUnit?.attributeValues[MFR_LOCATION_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_LOCATION_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.mfrId !== orgUnit?.attributeValues[MFR_LOCATION_ATTRIBUTE_UID])}>{pendingApproval?.mfrId}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.dhisId !== orgUnit?.id)}>DHIS2 id</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.dhisId !== orgUnit?.id)}>{orgUnit?.id}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.dhisId !== orgUnit?.id)}>{pendingApproval?.dhisId}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.lastUpdated?.toISOString() !== orgUnit?.attributeValues[MFR_LAST_UPDATED_ATTRIBUTE_UID])}>MFR last updated</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.lastUpdated?.toISOString() !== orgUnit?.attributeValues[MFR_LAST_UPDATED_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_LAST_UPDATED_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.lastUpdated?.toISOString() !== orgUnit?.attributeValues[MFR_LAST_UPDATED_ATTRIBUTE_UID])}>{pendingApproval?.lastUpdated?.toISOString()}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.closedDate !== orgUnit?.closedDate && !(pendingApproval?.closedDate == null && orgUnit?.closedDate == null))}>Closed date</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.closedDate !== orgUnit?.closedDate && !(pendingApproval?.closedDate == null && orgUnit?.closedDate == null))}>{orgUnit?.closedDate}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.closedDate !== orgUnit?.closedDate && !(pendingApproval?.closedDate == null && orgUnit?.closedDate == null))}>{pendingApproval?.closedDate?.toISOString()}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(orgUnit?.openingDate.slice(0, 10) !== pendingApproval?.yearOpened)}>Opening date</DataTableCell>
                                <DataTableCell style={getCellStyle(orgUnit?.openingDate.slice(0, 10) !== pendingApproval?.yearOpened)}>{orgUnit?.openingDate.slice(0, 10)}</DataTableCell>
                                <DataTableCell style={getCellStyle(orgUnit?.openingDate.slice(0, 10) !== pendingApproval?.yearOpened)}>{pendingApproval?.yearOpened}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.FT !== orgUnit?.attributeValues[MFR_FACILITY_TYPE_ATTRIBUTE_UID])}>Facility type</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.FT !== orgUnit?.attributeValues[MFR_FACILITY_TYPE_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_FACILITY_TYPE_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.FT !== orgUnit?.attributeValues[MFR_FACILITY_TYPE_ATTRIBUTE_UID])}>{pendingApproval?.FT}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.settlement !== orgUnit?.attributeValues[MFR_SETTLEMENT_ATTRIBUTE_UID])}>Settlement</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.settlement !== orgUnit?.attributeValues[MFR_SETTLEMENT_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_SETTLEMENT_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.settlement !== orgUnit?.attributeValues[MFR_SETTLEMENT_ATTRIBUTE_UID])}>{pendingApproval?.settlement}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.ownership !== orgUnit?.attributeValues[MFR_OWNERSHIP_ATTRIBUTE_UID])}>Ownership</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.ownership !== orgUnit?.attributeValues[MFR_OWNERSHIP_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_OWNERSHIP_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.ownership !== orgUnit?.attributeValues[MFR_OWNERSHIP_ATTRIBUTE_UID])}>{pendingApproval?.ownership}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(pendingApproval?.operationalStatus !== orgUnit?.attributeValues[MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID])}>Operational status</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.operationalStatus !== orgUnit?.attributeValues[MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.operationalStatus !== orgUnit?.attributeValues[MFR_OPERATIONAL_STATUS_ATTRIBUTE_UID])}>{pendingApproval?.operationalStatus}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell style={getCellStyle(locationOld !== locationNew)}>GPS location</DataTableCell>
                                <DataTableCell style={getCellStyle(locationOld !== locationNew)}>{locationOld}</DataTableCell>
                                <DataTableCell style={getCellStyle(locationOld !== locationNew)} >{locationNew}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow >
                                <DataTableCell style={getCellStyle(pendingApproval?.isPHCU.toString() !== orgUnit?.attributeValues[MFR_IS_PHCU_ATTRIBUTE_UID])}>Is PHCU</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.isPHCU.toString() !== orgUnit?.attributeValues[MFR_IS_PHCU_ATTRIBUTE_UID])}>{orgUnit?.attributeValues[MFR_IS_PHCU_ATTRIBUTE_UID]}</DataTableCell>
                                <DataTableCell style={getCellStyle(pendingApproval?.isPHCU.toString() !== orgUnit?.attributeValues[MFR_IS_PHCU_ATTRIBUTE_UID])}>{pendingApproval?.isPHCU.toString()}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow >
                                <DataTableCell style={getCellStyle(newHierarchy !== oldHierarchy)}>Path</DataTableCell>
                                <DataTableCell style={getCellStyle(newHierarchy !== oldHierarchy)}>{oldHierarchy}</DataTableCell>
                                <DataTableCell style={getCellStyle(newHierarchy !== oldHierarchy)}>{newHierarchy}</DataTableCell>
                            </DataTableRow>
                            <DataTableRow>
                                <DataTableCell >Hierarchy from MFR</DataTableCell>
                                <DataTableCell></DataTableCell>
                                <DataTableCell>{pendingApproval.reportingHierarchyName.split("/").slice(1).reverse().join("/")}</DataTableCell>
                            </DataTableRow>
                        </TableBody>
                    </DataTable>
                    <br />
                    {
                        errorMessages.length > 0 &&
                        <>
                            <div>Errors:</div>
                            {errorMessages.map(error => <div>{error} </div>)}
                        </>
                    }
                    <br />
                    {
                        warningMessages.length > 0 &&
                        <>
                            <div>Warnings:</div>
                            {warningMessages.map(warning => <div>{warning}</div>)}
                        </>
                    }

                </ModalContent>
                <ModalActions>
                    <ButtonStrip end>
                        <Button onClick={() => { onCloseAndRefresh() }} >
                            Cancel
                        </Button>
                        <Button destructive onClick={() =>
                            handleReject(!rejectStatus)
                        } >
                            {rejectStatus ? "Un" : ""}Reject
                        </Button>
                        {!rejectStatus &&
                            < Button primary disabled={errorMessages.length > 0 || (changeType === CHANGE_TYPE_CREATE && !settings?.enableCreation)} onClick={() => setApprove(true)} >
                                Approve
                            </Button>
                        }
                    </ButtonStrip>
                </ModalActions>
            </Modal >
        </>
    )
}