import React from 'react'
import { DataQuery } from '@dhis2/app-runtime'
import { Button } from '@dhis2/ui'
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
                        <ul>
                            {Object.values(data.configurations).map(config => {
                                console.log(config.key)
                                return(
                                <li Key={config.Key} className={classes.listItem}>
                                    <span>{config.name}</span>
                                    <Button
                                        secondary
                                        onClick={() => navigate(`/edit/${config.key}`)}
                                    >
                                        Edit
                                    </Button>
                                </li>
                            )})}
                            <Button primary onClick={() => navigate('/add')}>
                                Add Configuration
                            </Button>
                        </ul>
                    )
                }}
            </DataQuery>
        </div>
    )
}

export default ConfigurationList
