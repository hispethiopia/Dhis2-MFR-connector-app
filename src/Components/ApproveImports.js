import React from 'react'
import { DataQuery } from '@dhis2/app-runtime'
import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, TableBody, TableHead } from '@dhis2/ui'
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

const ApproveImports = () => {
    const navigate = useNavigate()

    return (
        <div className={classes.container}>
            <h1>Pending imports</h1>
            <DataQuery query={query}>
                {({ error, loading, data }) => {
                    if (error) return <span>ERROR: {error.message}</span>
                    if (loading) return <span>Loading...</span>
                    if (!data || !data.configurations) return <span>No configurations available</span>
                    let pendingApprovals = [
                        {
                            "name": "Addis Ababa Reion",
                            "parent": "FMOH",
                            "change": "Facility name",
                            "chaneTo": "Addi Ababa"
                        },
                        {
                            "name": "Addis Ababa Reion",
                            "parent": "FMOH",
                            "change": "Facility name",
                            "chaneTo": "Addi Ababa"
                        },
                        {
                            "name": "Addis Ababa Reion",
                            "parent": "FMOH",
                            "change": "Facility name",
                            "chaneTo": "Addi Ababa"
                        },
                        {
                            "name": "Addis Ababa Reion",
                            "parent": "FMOH",
                            "change": "Facility name",
                            "chaneTo": "Addi Ababa"
                        }
                    ]


                    return (
                        <DataTable>
                            <TableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        Name
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        Parent
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        Change
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        Change to
                                    </DataTableColumnHeader>

                                    <DataTableColumnHeader>
                                        Reject
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        Approve
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </TableHead>
                            <TableBody>


                                {pendingApprovals.map((pendingApproval, index) => {
                                    return (
                                        <DataTableRow Key={"approval" + index} >
                                            <DataTableCell >
                                                {pendingApproval.name}
                                            </DataTableCell>
                                            <DataTableCell >
                                                {pendingApproval.parent}
                                            </DataTableCell>
                                            <DataTableCell >
                                                {pendingApproval.change}
                                            </DataTableCell>
                                            <DataTableCell >
                                                {pendingApproval.chaneTo}
                                            </DataTableCell>
                                            <DataTableCell >
                                                <Button
                                                    secondary
                                                >
                                                    Reject
                                                </Button>
                                            </DataTableCell>
                                            <DataTableCell>
                                                <Button
                                                    primary
                                                >
                                                    Accept
                                                </Button>
                                            </DataTableCell>
                                        </DataTableRow>
                                    )
                                })}
                            </TableBody>
                        </DataTable>
                    )
                }}
            </DataQuery>
        </div>
    )
}

export default ApproveImports
