import { AffectedValues, User, UserChange, UserProperties } from "../model/Approvals.model";
import { Configuration, UserConfig } from "../model/Configuration.model";
import { MFRMapped } from "../model/MFRMapped.model";
import { UserRole } from "../model/Metadata.model";
import { generateId } from "./helpers";


const mfrMapping = {
    mfrId: "resource_id",
    /**
     * Date time of MFR, found in meta_lastUpdated
     */
    lastUpdated: "resource_meta_lastUpdated",
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
    mfrCode: "resource_identifier_facilityId",
    dhisId: "resource_identifier_dhisId",
    facilityId: "resource_extension_FacilityInformation_facilityId",
    operationalStatus: "resource_operationalStatus_display",
    name: "resource_name",
    FT: "resource_type_FT",
    longitude: "resource_position_longitude",
    latitude: "resource_position_latitude",
    altitude: "resource_position_altitude",
    managingOrganization: "resource_managingOrganization_reference",
    isPHCU: "resource_extension_FacilityInformation_isPrimaryHealthCareUnit",
    isParentPHCU: "isParentPHCU",
    reportingHierarchyName: "resource_extension_reportingHierarchy"
}

export const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        const context = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            func.apply(context, args);
        }, delay);
    };
};

export const remapMFR = (mfrObjects: any[]): MFRMapped[] => {
    return mfrObjects.map(mfrObj => {
        const dhisObj: MFRMapped = {} as MFRMapped;

        Object.keys(mfrMapping).forEach(field => {
            const value = mfrObj.value[mfrMapping[field]];
            //Convert value to correct type for necessary ones.
            switch (field) {
                case 'lastUpdated':
                    dhisObj[field] = value ? new Date(value) : null;
                    break;
                case 'createdDate':
                    dhisObj[field] = value ? new Date(value) : null;
                    break;
                case 'closedDate':
                    dhisObj[field] = value ? new Date(value) : null;
                    break;
                case 'suspensionEndDate':
                    dhisObj[field] = value ? new Date(value) : null;
                    break;
                case 'suspensionStartDate':
                    dhisObj[field] = value ? new Date(value) : null;
                    break;
                default:
                    dhisObj[field] = value
                    break;
            }
        })
        return dhisObj;
    })
}

export const remapAttributeValues = (objects) => {
    objects.forEach(obj => {
        obj.attributeValues.forEach(attVal => {
            if (attVal.attribute.id) {
                obj.attributeValues[attVal.attribute.id] = attVal.value
            }
            if (attVal.attribute.code) {
                obj.attributeValues[attVal.attribute.code] = attVal.value
            }
        })
    });
}

export const getApplicableConfigurations = (
    allConfigurations: Configuration[],
    approvedObject: MFRMapped,
) => {
    let applicableConfigurations: Configuration[] = [];
    allConfigurations.forEach(config => {
        let allOptionsTrue = true;
        Object.keys(config.optionSets).forEach(option => {
            //If there is one option that doesn't satisfy then ignore that configuration.
            if (config.optionSets[option] !== approvedObject[option].toString()) {
                allOptionsTrue = false;
            }
        })
        if (allOptionsTrue) {
            //If all options meet the criteria then consider that configuration.
            applicableConfigurations.push(config)
        }
    });

    return applicableConfigurations
}



/*
export const getUserChange = (userConfig: UserConfig, userObject: User) => {
    let userChanges: UserChange = {
        assign: {
            userGroups: [],
            userRoles: [],
        },
        unassign: {
            userGroups: [],
            userRoles: [],
        },
        unchanged: {
            userGroups: [],
            userRoles: [],
        },
        user: userObject
    };

    userObject.userRoles.forEach((assignedRole: UserRole) => {
        if (userConfig.userRoles.includes(assignedRole.id)) {
            //This means that the assigned role is ok.
            userChanges.unchanged.userRoles.push(assignedRole)
        } else {
            userChanges.unassign.userRoles.push(assignedRole)
        }
    })

    userObject.userGroups.forEach(assignedGroup => {
        if (userConfig.userGroups.includes(assignedGroup.id)) {
            //This means that the assigned group is ok.
            userChanges.unchanged.userGroups.push(assignedGroup)
        } else {
            userChanges.unassign.userGroups.push(assignedGroup)
        }
    })

    userChanges.assign.userRoles.push(...userConfig.userRoles.filter(role => {
        return !userChanges.unchanged.userRoles.map(ur => ur.id).includes(role)
    }))

    userChanges.assign.userGroups.push(...userConfig.userGroups.filter(group => {
        return !userChanges.unchanged.userGroups.map(ug => ug.id).includes(group)
    }))

    return userChanges;
}*/

export const remapUsingId = (objects) => {
    objects.forEach(obj => {
        objects[obj.id] = obj
    });
}

/*
export const prepareOrganizationsObject = (
    allConfigurations: Configuration[],
    approvedObject: MFRMapped,
    parentId: string,
) => {
    /*
    let { orgUnitGroups, dataSets, categoryOptionCombos, userConfigs } = getAffectedMetadata(allConfigurations, approvedObject)

    return {
        code: approvedObject.hmisCode,
        name: approvedObject.name,
        shortName: approvedObject.name,
        parent: {
            "id": parentId
        },
        openingDate: approvedObject.yearOpened,
        dataSets: dataSets.map(dataSet => ({ id: dataSet })),
        geometry: { "type": "Point", "coordinates": [approvedObject.latitude, approvedObject.longitude] },
        id: generateId(11),
        organisationUnitGroups: orgUnitGroups.map(oug => ({ id: oug }))
    }

}*/