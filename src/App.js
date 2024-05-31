import React, { useState } from 'react'
import { DataQuery, useDataMutation, useAlert } from '@dhis2/app-runtime'
import { Button, InputField, SingleSelectField, SingleSelectOption, Transfer } from '@dhis2/ui'
import classes from './App.module.css'

const query = {
    me: {
        resource: 'me',
    },
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


const saveMutation = {
    type: 'update', 
    resource: 'dataStore/myNamespace', 
    id: ({ key }) => key, 
    data: ({ data }) => data 
}

const MyApp = () => {
    const [configurationName, setConfigurationName] = useState('')
    const [selectedOptionSets, setSelectedOptionSets] = useState({})
    const [selectedOUGs, setSelectedOUGs] = useState([])
    const [selectedDataSets, setSelectedDataSets] = useState([])
    const [selectedUserGroups, setSelectedUserGroups] = useState([])
    const [selectedUserRoles, setSelectedUserRoles] = useState([])

    const successAlert = useAlert('Configuration saved successfully!', { duration: 3000 })
    const errorAlert = useAlert('Failed to save configuration', { critical: true })

    const [mutate, { loading: saving, error: saveError }] = useDataMutation(saveMutation)

    const handleSave = async () => {
        const toSave = {
            name: configurationName,
            selectedOptionSets,
            selectedOUGs,
            selectedDataSets,
            selectedUserGroups,
            selectedUserRoles
        }

        const key = `key_${Date.now()}`

        try {
            await mutate({
                key,
                data: toSave
            })
            successAlert.show()
        } catch (error) {
            console.error('Error saving configuration:', error)
            errorAlert.show()
        }
    }

    return (
        <div className={classes.container}>
            <DataQuery query={query}>
                {({ error, loading, data }) => {
                    if (error) return <span>ERROR</span>
                    if (loading) return <span>...</span>
                    if (!data) return <span>No data available</span>

                    const server_OUGs = data.organisationUnitGroups?.organisationUnitGroups?.map(
                        item => remapToLabelAndValue(item)
                    ) || []
                    const server_dataSets = data.dataSets?.dataSets?.map(
                        item => remapToLabelAndValue(item)
                    ) || []
                    const server_userRoles = data.userRoles?.userRoles?.map(
                        item => remapToLabelAndValue(item)
                    ) || []
                    const server_userGroups = data.userGroups?.userGroups?.map(
                        item => remapToLabelAndValue(item)
                    ) || []
                    const server_optionSets = data.optionSets?.optionSets || []

                    return (
                        <>
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
                                        key={item.id}
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
                                                    key={option.id} 
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
                            {saveError && <span>Error saving configuration</span>}
                        </>
                    )
                }}
            </DataQuery>
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

export default MyApp
