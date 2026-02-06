import { AffectedValues, AllChange, ChangeType, User, UserChange } from "../model/Approvals.model";
import { Configuration, UserConfig } from "../model/Configuration.model";
import { CategoryOption, DataSet, Program, OrganisationUnitGroup } from "../model/Metadata.model";
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
    isAmhara:"isAmhara",
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

export const getChanges = (
    mfrObject: MFRMapped,
    existingOrgUnit: any,
    allConfigurations: Configuration[],
    assignedCategoryOptions: CategoryOption[],
    changeType: ChangeType
): AllChange => {
    console.log("the org units" , existingOrgUnit);

    let newMapping = false;
    if (existingOrgUnit === null && mfrObject.dhisId) {
        newMapping = true;
    }
    
    const applicableConfigurations = getApplicableConfigurations(allConfigurations, mfrObject) || [];
    console.log("applicableConfigurations & mfrobject", applicableConfigurations.length, mfrObject);
    let dataSetsToBeAssigned: string[] = []
    let programsToBeAssigned: string[] = []
    let ougsToBeAssigned: string[] = []
    let catCombosToBeAssigned: string[] = []
    let userConfigsToBeAssigned: UserConfig[] = []

    Array.isArray(applicableConfigurations) && applicableConfigurations.forEach(conf => {
        catCombosToBeAssigned.push(...(conf.categoryOptionCombos || []))
        dataSetsToBeAssigned.push(...(conf.dataSets || []))
        programsToBeAssigned.push(...(conf.programs || []))
        ougsToBeAssigned.push(...(conf.orgUnitGroups || []))
        userConfigsToBeAssigned.push(...(conf.userConfigs || []))
    })

    //This is the objects to unassign from existing orgUnit, if the orgUnit exists already.
    let unasignedObjects: AffectedValues = {
        dataSets: [],
        programs: [],
        categoryOptions: [],
        users: [],
        organisationUnitGroups: []
    }
    let unChangedObjects: AffectedValues = {
        dataSets: [],
        programs: [],
        categoryOptions: [],
        users: [],
        organisationUnitGroups: []
    }
    let changedUsers: UserChange[] = [];

    if (existingOrgUnit) {
        Array.isArray(existingOrgUnit?.dataSets) && (existingOrgUnit?.dataSets || []).forEach((ds: DataSet) => {
            if (!dataSetsToBeAssigned.includes(ds.id)) {
                unasignedObjects.dataSets.push(ds.id)
            } else {
                unChangedObjects.dataSets.push(ds.id)
            }
        })
        Array.isArray(existingOrgUnit?.programs)&&(existingOrgUnit?.programs || []).forEach((program: Program) => {
            if (!programsToBeAssigned.includes(program.id)) {
                unasignedObjects.programs.push(program.id)
            } else {
                unChangedObjects.programs.push(program.id)
            }
        })
        Array.isArray(existingOrgUnit?.organisationUnitGroups)&&(existingOrgUnit?.organisationUnitGroups || []).forEach((orgUnitGroup: OrganisationUnitGroup) => {
            if (!ougsToBeAssigned.includes(orgUnitGroup.id)) {
                unasignedObjects.organisationUnitGroups.push(orgUnitGroup.id)
            } else {
                unChangedObjects.organisationUnitGroups.push(orgUnitGroup.id)
            }
        })

        Array.isArray(assignedCategoryOptions) && (assignedCategoryOptions ?? []).forEach(co => {
            if (!catCombosToBeAssigned.includes(co.id)) {
                unasignedObjects.categoryOptions.push(co.id)
            } else {
                unChangedObjects.categoryOptions.push(co.id)
            }
        })

        Array.isArray(existingOrgUnit?.users) && (existingOrgUnit?.users || [] ).forEach((user: User) => {
            //Find the configuration for this user.
            let configurationFound = false;
            userConfigsToBeAssigned.forEach(userConfig => {
                if (user.username === mfrObject.mfrCode + userConfig.suffix) {
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
            if (userChange.userName === mfrObject.mfrCode + userConfig.suffix) {
                userNotFound = false;
                return userNotFound
            }
        })
        return userNotFound;
    })


    let allChange: AllChange = {
        newAssignments: {
            dataSetsToAssign: dataSetsToBeAssigned.filter(ds => !unChangedObjects.dataSets.includes(ds)),
            programsToAssign: programsToBeAssigned.filter(pr => !unChangedObjects.programs.includes(pr)),
            cocToAssign: catCombosToBeAssigned.filter(co => !unChangedObjects.categoryOptions.includes(co)),
            ougToAssign: ougsToBeAssigned.filter(oug => !unChangedObjects.organisationUnitGroups.includes(oug)),
            usersToCreate: usersToCreate
        },
        unassigns: {
            coc: unasignedObjects.categoryOptions,
            dataSets: unasignedObjects.dataSets,
            programs: unasignedObjects.programs,
            oug: unasignedObjects.organisationUnitGroups,
            users: unasignedObjects.users
        },
        unChangedAssignments: {
            coc: unChangedObjects.categoryOptions,
            dataSets: unChangedObjects.dataSets,
            programs: unChangedObjects.programs,
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
    (Array.isArray(objects) ? objects : []).forEach(obj => {
        (obj.attributeValues ?? []).forEach(attVal => {
            if (attVal?.attribute?.id) {
                obj.attributeValues[attVal.attribute.id] = attVal.value
            }
            if (attVal?.attribute?.code) {
                obj.attributeValues[attVal.attribute.code] = attVal.value
            }
        })
    });
}

// export const getApplicableConfigurations = (
//     allConfigurations: Configuration[],
//     approvedObject: MFRMapped | Object,
//     bulk: boolean = false,
// ) => {
//     console.log("All CONFIGURATIONS:", allConfigurations);
//     const safeConfigs = Array.isArray(allConfigurations)
//         ? allConfigurations
//         : allConfigurations?.[];

//     let applicableConfigurations: Configuration[] = [];
//     console.log("inside",safeConfigs)
//     safeConfigs.forEach(config => {
//         if (bulk) {
//             applicableConfigurations.push(config);
//             return;
//          }
//         const optionSets = config.optionSets || {};
//         console.log("CONFIG OPTION SETS:", optionSets)

//         let different = Object.keys(optionSets).some(option => {
//             const approvedValue = !bulk
//                 ? String(approvedObject?.[option] ?? "")
//                 : "";
//             const configValue = String(optionSets[option] ?? "");
//             console.log("COMPARE:", option, optionSets[option], approvedObject?.[option]);

//             return configValue !== approvedValue;

//         });


//         if (!different) {
//             applicableConfigurations.push(config);
//         }
        
//     });
//     // console.log("MFR OBJECT:", approvedObject);

//     // console.log("applicableConfigurations", applicableConfigurations.length);

//     return applicableConfigurations;
// }

export const getApplicableConfigurations = (
    allConfigurations: any,              // can be array OR { entries: [] }
    approvedObject: MFRMapped | Object,
    bulk: boolean = false,
  ): Configuration[] => {
  
    // Accept either array or paged response
    const safeConfigs: Configuration[] = Array.isArray(allConfigurations)
      ? allConfigurations
      : allConfigurations?.entries ?? [];
  
    // If nothing to filter
    if (!safeConfigs.length) {
      console.warn("No configurations supplied");
      return [];
    }
  
    const applicableConfigurations: Configuration[] = [];
    
    safeConfigs.forEach((config) => {
  
      // Bulk = accept everything
      if (bulk) {
        applicableConfigurations.push(config);
        return;
      }
      console.log("appicable conf",applicableConfigurations)
      const optionSets = config.optionSets || {};
  
      // Check if ANY option differs
      const isDifferent = Object.keys(optionSets).some((option) => {
  
        const configValue = String(optionSets[option] ?? "").trim();
        const approvedValue = String(approvedObject?.[option] ?? "").trim();
  
        return configValue !== approvedValue;
      });
  
      // If none differ → applicable
      if (!isDifferent) {
        applicableConfigurations.push(config);
      }
    });
  
    return applicableConfigurations;
  };
  


// export const remapUsingId = (objects) => {
//     objects.forEach(obj => {
//         objects[obj.id] = obj
//     });
// }

export const remapUsingId = (objects) => {
    const map = {};
    (Array.isArray(objects) ? objects : []).forEach(obj => {
        map[obj.id] = obj;
    });
    return map;
}
