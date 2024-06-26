export const MFR_LOCATION_ATTRIBUTE_UID = "Jc6iMhyGt6x"
export const MFR_OPTION_SETS_ATTRIBUTE_CODE = "MFR_OPTION_SETS"
export const MFR_LOCATION_CODE = "MFR_LOCATION_ID"
export const MFR_OPTION_SETS_ATTRUBUTE_UID="DxkKrvXAe5y"
export const CHANGE_TYPE_CREATE = "CHANGE_TYPE_CREATE"
export const CHANGE_TYPE_UPDATE = "CHANGE_TYPE_UPDATE"
export const CHANGE_TYPE_DELETE = "CHANGE_TYPE_DELETE"
export const CHANGE_TYPE_DISABLE = "CHANGE_TYPE_DISABLE"

export const USER_GROUPS_TO_SEND_MESSAGE=[
    {id:"sjVAIaP2jZd"}
]


export const USER_CHANGE_TYPES = {
    CHANGE: "CHANGE",
    UNCHANGE: "UNCHANGE",
    UNASSIGN: "UNASSIGN"
}



export const mfrMapping = {
    mfrId: "resource.id",
    /**
     * Date time of MFR, found in meta.lastUpdated
     */
    lastUdated: "resource.meta.lastUpdated",
    /**
     * facility version id, which is incrementing on update. found in meta.versionId.
     */
    versionId: "resource.meta.versionId",
    /**
     * the status of the facility wether it is approved or not.
     */
    status: "resource.extension.status",
    /**
     * Date facility was created in MFR
     */
    createdDate: "resource.extension.createdDate",
    /**
     * The path of the facility using MFR ids.
     *  */
    reportingHierarchyId: "resource.extension.reportingHierarchyId",
    /**
     * Closed date in MFR.
     */
    closedDate: "resource.extension.FacilityInformation.closedDate",
    suspensionStartDate: "resource.extension.FacilityInformation.suspensionStartDate",
    suspensionEndDate: "resource.extension.FacilityInformation.suspensionEndDate",
    /**
     * Type of settlement in MFR.
     */
    settlement: "resource.extension.FacilityInformation.settlement",
    yearOpened: "resource.extension.FacilityInformation.yearOpened",
    ownership: "resource.extension.FacilityInformation.ownership",
    oldIdentificationNumber: "resource.extension.FacilityInformation.oldIdentificationNumber",
    ethiopianNationalFacilityId: "resource.extension.FacilityInformation.ethiopianNationalFacilityId",
    hmisCode: "resource.extension.FacilityInformation.hmisCode",
    echisId: "resource.extension.FacilityInformation.echisId",
    dhisId: "resource.extension.FacilityInformation.dihsId",
    facilityId: "resource.extension.FacilityInformation.facilityId",
    operationalStatus: "resource.operationalStatus.display",
    name: "resource.name",
    FT: "resource.type.FT",
    longitude: "resource.position.longitude",
    latitude: "resource.position.latitude",
    altitude: "resource.position.altitude",
    managingOrganization: "resource.managingOrganization.reference",
    isPHCU: ""
}