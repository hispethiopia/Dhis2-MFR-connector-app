import { useDataMutation, useDataQuery } from "@dhis2/app-runtime"

const query = {
    optionSets: {
        resource: 'optionSets',
        params: {
            fields: 'id,displayName,code,options[id,code,displayName]',
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
    }
}


function remapToLabelAndValue(obj) {
    const { displayName, id, ...rest } = obj || {}
    return {
        label: displayName || '',
        value: id || '',
        ...rest
    }
}

export const fetchMetadataHook = (metadataReq) => {
    const { loading, error, data, refetch } = useDataQuery(query)
    const remapped = {}
    if (data) {


        remapped.server_OUGs = data.organisationUnitGroups?.organisationUnitGroups?.map(
            item => remapToLabelAndValue(item)
        ) || []
        remapped.server_dataSets = data.dataSets?.dataSets?.map(
            item => remapToLabelAndValue(item)
        ) || []
        remapped.server_userRoles = data.userRoles?.userRoles?.map(
            item => remapToLabelAndValue(item)
        ) || []
        remapped.server_userGroups = data.userGroups?.userGroups?.map(
            item => remapToLabelAndValue(item)
        ) || []
        remapped.server_categoryOptions = data.categoryOptions?.categoryOptions?.map(
            item => remapToLabelAndValue(item)
        ) || []
        remapped.server_optionSets = data.optionSets?.optionSets || []
        remapped.server_options = []
        data.optionSets?.optionSets.map(optionSet => {
            optionSet.options.forEach(option => {
                remapped.server_options.push(option)
                remapped.server_options[option.id] = option
            });
        });
    }
    return { loading, error, data: data ? remapped : null, refetch }
}

