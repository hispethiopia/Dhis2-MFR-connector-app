import { AffectedValues, AllChange, ChangeType, User, UserChange } from "../model/Approvals.model";
import { Configuration, UserConfig } from "../model/Configuration.model";
import { CategoryOption, DataSet, OrganisationUnitGroup } from "../model/Metadata.model";
import { MFRMapped } from "../model/MFRMapped.model";
import stringSimilarity from 'string-similarity'
import { CHANGE_TYPE_CREATE, CHANGE_TYPE_NEW_MAPPING, CHANGE_TYPE_UPDATE } from "./constants";


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

export const getChanges = (mfrObject: MFRMapped,
    existingOrgUnit: any,
    allConfigurations: Configuration[],
    assignedCategoryOptions: CategoryOption[],
    changeType: ChangeType
): AllChange => {
    let newMapping = false;
    if (existingOrgUnit === null && mfrObject.dhisId) {
        newMapping = true;
    }

    const applicableConfigurations = getApplicableConfigurations(allConfigurations, mfrObject);

    let dataSetsToBeAssigned: string[] = []
    let ougsToBeAssigned: string[] = []
    let catCombosToBeAssigned: string[] = []
    let userConfigsToBeAssigned: UserConfig[] = []

    applicableConfigurations.forEach(conf => {
        catCombosToBeAssigned.push(...conf.categoryOptionCombos)
        dataSetsToBeAssigned.push(...conf.dataSets)
        ougsToBeAssigned.push(...conf.orgUnitGroups)
        userConfigsToBeAssigned.push(...conf.userConfigs)
    })

    //This is the objects to unassign from existing orgUnit, if the orgUnit exists already.
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
        existingOrgUnit.dataSets.forEach((ds: DataSet) => {
            if (!dataSetsToBeAssigned.includes(ds.id)) {
                unasignedObjects.dataSets.push(ds.id)
            } else {
                unChangedObjects.dataSets.push(ds.id)
            }
        })
        existingOrgUnit.organisationUnitGroups.forEach((orgUnitGroup: OrganisationUnitGroup) => {
            if (!ougsToBeAssigned.includes(orgUnitGroup.id)) {
                unasignedObjects.organisationUnitGroups.push(orgUnitGroup.id)
            } else {
                unChangedObjects.organisationUnitGroups.push(orgUnitGroup.id)
            }
        })

        assignedCategoryOptions.forEach(co => {
            if (!catCombosToBeAssigned.includes(co.id)) {
                unasignedObjects.categoryOptions.push(co.id)
            } else {
                unChangedObjects.categoryOptions.push(co.id)
            }
        })

        existingOrgUnit.users.forEach((user: User) => {
            //Find the configuration for this user.
            let configurationFound = false;
            userConfigsToBeAssigned.forEach(userConfig => {
                if (user.username === existingOrgUnit.code + userConfig.suffix) {
                    //If the suffix is found, then the user has been found.
                    changedUsers.push({ userConfig, userId: user.id, userName: user.username })
                    configurationFound = true;
                }
            });
            if (!configurationFound) {
                //This means that the user is not found on any configuration. Unassign this user from the orgUnit.
                unasignedObjects.users.push(user)
            }
        })
    }

    //Filter users to create.
    const usersToCreate = userConfigsToBeAssigned.filter(userConfig => {
        let userNotFound = true;
        changedUsers.forEach(userChange => {
            if (userChange.userName === existingOrgUnit.code + userConfig.suffix) {
                userNotFound = false;
                return userNotFound
            }
        })
        return userNotFound;
    })


    let allChange: AllChange = {
        newAssignments: {
            dataSetsToAssign: dataSetsToBeAssigned.filter(ds => !unChangedObjects.dataSets.includes(ds)),
            cocToAssign: catCombosToBeAssigned.filter(co => !unChangedObjects.categoryOptions.includes(co)),
            ougToAssign: ougsToBeAssigned.filter(oug => !unChangedObjects.organisationUnitGroups.includes(oug)),
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
        dhisOrgUnitObject: existingOrgUnit
    }

    return allChange
}

export const findMatchingNames = (stringToFind: string | undefined, stringList: string[]): string[] => {
    if (stringToFind === undefined) {
        return [];
    }
    const bestMatchResult = stringSimilarity.findBestMatch(stringToFind, stringList);
    return bestMatchResult.ratings
        .filter(item => item.rating > 0.8)
        .sort((a, b) => a.rating - b.rating)
        .map(item => item.target);
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
    approvedObject: MFRMapped | Object,
    bulk: boolean = false,
) => {
    let applicableConfigurations: Configuration[] = [];
    allConfigurations.forEach(config => {
        let different = Object.keys(config.optionSets).some(option => {
            //If there is one option that doesn't satisfy then ignore that configuration.
            if (config.optionSets[option] !== (!bulk ? approvedObject[option]?.toString() : "")) {
                return true;
            }
        })
        if (!different) {
            //If all options meet the criteria then consider that configuration.
            applicableConfigurations.push(config)
        }
    });

    return applicableConfigurations
}

export const remapUsingId = (objects) => {
    objects.forEach(obj => {
        objects[obj.id] = obj
    });
}