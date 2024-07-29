import { useDataQuery } from "@dhis2/app-runtime"
import { MFR_OPTION_SETS_ATTRIBUTE_CODE } from "../functions/constants"
import { getEmptyMetadata } from "../model/Metadata.model"

const query = {
    me: {
        resource: 'me',
        params: {
            fields: 'id,displayName,username,organisationUnits[id,displayName,attributeValues[value,attribute[code,id]]]',
            paging: false
        }
    },
    optionSets: {
        resource: 'optionSets',
        params: {
            fields: 'id,displayName,code,options[id,code,displayName],attributeValues[value,attribute[code]]',
            paging: false
        }
    },
    organisationUnitGroups: {
        resource: 'organisationUnitGroups',
        params: {
            fields: 'id,displayName',
            paging: false
        }
    },
    dataSets: {
        resource: 'dataSets',
        params: {
            fields: 'id,displayName',
            paging: false
        }
    },
    userGroups: {
        resource: 'userGroups',
        params: {
            fields: 'id,displayName',
            paging: false
        }
    },
    userRoles: {
        resource: 'userRoles',
        params: {
            fields: 'id,displayName',
            paging: false
        }
    },
    categoryOptions: {
        resource: 'categoryOptions',
        params: {
            fields: 'id,displayName',
            paging: false
        }
    },
    configurations: {
        resource: 'dataStore/Dhis2-MFR',
        params: {
            fields: 'key,name,optionSets,orgUnitGroups,dataSets,categoryOptionCombos,userConfigs',
            paging: false,
        },
    },
}


export const fetchMetadataHook = () => {
    const { loading, error, data, refetch } = useDataQuery(query)

    let metadata = getEmptyMetadata();

    if (data) {
        metadata.organisationUnitGroups = data.organisationUnitGroups?.organisationUnitGroups || []
        metadata.dataSets = data.dataSets?.dataSets || []
        metadata.userRoles = data.userRoles?.userRoles || []
        metadata.userGroups = data.userGroups?.userGroups || []
        metadata.categoryOptions = data.categoryOptions?.categoryOptions || []
        metadata.configurations = data.configurations;


        //remap attributeOption to a new field
        data.me.organisationUnits.forEach(orgUnit => {
            orgUnit.attributeValues.forEach(attVal => {
                orgUnit.attributeValues[attVal.attribute.code] = attVal.value
                orgUnit.attributeValues[attVal.attribute.id] = attVal.value
            })
        })
        metadata.me = data.me

        data.optionSets?.optionSets.map(optionSet => {
            /**
             * Filter only the ones that are MFR types
             */
            let mfrOptionSet = false;
            optionSet.attributeValues.forEach(
                attValue => {
                    if (attValue.attribute.code === MFR_OPTION_SETS_ATTRIBUTE_CODE && attValue.value === "true") {
                        mfrOptionSet = true;
                        metadata.optionSets.push(optionSet)
                    }
                }
            )
            if (mfrOptionSet) {
                optionSet.options.forEach(option => {
                    metadata.options.push(option)
                    metadata.options[option.id] = option
                });
            }
        });
    }
    return { loading, error, data: data ? metadata : null, refetch }
}

