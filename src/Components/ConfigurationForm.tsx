import React, { useState, useContext, useEffect, useRef } from 'react'
import { useDataMutation, useAlert, useDataQuery } from '@dhis2/app-runtime'
import { Button, InputField, SingleSelectField, SingleSelectOption, Transfer } from '@dhis2/ui'
import { useNavigate, useParams } from 'react-router-dom';
import { generateId } from '../functions/helpers';
import { MetadataContext } from '../App';

import { Configuration } from '../model/Configuration.model'


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
    userConfigs: [],
    key: ""
}

interface FieldValidationError {
    error: boolean;
    message: string;
}

interface ValidationError {
    optionSets: { [code: string]: FieldValidationError };
    name: FieldValidationError;
    duplicateConfiguration: FieldValidationError;
    errorSummary: boolean,
    messageSummary: string;
}

const initValidationError: ValidationError = {
    optionSets: {},
    name: { error: false, message: "" },
    duplicateConfiguration: { error: false, message: "" },
    errorSummary: false,
    messageSummary: "",
}

const ConfigurationForm: React.FC = () => {
    /**
     * If key has value then it means that we are editing an existing configuration
     * otherwise we are creating a new configuration.
     */
    const { Key } = useParams()
    const navigate = useNavigate();

    const successAlert = useAlert('Configuration saved successfully!', { duration: 3000 })
    const errorAlert = useAlert('Failed to save configuration', { critical: true })

    const [validationError, setValidationError] = useState(initValidationError);

    const metadata = useContext(MetadataContext)
    const [configurationObject, setConfigurationObject] = useState<Configuration>(initializeConfigs)
    const [mutate, { loading: saving, error: saveError }] = useDataMutation(createMutation)
    const { loading: loadingConfig, error: errorConfig, data: dataConfig, refetch, called } = useDataQuery(getConfiguration(Key), {
        /**
         * Setting lazy to true so that it won't make a query request unless refetch is called.
         */
        lazy: true
    })
    if (Key && !called) {
        refetch(Key)
    }

    function debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        }
    }

    const checkValidation = (configuration: Configuration) => {
        let tempError: ValidationError = {
            duplicateConfiguration: { error: false, message: "" },
            errorSummary: false,
            messageSummary: "",
            name: { error: false, message: "" },
            optionSets: {},
        }
        //check if there are any empty fields.
        let foundFieldNotEntered = false;
        metadata.optionSets.forEach(option => {
            if (!configuration.optionSets[option.code]) {
                tempError.optionSets[option.code] = {
                    error: true,
                    message: "Mandatory field"
                }
                foundFieldNotEntered = true;
                tempError.errorSummary = true;
                tempError.messageSummary = "Please make sure mandatory fields are provided."
            }
        })

        //Don't need to check for duplicates if there are any fields not provided.
        if (!foundFieldNotEntered) {

            //make sure that the id is the same and not empty
            metadata.configurations.filter(item => item.key != configuration.key)
                .forEach(config => {
                    //Check if name is unique in all configurations.
                    if (config.name === configuration.name) {
                        tempError.errorSummary = true;
                        tempError.messageSummary = "Make sure that name is unique"
                        tempError.name = { error: true, message: "Name should be unique." }
                    }
                    //check if all options do match with any other configuration.
                    let res = metadata.optionSets.every(option => {
                        return configuration.optionSets[option.code] === config.optionSets[option.code];
                    })
                    if (res) {
                        tempError.errorSummary = true;
                        tempError.messageSummary = "Make sure that configuration is unique"
                        tempError.duplicateConfiguration = { error: true, message: "Configuration should be unique" }
                    }
                })
        }

        //Check if usernames are unique.
        const userNames = configuration.userConfigs.map(item => item.suffix)
        const uniqeUserNames = new Set(userNames);
        if (uniqeUserNames.size !== userNames.length) {
            tempError.errorSummary = true;
            tempError.messageSummary = "Please make sure that the usernames are unique."
        }

        setValidationError(tempError)
        return
    }


    const configurationObjectRef = useRef(configurationObject);
    useEffect(() => {
        configurationObjectRef.current = configurationObject
    }, [configurationObject])

    const debouncedCheckValidation = useRef(debounce(() => {
        checkValidation(configurationObjectRef.current)
    }, 500)).current;

    useEffect(() => {
        if (dataConfig && called) {
            setConfigurationObject(dataConfig.configuration)
        }
    }, [dataConfig]);

    useEffect(() => {
        if ((Key && called && dataConfig) || !Key)
            debouncedCheckValidation();
    }, [configurationObject]);

    const handleCancel = () => {
        navigate('/edit')
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
        let payload = {
            ...configurationObject,
            key: id
        }

        try {
            await mutate({
                id,
                data: payload,
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
            <div className='container'>
                {
                    metadata &&
                    <>
                        <InputField
                            label='Configuration name'
                            name="name"
                            error={validationError.name.error}
                            validationText={validationError.name.error ? validationError.name.message : ""}
                            value={configurationObject.name}
                            onChange={e => setConfigurationField({ field: 'name', value: e.value })}
                            placeholder='Please provide a name for this configuration' />
                        <br />
                        {
                            metadata.optionSets.map(item => (
                                item && item.options && item.displayName &&
                                <SingleSelectField
                                    label={item.displayName}
                                    required
                                    error={validationError.optionSets[item.code]?.error}
                                    selected={configurationObject.optionSets[item.code]}
                                    onChange={e => {
                                        let tempSelectedOptionSets = { ...configurationObject.optionSets }
                                        tempSelectedOptionSets[item.code] = e.selected
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
                            metadata.organisationUnitGroups.length > 0 &&
                            <>
                                <br />
                                Organisation unit groups
                                <Transfer
                                    filterable
                                    options={metadata.organisationUnitGroups
                                        .map(group => {
                                            return { value: group.id, label: group.displayName }
                                        })
                                    }
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
                            metadata.dataSets.length > 0 &&
                            <>
                                <br />
                                Data sets
                                <Transfer
                                    filterable
                                    options={metadata.dataSets.map(
                                        ds => { return { label: ds.displayName, value: ds.id } }
                                    )}
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
                            metadata.categoryOptions.length > 0 &&
                            <>
                                <br />
                                Cateory options
                                <Transfer
                                    filterable
                                    options={metadata.categoryOptions.map(co => {
                                        return { label: co.displayName, value: co.id }
                                    })}
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
                        <br />
                        <Button
                            secondary
                            onClick={() => {
                                let tempUserConfigs = [...configurationObject.userConfigs]
                                tempUserConfigs.push({ suffix: "_", userGroups: [], userRoles: [] })
                                setConfigurationField({ field: 'userConfigs', value: tempUserConfigs })
                            }}>
                            Add new User
                        </Button>

                        {
                            configurationObject.userConfigs.length > 0 && metadata.userRoles.length > 0 && metadata.userGroups.length > 0 &&
                            configurationObject.userConfigs.map(
                                (userConfig, index) => {
                                    return (
                                        <>
                                            <br />
                                            <InputField
                                                label='Username suffix'
                                                name="suffix"
                                                value={userConfig.suffix}
                                                error={configurationObject.userConfigs.filter(item => item !== userConfig).some(conf => conf.suffix === userConfig.suffix)}
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
                                                filterable
                                                options={metadata.userGroups.map(ug => {
                                                    return { label: ug.displayName, value: ug.id }
                                                })}
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
                                                filterable
                                                options={metadata.userRoles.map(ur => {
                                                    return { label: ur.displayName, value: ur.id }
                                                })}
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
                        <Button onClick={handleCancel} disabled={saving}>
                            {saving ? 'Saving...' : 'Cancel'}
                        </Button>
                        <br />
                        <Button primary
                            onClick={handleSave}
                            disabled={validationError.errorSummary}
                            title={validationError.errorSummary ? validationError.messageSummary : ""}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>

                        <br />
                        <Button
                            destructive
                        >
                            Reapply this configuration
                        </Button>
                        {saveError && <span>Error saving configuration</span>}
                    </>
                }
            </div >
        </div>
    )
}


export default ConfigurationForm
