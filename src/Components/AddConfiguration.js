import React, { useState } from 'react'
import { DataQuery, useDataMutation, useAlert } from '@dhis2/app-runtime'
import { Button, InputField, SingleSelectField, SingleSelectOption, Transfer } from '@dhis2/ui'
import classes from '../App.module.css'
import { useNavigate } from 'react-router-dom';
import { generateId } from '../functions/helpers';

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

const saveMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFR',
    id: ({ Key }) => Key,
    data: ({ data }) => data
}

const AddConfiguration = () => {
    const navigate = useNavigate();
    const [configurationName, setConfigurationName] = useState('')
    const [selectedOptionSets, setSelectedOptionSets] = useState({})
    const [selectedOUGs, setSelectedOUGs] = useState([])
    const [selectedDataSets, setSelectedDataSets] = useState([])
    const [selectedCategoryOptions, setSelectedCategoryOptions] = useState([])
    const [userConfigs, setUserConfigs] = useState([])

    const successAlert = useAlert('Configuration saved successfully!', { duration: 3000 })
    const errorAlert = useAlert('Failed to save configuration', { critical: true })

    const [mutate, { loading: saving, error: saveError }] = useDataMutation(saveMutation)


    const handleCancel = () => {
        navigate('/')
    }

    const handleSave = async () => {
        const toSave = {
            name: configurationName,
            selectedOptionSets,
            selectedOUGs,
            selectedDataSets,
            selectedCategoryOptions,
            userConfigs
        }

        const Key = generateId(11);

        try {
            await mutate({
                Key,
                data: toSave
            })
            successAlert.show()
            navigate(`/`);
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
                    const server_categoryOptions = data.categoryOptions?.categoryOptions?.map(
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
                            {!loading && data &&
                                <>
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
                                        server_categoryOptions.length > 0 &&
                                        <>
                                            <br />
                                            Cateory options
                                            <Transfer
                                                options={server_categoryOptions}
                                                selected={selectedCategoryOptions}
                                                onChange={(e) => {
                                                    setSelectedCategoryOptions(e.selected)
                                                }}
                                            />
                                        </>
                                    }

                                    {
                                        userConfigs.length > 0 && server_userRoles.length > 0 && server_userGroups.length > 0 &&
                                        userConfigs.map(
                                            (userConfig, index) => {
                                                return (
                                                    <>
                                                        <br />
                                                        <InputField
                                                            label='Username suffix'
                                                            name="suffix"
                                                            value={userConfig.suffix}
                                                            onChange={
                                                                e => {
                                                                    let temp = [...userConfigs]
                                                                    temp[index].suffix = e.value
                                                                    setUserConfigs(temp)
                                                                }
                                                            }
                                                            placeholder='Please provide a suffix for the user.'
                                                        />
                                                        <br />
                                                        User Groups
                                                        <Transfer
                                                            options={server_userGroups}
                                                            selected={userConfig.userGroups}
                                                            onChange={(e) => {
                                                                let temp = [...userConfigs]
                                                                temp[index].userGroups = e.selected
                                                                setUserConfigs(temp)
                                                            }}
                                                        />

                                                        <br />
                                                        User Roles
                                                        <Transfer
                                                            options={server_userRoles}
                                                            selected={userConfig.userRoles}
                                                            onChange={(e) => {
                                                                let temp = [...userConfigs]
                                                                temp[index].userRoles = e.selected
                                                                setUserConfigs(temp)
                                                            }}
                                                        />
                                                    </>
                                                )
                                            }
                                        )
                                    }
                                    <br />
                                    <Button onClick={() => {
                                        let tempUserConfigs = [...userConfigs]
                                        tempUserConfigs.push({ postFix: "", userGroups: [], userRoles: [] })
                                        setUserConfigs(tempUserConfigs)
                                    }}>
                                        Add new User
                                    </Button>
                                    <br />
                                    <Button onClick={handleCancel} disabled={saving}>
                                        {saving ? 'Saving...' : 'Cancel'}
                                    </Button>
                                    <Button primary onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    {saveError && <span>Error saving configuration</span>}
                                </>
                            }
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

export default AddConfiguration
