import React from 'react'
import { DataQuery } from '@dhis2/app-runtime'
import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, TableBody, TableFoot, TableHead } from '@dhis2/ui'
import { useNavigate } from 'react-router-dom'
import classes from '../App.module.css'

const query = {
    configurations: {
        resource: 'dataStore/Dhis2-MFR',
        params: {
            fields: 'name,Key',
            paging: false,
        },
    },
}

const ConfigurationList = () => {
    const navigate = useNavigate()

    return (
        <div className={classes.container}>
            <h1>Configurations</h1>
            <DataQuery query={query}>
                {({ error, loading, data }) => {
                    if (error) return <span>ERROR: {error.message}</span>
                    if (loading) return <span>Loading...</span>
                    if (!data || !data.configurations) return <span>No configurations available</span>


                    console.log(data.configurations);

                    return (
                        <DataTable>
                            <TableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        Name
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        Delete
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </TableHead>
                            <TableBody>


                                {Object.values(data.configurations).map(config => {
                                    return (
                                        <DataTableRow Key={config.Key} >
                                            <DataTableCell onClick={() => navigate(`/edit/${config.key}`)}>
                                                <h3>
                                                    {config.name}
                                                </h3>
                                            </DataTableCell>
                                            <DataTableCell>
                                                <Button
                                                    destructive
                                                    onClick={() => navigate(`/delete/${config.key}`)}
                                                >
                                                    Delete
                                                </Button>
                                            </DataTableCell>
                                        </DataTableRow>
                                    )
                                })}
                            </TableBody>
                            <TableFoot>
                                <DataTableRow>

                                    <DataTableCell>
                                        <Button primary onClick={() => navigate('/add')}>
                                            Add Configuration
                                        </Button>
                                    </DataTableCell>
                                </DataTableRow>
                            </TableFoot>
                        </DataTable>
                    )
                }}
            </DataQuery>
        </div>
    )
}

export default ConfigurationList
