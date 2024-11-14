import React, { useState, useContext, useEffect, useCallback } from 'react'
import { useDataQuery } from '@dhis2/app-runtime';
import { MetadataContext } from "../App"
import { MFRMapped } from '../model/MFRMapped.model'
import { MFR_LOCATION_ATTRIBUTE_UID, MFRMapping } from '../functions/constants';
import { debounce, remapMFR } from '../functions/services';
import { changeToPHCUName } from '../functions/helpers';
import { FullScreenLoader } from './FullScreenLoader';
import { Button, DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, Pagination, Switch, TableBody, TableHead } from '@dhis2/ui';
import { ApproveDetailModal } from './ApproveDetailModal';

const pendingApprovalsQuery = {
    approvalStatus: {
        resource: 'dataStore/Dhis2-MFRApproval',
        params: ({ page, pageSize, searchTerm, captureMfrId, showWithDhisId }) => {
            let filter = [`${MFRMapping.reportingHierarchyIdCondensed}:like:${captureMfrId}`];
            if (searchTerm !== '') {
                filter.push(`${MFRMapping.name}:ilike:${searchTerm}`);
            }
            if (showWithDhisId) {
                filter.push(`resource_identifier_dhisId:!null`);
            }
            return {
                fields: '.',
                page,
                pageSize,
                filter
            };
        },
    },
    approvalWithId: {
        resource: 'dataStore/Dhis2-MFRApproval',
        params: ({ page, pageSize, searchTerm, captureMfrId, showWithDhisId }) => {
            let filter = [`${MFRMapping.reportingHierarchyIdCondensed}:like:${captureMfrId}`];
            if (searchTerm !== '') {
                filter.push(`${MFRMapping.mfrId}:ilike:${searchTerm}`);
            }
            if (showWithDhisId) {
                filter.push(`resource_identifier_dhisId:!null`);
            }
            return {
                fields: '.',
                page,
                pageSize,
                filter
            };
        },
    }
};

const rejectedListQuery = {
    rejectedList: {
        resource: 'dataStore/Dhis2-MFR/rejectedList',
    }
};

