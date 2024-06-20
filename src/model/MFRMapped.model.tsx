/*interface MFRObject {
    id: string,
    meta: {
        versionId: number,
        lastUpdated: Date,
    },
    extension: {
        status: string,
        reportingHierarchyId: string,
        createdDate: string,
        facilityInformation: {
            extension: {
                closedDate: Date,
                suspensionStartDate: Date,
                suspensionEndDate: Date,
                settlement: String,
                otherDiagnosticAndImagingServices: String,
                yearOpened: Date,
                ownership: String,
                isPrimaryHealthCareUnit: Boolean,
            }
        }
    },
    identifier: {
        oldIdentificationNumber: string,
        ethiopianNationalFacilityId: string,
        hmisCode: string,
        echisId: string,
        dhisId: string,
        facilityId: string,
    },
    operationalStatus: String,
    name: string,
    FT: string,
    position: {
        longitude: string,
        latitude: string,
        altitude: string,
    }
}*/

type OperationalStatus = 'Operational' |'Closed' | 'Suspended' | 'Currently Not Operational';




export interface MFRMapped {
    /**
     * facility id in mfr. Something like this : c319e5c7-6f10-4c6b-aff8-61f8105b9327
     */
    mfrId: string,
    /**
     * Date time of MFR, found in meta.lastUpdated
     */
    lastUdated: Date,
    /**
     * facility version id, which is incrementing on update. found in meta.versionId.
     */
    versionId: number,
    /**
     * the status of the facility wether it is approved or not.
     */
    status: OperationalStatus,
    /**
     * Date facility was created in MFR
     */
    createdDate: Date,
    /**
     * The path of the facility using MFR ids.
     *  */ 
    reportingHierarchyId: string,
    /**
     * Closed date in MFR.
     */
    closedDate: Date,
    suspensionStartDate: Date,
    suspensionEndDate: Date,
    /**
     * Type of settlement in MFR.
     */
    settlement: string,
    yearOpened: string,
    ownership: string,
    oldIdentificationNumber: string,
    ethiopianNationalFacilityId: string,
    hmisCode: string,
    echisId: string,
    dhisId: string,
    facilityId,
    operationalStatus: string,
    name: string,
    FT: string,
    longitude: number,
    latitude: number,
    altitude: number,
    managingOrganization: number,
}