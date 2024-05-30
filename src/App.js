import React, { useState } from 'react'
import { DataQuery, useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import classes from './App.module.css'
import { Button, Card, Checkbox, InputField, SingleSelect, SingleSelectField, SingleSelectOption, TextArea, Transfer } from '@dhis2/ui'

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


function MyApp() {
    const [configurationName, setConfigurationName] = useState(null)
    const [selectedOptionSets, setSelectedOptionSets] = useState({})
    const [selectedOUGs, setSelectedOUGs] = useState([])
    const [selectedDataSets, setSelectedDataSets] = useState([])
    const [selectedUserGroups, setSelectedUserGroups] = useState([])
    const [selectedUserRoles, setSelectedUserRoles] = useState([])

    return (
        <div className={classes.container}>
            <DataQuery query={query}>
                {({ error, loading, data }) => {
                    if (error) return <span>ERROR</span>
                    if (loading) return <span>...</span>
                    {
                        const server_OUGs = data.organisationUnitGroups.organisationUnitGroups.map(
                            item => remapToLabelAndValue(item)
                        )
                        const server_dataSets = data.dataSets.dataSets.map(
                            item => remapToLabelAndValue(item)
                        )
                        const server_userRoles = data.userRoles.userRoles.map(
                            item => remapToLabelAndValue(item)
                        )
                        const server_userGroups = data.userGroups.userGroups.map(
                            item => remapToLabelAndValue(item)
                        )

                        const server_optionSets = data.optionSets.optionSets

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
                                    server_optionSets && server_optionSets.map(
                                        item => {
                                            return (
                                                <SingleSelectField
                                                    label={item.displayName}
                                                    selected={selectedOptionSets[item.id]}
                                                    onChange={e => {
                                                        let tempSelectedOptionSets = { ...selectedOptionSets }
                                                        tempSelectedOptionSets[item.id] = e.selected
                                                        setSelectedOptionSets(tempSelectedOptionSets)
                                                    }}>
                                                    {
                                                        item.options.map(option => <SingleSelectOption label={option.displayName} value={option.code} />)
                                                    }
                                                </SingleSelectField>
                                            )
                                        }
                                    )
                                }
                                {
                                    server_OUGs &&
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
                                    server_dataSets &&
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
                                    server_userGroups &&
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
                                <Button primary onClick={e => {

                                    /**
                                     * TODO: Save the object 'toSave' here on data store.
                                     */

                                    const toSave = {
                                        name: configurationName,
                                        selectedOptionSets,
                                        selectedOUGs,
                                        selectedDataSets,
                                        selectedUserGroups,
                                        selectedUserRoles
                                    }
                                }
                                }>Save</Button>
                                <br />
                            </>

                        )
                    }
                }}
            </DataQuery>
        </div >
    )
}

function remapToLabelAndValue(obj) {
    const { displayName, id, ...rest } = obj;
    return {
        label: displayName,
        value: id,
        ...rest
    }
}

export default MyApp
