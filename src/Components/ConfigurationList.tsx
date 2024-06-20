import React, { useState } from 'react'
import { useDataQuery, useDataMutation, useAlert } from '@dhis2/app-runtime'

import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, TableBody, TableFoot, TableHead } from '@dhis2/ui'
import { useNavigate } from 'react-router-dom'
import { CustomModal } from './CustomModal'
import { ConfigurationCondensed } from '../model/Configuration.model'
const query = {
    configurations: {
        resource: 'dataStore/Dhis2-MFR',
        params: {
            fields: 'name,Key',
            paging: false,
        },
    },
}

const deleteMutation = {
    type: 'delete',
    resource: 'dataStore/Dhis2-MFR/',
    id: ({ id }) => id
}


const ConfigurationList = () => {

    const navigate = useNavigate()

    const [showModal, setShowModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ConfigurationCondensed | null>(null)

    const [mutate, { loading: saving, error: saveError }] = useDataMutation(deleteMutation)
    const successAlert = useAlert('Configuration deleted successfully!', { duration: 3000 })
    const errorAlert = useAlert('Failed to delete configuration', { critical: true })

    const { loading, error, data, refetch, called } = useDataQuery(query)
    let configs = data ? data.configurations as ConfigurationCondensed[] : []

    return (
        <div>
            <div className='container'>
                <h1>Configurations</h1>
                {
                    showModal && !saveError &&
                    <CustomModal
                        title='Delete'
                        message={`Are you sure you want to delete the configuration ${itemToDelete?.name}`}
                        onAccept={async () => {
                            //do the actual deletion here.

                            await mutate({ id: itemToDelete?.key })
                            setShowModal(false)
                            setItemToDelete(null)
                            refetch();
                            successAlert.show();
                        }}
                        onReject={() => {
                            setItemToDelete(null)
                            setShowModal(false)
                        }}
                    />

                }
                {
                    /**
                     * TODO: Change this error to be something visually appealing
                     * Now if delete failed, client needs to refresh browser.
                     */
                    saveError &&

                    <h1>Saving error</h1>
                }
                {
                    error &&
                    <span>ERROR: {error.message}</span>
                }
                {
                    loading &&
                    <span>Loading...</span>
                }
                {
                    configs && configs.length == 0 &&
                    <span>No configurations available</span>
                }

                {configs &&
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


                            {Object.values(configs).map(config => {
                                return (
                                    <DataTableRow  >
                                        <DataTableCell onClick={() => navigate(`/edit/${config.key}`)}>
                                            <h3>
                                                {config.name}
                                            </h3>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <Button
                                                destructive
                                                onClick={
                                                    () => {
                                                        setItemToDelete(config);
                                                        setShowModal(true)
                                                    }
                                                }
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
                                    <Button primary onClick={
                                        () => navigate('/add')
                                    }>
                                        Add Configuration
                                    </Button>
                                </DataTableCell>
                            </DataTableRow>
                        </TableFoot>
                    </DataTable>
                }
            </div>

        </div >
    )
}

export default ConfigurationList
