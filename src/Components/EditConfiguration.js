import React, { useState, useEffect } from 'react'
import { useDataQuery, useDataMutation, useAlert } from '@dhis2/app-runtime'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, InputField, SingleSelectField, SingleSelectOption, Transfer } from '@dhis2/ui'
import classes from '../App.module.css'

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
}

const fetchConfigurationQuery = (Key) => ({
    configuration: {
        resource: `dataStore/Dhis2-MFR/${Key}`
    }
})

const updateConfigurationMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFR',
    id: ({ Key }) => Key,
    data: ({ data }) => data
}

const EditConfiguration = () => {
    const { Key } = useParams()
    const navigate = useNavigate()
    const [configuration, setConfiguration] = useState(null)
    const [configurationName, setConfigurationName] = useState('')
    const [selectedOptionSets, setSelectedOptionSets] = useState({})
    const [selectedOUGs, setSelectedOUGs] = useState([])
    const [selectedDataSets, setSelectedDataSets] = useState([])
    const [selectedUserGroups, setSelectedUserGroups] = useState([])
    const [selectedUserRoles, setSelectedUserRoles] = useState([])

    const successAlert = useAlert('Configuration updated successfully!', { duration: 3000 })
    const errorAlert = useAlert('Failed to update configuration', { critical: true })

    const { loading: loadingConfig, error: errorConfig, data: dataConfig } = useDataQuery(fetchConfigurationQuery(Key))
    const { loading: loadingOptions, error: errorOptions, data: dataOptions } = useDataQuery(query)
    const [mutate, { loading: saving, error: saveError }] = useDataMutation(updateConfigurationMutation)

    useEffect(() => {
        if (dataConfig && dataConfig.configuration) {
            const config = dataConfig.configuration
            setConfiguration(config)
            setConfigurationName(config.name || '')
            setSelectedOptionSets(config.selectedOptionSets || {})
            setSelectedOUGs(config.selectedOUGs || [])
            setSelectedDataSets(config.selectedDataSets || [])
            setSelectedUserGroups(config.selectedUserGroups || [])
            setSelectedUserRoles(config.selectedUserRoles || [])
        }
    }, [dataConfig])

    const handleSave = async () => {
        const toSave = {
            name: configurationName,
            selectedOptionSets,
            selectedOUGs,
            selectedDataSets,
            selectedUserGroups,
            selectedUserRoles
        }

        try {
            await mutate({
                Key,
                data: toSave
            })
            successAlert.show()
            navigate(`/`)
        } catch (error) {
            console.error('Error updating configuration:', error)
            errorAlert.show()
        }
    }

    if (loadingConfig || loadingOptions) return <span>Loading...</span>
    if (errorConfig) return <span>ERROR: {errorConfig.message}</span>
    if (errorOptions) return <span>ERROR: {errorOptions.message}</span>
    if (!configuration) return <span>No configuration found</span>

    const server_OUGs = dataOptions.organisationUnitGroups?.organisationUnitGroups?.map(item => remapToLabelAndValue(item)) || []
    const server_dataSets = dataOptions.dataSets?.dataSets?.map(item => remapToLabelAndValue(item)) || []
    const server_userRoles = dataOptions.userRoles?.userRoles?.map(item => remapToLabelAndValue(item)) || []
    const server_userGroups = dataOptions.userGroups?.userGroups?.map(item => remapToLabelAndValue(item)) || []
    const server_optionSets = dataOptions.optionSets?.optionSets || []

    return (
        <div className={classes.container}>
            <InputField
                label='Configuration name'
                name="configurationName"
                value={configurationName}
                onChange={e => setConfigurationName(e.value)}
                placeholder='Please provide a name for this configuration' />
            <br />
            {
                server_optionSets.map(item => (
                    item && item.options && item.displayName &&
                    <SingleSelectField
                        Key={item.id}
                        label={item.displayName}
                        selected={selectedOptionSets[item.id]}
                        onChange={e => {
                            let tempSelectedOptionSets = { ...selectedOptionSets }
                            tempSelectedOptionSets[item.id] = e.selected
                            setSelectedOptionSets(tempSelectedOptionSets)
                        }}>
                        {
                            item.options.map(option => option && option.displayName &&
                                <SingleSelectOption
                                    Key={option.id}
                                    label={option.displayName}
                                    value={option.code}
                                />
                            )
                        }
                    </SingleSelectField>
                ))
            }
            {
                server_OUGs.length > 0 &&
                <>
                    <br />
                    Organisation unit groups
                    <Transfer
                        options={server_OUGs}
                        selected={selectedOUGs}
                        onChange={(e) => {
                            setSelectedOUGs(e.selected)
                        }}
                    />
                </>
            }
            {
                server_dataSets.length > 0 &&
                <>
                    <br />
                    Data sets
                    <Transfer
                        options={server_dataSets}
                        selected={selectedDataSets}
                        onChange={(e) => {
                            setSelectedDataSets(e.selected)
                        }}
                    />
                </>
            }
            {
                server_userGroups.length > 0 &&
                <>
                    <br />
                    User Groups
                    <Transfer
                        options={server_userGroups}
                        selected={selectedUserGroups}
                        onChange={(e) => {
                            setSelectedUserGroups(e.selected)
                        }}
                    />
                </>
            }
            {
                server_userRoles.length > 0 &&
                <>
                    <br />
                    User Roles
                    <Transfer
                        options={server_userRoles}
                        selected={selectedUserRoles}
                        onChange={(e) => {
                            setSelectedUserRoles(e.selected)
                        }}
                    />
                </>
            }
            <br />
            <Button primary onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
            </Button>
            {saveError && <span>Error updating configuration</span>}
        </div>
    )
}

function remapToLabelAndValue(obj) {
    const { displayName, id, ...rest } = obj || {}
    return {
        label: displayName || '',
        value: id || '',
        ...rest
    }
}

export default EditConfiguration
