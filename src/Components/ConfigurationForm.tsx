import React, { useState, useContext, useEffect } from 'react'
import { useDataMutation, useAlert, useDataQuery } from '@dhis2/app-runtime'
import { Button, InputField, SingleSelectField, SingleSelectOption, Transfer } from '@dhis2/ui'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { generateId } from '../functions/helpers';
import { fetchMetadataHook } from '../communication/dhis';
import { MetadataContext } from '../App';

import { Configuration } from '../model/Configuration'


/**
 * This is a mutation for creating configurations
 */
const createMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFR',
    id: ({ id }) => id,
    data: ({ data }) => data
}



const getConfiguration = (key) => ({
    configuration: {
        resource: `dataStore/Dhis2-MFR/${key}`
    }
})

const initializeConfigs: Configuration = {
    name: "",
    optionSets: [],
    orgUnitGroups: [],
    dataSets: [],
    categoryOptionCombos: [],
    userConfigs: []
}

const ConfigurationForm: React.FC = () => {
    const css =
        `.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: top;
    justify-content: top;
    font-size: 1rem;
    margin-left: 5%;
    max-width: 90%;
    }`
    /**
     * If key has value then it means that we are editing an existing configuration
     * otherwise we are creating a new configuration.
     */
    const { Key } = useParams()
    const navigate = useNavigate();

    const [configurationObject, setConfigurationObject] = useState<Configuration>(initializeConfigs)

    const { loading: loadingConfig, error: errorConfig, data: dataConfig, refetch, called } = useDataQuery(getConfiguration(Key), {
        /**
         * Setting lazy to true so that it won't make a query request unless refetch is called.
         */
        lazy: true
    })
    if (Key && !called) {
        refetch(Key)
    }

    useEffect(() => {
        if (dataConfig && called) {
            setConfigurationObject(dataConfig.configuration)
        }
    }, [dataConfig]);



    /**
     * TODO: implement the metadatacontext in TS. and make sure there is a default value 
     * to be returned during initialization.
     */
    const metadata = useContext(MetadataContext).metadata


    const [mutate, { loading: saving, error: saveError }] = useDataMutation(createMutation)


    const successAlert = useAlert('Configuration saved successfully!', { duration: 3000 })
    const errorAlert = useAlert('Failed to save configuration', { critical: true })


    const handleCancel = () => {
        navigate('/')
    }

    const setConfigurationField = ({ field, value }) => {
        setConfigurationObject(
            prevConfiguration => ({
                ...prevConfiguration,
                [field]: value
            })
        )
    }


    const handleSave = async () => {
        const id = Key ? Key : generateId(11);

        try {
            await mutate({
                id,
                data: configurationObject,
            })
            successAlert.show()
            navigate(`/`);
        } catch (error) {
            console.error('Error saving configuration:', error)
            errorAlert.show()
        }
    }

    return (
        <div>
            <style>
                {css}
            </style>
            <div className='container'>
                {
                    metadata &&
                    <>
                        <InputField
                            label='Configuration name'
                            name="name"
                            value={configurationObject.name}
                            onChange={e => setConfigurationField({ field: 'name', value: e.value })}
                            placeholder='Please provide a name for this configuration' />
                        <br />
                        {
                            metadata.server_optionSets.map(item => (
                                item && item.options && item.displayName &&
                                <SingleSelectField
                                    label={item.displayName}
                                    selected={configurationObject.optionSets[item.id]}
                                    onChange={e => {
                                        let tempSelectedOptionSets = { ...configurationObject.optionSets }
                                        tempSelectedOptionSets[item.id] = e.selected
                                        setConfigurationField({
                                            field: 'optionSets', value: tempSelectedOptionSets
                                        })
                                    }}>
                                    {
                                        item.options.map(option => option && option.displayName &&
                                            <SingleSelectOption
                                                label={option.displayName}
                                                value={option.code}
                                            />
                                        )
                                    }
                                </SingleSelectField>
                            ))
                        }
                        {
                            metadata.server_OUGs.length > 0 &&
                            <>
                                <br />
                                Organisation unit groups
                                <Transfer
                                    options={metadata.server_OUGs}
                                    selected={configurationObject.orgUnitGroups}
                                    onChange={(e) => {
                                        setConfigurationField({
                                            field: 'orgUnitGroups',
                                            value: e.selected
                                        })
                                    }}
                                />
                            </>
                        }
                        {
                            metadata.server_dataSets.length > 0 &&
                            <>
                                <br />
                                Data sets
                                <Transfer
                                    options={metadata.server_dataSets}
                                    selected={configurationObject.dataSets}
                                    onChange={(e) => {
                                        setConfigurationField(
                                            {
                                                field: 'dataSets',
                                                value: e.selected
                                            })
                                    }}
                                />
                            </>
                        }
                        {
                            metadata.server_categoryOptions.length > 0 &&
                            <>
                                <br />
                                Cateory options
                                <Transfer
                                    options={metadata.server_categoryOptions}
                                    selected={configurationObject.categoryOptionCombos}
                                    onChange={(e) => {
                                        setConfigurationField({
                                            field: 'categoryOptionCombos',
                                            value: e.selected
                                        })
                                    }}
                                />
                            </>
                        }

                        {
                            configurationObject.userConfigs.length > 0 && metadata.server_userRoles.length > 0 && metadata.server_userGroups.length > 0 &&
                            configurationObject.userConfigs.map(
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
                                                        let temp = [...configurationObject.userConfigs]
                                                        temp[index].suffix = e.value ? e.value : ""
                                                        setConfigurationField({
                                                            field: 'userConfigs',
                                                            value: temp
                                                        })
                                                    }
                                                }
                                                placeholder='Please provide a suffix for the user.'
                                            />
                                            <br />
                                            User Groups
                                            <Transfer
                                                options={metadata.server_userGroups}
                                                selected={userConfig.userGroups}
                                                onChange={(e) => {
                                                    let temp = [...configurationObject.userConfigs]
                                                    temp[index].userGroups = e.selected
                                                    setConfigurationField({
                                                        field: 'userConfigs',
                                                        value: temp
                                                    })
                                                }}
                                            />
                                            <br />
                                            User Roles
                                            <Transfer
                                                options={metadata.server_userRoles}
                                                selected={userConfig.userRoles}
                                                onChange={(e) => {
                                                    let temp = [...configurationObject.userConfigs]
                                                    temp[index].userRoles = e.selected
                                                    setConfigurationField({
                                                        field: 'userConfigs',
                                                        value: temp
                                                    })
                                                }}
                                            />
                                        </>
                                    )
                                }
                            )
                        }
                        <br />
                        <Button onClick={() => {
                            let tempUserConfigs = [...configurationObject.userConfigs]
                            tempUserConfigs.push({ suffix: "_", userGroups: [], userRoles: [] })
                            setConfigurationField({ field: 'userConfigs', value: tempUserConfigs })
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
            </div >
        </div>
    )
}


export default ConfigurationForm