const PendingApprovalsList = () => {
    const metadata = useContext(MetadataContext);

    const [pendingApprovals, setPendingApprovals] = useState<MFRMapped[]>();
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [showRejectedList, setShowRejectedList] = useState(false);
    const [showWithDhisId, setShowWithDhisId] = useState(false);
    const [selectedPendingApproval, setSelectedPendingApproval] = useState<MFRMapped | null>(null);

    const { loading: loadingRejectedList, data: rejectedList, refetch: getRejectedList } = useDataQuery(rejectedListQuery);
    const { loading: loadingPendingApprovals, error: errorPendingApprovals, data: allApprovals, refetch: refetchPendingApprovals } = useDataQuery(
        pendingApprovalsQuery, {
            variables: {
                page: pageNumber,
                pageSize: pageSize,
                searchTerm: searchTerm || '',
                captureMfrId: metadata.me.organisationUnits[0].attributeValues[MFR_LOCATION_ATTRIBUTE_UID],
                showWithDhisId
            }
        }
    );

    const [finishedLoading, setFinishedLoading] = useState(loadingRejectedList || loadingPendingApprovals);
    let remappedRejectedList = {};
    if (rejectedList) {
        rejectedList.rejectedList.forEach(item => {
            remappedRejectedList[item] = true;
        });
    }
        useEffect(() => {
        if (allApprovals && getRejectedList) {
            let userOrgUnitsMFRids = metadata.me.organisationUnits.map(orgUnit => orgUnit.attributeValues[MFR_LOCATION_ATTRIBUTE_UID]);
            let mappedApprovals = remapMFR(allApprovals.approvalStatus.entries);
            mappedApprovals.push(...remapMFR(allApprovals.approvalWithId.entries));
            let finalList: MFRMapped[] = [];
            let ids: string[] = [];

            mappedApprovals.forEach(approval => {
                if (approval.mfrId && ids.includes(approval.mfrId)) {
                    return null;
                }
                if (approval.mfrId) {
                    ids.push(approval.mfrId);
                }
                if (approval.isPHCU) {
                    let phcuApproval: MFRMapped = { ...approval };
                    phcuApproval.mfrId = approval.mfrId + "_PHCU";
                    phcuApproval.facilityId = approval.facilityId + "_PHCU";
                    phcuApproval.mfrCode = approval.mfrCode + "_PHCU";
                    phcuApproval.dhisId = "";
                    phcuApproval.healthCenterId = approval.dhisId;
                    phcuApproval.name = changeToPHCUName(phcuApproval.name);

                    phcuApproval.reportingHierarchyId = phcuApproval.mfrId + "/" +
                        phcuApproval.reportingHierarchyId.split('/').slice(1).join('/');
                    approval.reportingHierarchyId = approval.mfrId + '/' + phcuApproval.reportingHierarchyId;

                    phcuApproval.reportingHierarchyName = phcuApproval.name + "/"
                        + phcuApproval.reportingHierarchyName.split('/').slice(1).join('/');
                    approval.reportingHierarchyName = approval.name + "/" + phcuApproval.reportingHierarchyName;

                    approval.isPHCU = false;
                    finalList.push(phcuApproval);
                } else if (approval.isParentPHCU) {
                    let hierarchyId = approval.reportingHierarchyId.split('/');
                    hierarchyId[1] = hierarchyId[1] + "_PHCU";
                    approval.reportingHierarchyId = hierarchyId.join("/");

                    let hierarchyName = approval.reportingHierarchyName.split('/');
                    hierarchyName[1] = changeToPHCUName(hierarchyName[1]);
                    approval.reportingHierarchyName = hierarchyName.join('/');
                }
                finalList.push(approval);
            });

            const appropriateApprovals = finalList.filter(approval => {
                return userOrgUnitsMFRids.some(userOrgUnitMFRid => approval.reportingHierarchyId?.includes(userOrgUnitMFRid.toString()));
            });

            setPendingApprovals(appropriateApprovals);
            setFinishedLoading(true);
        }

    }, [allApprovals, rejectedList]);

    useEffect(() => {
        setFinishedLoading(false);
        refetchPendingApprovals({
            page: pageNumber,
            pageSize: pageSize,
            searchTerm: searchTerm || '',
            captureMfrId: metadata.me.organisationUnits[0].attributeValues[MFR_LOCATION_ATTRIBUTE_UID],
            showWithDhisId
        });
    }, [pageNumber, pageSize, searchTerm, showWithDhisId]);

    const handleSearch = useCallback(debounce((value) => {
        setSearchTerm(value);
        setPageNumber(1);
    }, 500), []);

    const handleFilterChange = e => {
        setFilterValue(e.target.value);
        handleSearch(e.target.value);
    };
    
    
    return (
        <div className='container'>
            <h1>Pending Imports</h1>
            {!(rejectedList && allApprovals) && <FullScreenLoader />}
            
          
            <div style={{display:"flex"}}>
            <Switch
                checked={showRejectedList}
                onChange={() => setShowRejectedList(!showRejectedList)}
                label="Show rejected only"
            />

            
            <Switch
                checked={showWithDhisId}
                onChange={() => setShowWithDhisId(!showWithDhisId)}
                label="Show only with DHIS ID"
            />
            </div>
            

            <input className='searchbar'
                type='text'
                placeholder='Search...'
                value={filterValue}
                onChange={handleFilterChange}
            />

            {rejectedList && allApprovals && (
                <>
                    <DataTable>
                        <TableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>Name</DataTableColumnHeader>
                                <DataTableColumnHeader>MFR code</DataTableColumnHeader>
                                <DataTableColumnHeader>DHIS id</DataTableColumnHeader>
                                <DataTableColumnHeader>Parent</DataTableColumnHeader>
                                <DataTableColumnHeader>Facility type</DataTableColumnHeader>
                                <DataTableColumnHeader>Last updated</DataTableColumnHeader>
                                {showRejectedList && <DataTableColumnHeader>Status</DataTableColumnHeader>}
                                <DataTableColumnHeader>Details</DataTableColumnHeader>
                            </DataTableRow>
                        </TableHead>
                        <TableBody>
                            {
                                pendingApprovals?.filter(pendingApproval => {
                                    let rejected = remappedRejectedList[pendingApproval.mfrId + "_" + pendingApproval.lastUpdated?.toISOString()]

                                    // Apply filters: rejected list, DHIS ID toggle, and search term
                                    const matchesDhisId = showWithDhisId 
                                        ? !!pendingApproval.dhisId || pendingApproval.name.endsWith('_PHCU')
                                        : true;
                                    const matchesRejected = showRejectedList ? rejected : true;

                                    return matchesDhisId && matchesRejected;
                                }).map(pendingApproval => {
                                    let rejected = remappedRejectedList[pendingApproval.mfrId + "_" + pendingApproval.lastUpdated?.toISOString()]
                                    return (
                                        <DataTableRow key={pendingApproval.mfrId}>
                                            <DataTableCell>{pendingApproval.name}</DataTableCell>
                                            <DataTableCell>{pendingApproval.mfrCode}</DataTableCell>
                                            <DataTableCell>{pendingApproval.dhisId}</DataTableCell>
                                            <DataTableCell>{pendingApproval.reportingHierarchyName.split('/')[1]}</DataTableCell>
                                            <DataTableCell>{pendingApproval.FT}</DataTableCell>
                                            <DataTableCell>{pendingApproval.lastUpdated?.toISOString()}</DataTableCell>
                                            {showRejectedList && <DataTableCell>{rejected ? "Rejected" : "Pending"}</DataTableCell>}
                                            <DataTableCell>
                                                <Button secondary onClick={() => setSelectedPendingApproval(pendingApproval)}>
                                                    View details
                                                </Button>
                                            </DataTableCell>
                                        </DataTableRow>
                                    );
                                })
                            }
                        </TableBody>
                    </DataTable>
                    <Pagination
                                pageSize={pageSize}
                                page={pageNumber}
                                onPageChange={(pageNum) => {
                                    setPageNumber(pageNum)
                                }}
                                pageCount={pendingApprovals && pendingApprovals.length >= pageSize ? pageNumber + 1 : pageNumber}
                                // hidePageSelect
                                
                                onPageSizeChange={(size) => {
                                    setPageSize(size)
                                }} 
                                                      
                                />
                                
                </>
            )}

            {selectedPendingApproval && (
                <ApproveDetailModal
                    onClose={() => setSelectedPendingApproval(null)}
                    onCloseAndRefresh={() => {
                        refetchPendingApprovals();
                        getRejectedList();
                        setSelectedPendingApproval(null);
                    }}
                    pendingApproval={selectedPendingApproval}
                    rejectStatus={remappedRejectedList[selectedPendingApproval.mfrId + "_" + selectedPendingApproval.lastUpdated?.toISOString()]}
                />
            )}
        </div>
    )
}

export default PendingApprovalsList
