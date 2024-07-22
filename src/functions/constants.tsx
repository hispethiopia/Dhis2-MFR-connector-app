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
    mfrId: "resource_id",
    /**
     * Date time of MFR, found in meta_lastUpdated
     */
    lastUdated: "resource_meta_lastUpdated",
    /**
     * facility version id, which is incrementing on update_ found in meta_versionId_
     */
    versionId: "resource_meta_versionId",
    /**
     * the status of the facility wether it is approved or not_
     */
    status: "resource_extension_status",
    /**
     * Date facility was created in MFR
     */
    createdDate: "resource_extension_createdDate",
    /**
     * The path of the facility using MFR ids_
     *  */
    reportingHierarchyId: "resource_extension_reportingHierarchyId",
    /**
     * Closed date in MFR_
     */
    closedDate: "resource_extension_FacilityInformation_closedDate",
    suspensionStartDate: "resource_extension_FacilityInformation_suspensionStartDate",
    suspensionEndDate: "resource_extension_FacilityInformation_suspensionEndDate",
    /**
     * Type of settlement in MFR_
     */
    settlement: "resource_extension_FacilityInformation_settlement",
    yearOpened: "resource_extension_FacilityInformation_yearOpened",
    ownership: "resource_extension_FacilityInformation_ownership",
    oldIdentificationNumber: "resource_extension_FacilityInformation_oldIdentificationNumber",
    ethiopianNationalFacilityId: "resource_extension_FacilityInformation_ethiopianNationalFacilityId",
    hmisCode: "resource_extension_FacilityInformation_hmisCode",
    echisId: "resource_extension_FacilityInformation_echisId",
    dhisId: "resource_extension_FacilityInformation_dihsId",
    facilityId: "resource_extension_FacilityInformation_facilityId",
    operationalStatus: "resource_operationalStatus_display",
    name: "resource_name",
    FT: "resource_type_FT",
    longitude: "resource_position_longitude",
    latitude: "resource_position_latitude",
    altitude: "resource_position_altitude",
    managingOrganization: "resource_managingOrganization_reference",
    isPHCU: ""
}