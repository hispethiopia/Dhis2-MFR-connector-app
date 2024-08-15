import { Button, ButtonStrip, Checkbox, InputField, Modal, ModalActions, ModalContent, ModalTitle } from '@dhis2/ui';
import React from 'react'
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import { FullScreenLoader } from './FullScreenLoader';

const query = {
    settings: {
        resource: 'dataStore/Dhis2-MFR/settings',
        params: {
            fields: 'name,Key',
            paging: false,
        },
    },
}

const createMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFR/settings',
    data: ({ data }) => data
}


export const SettingsPage: React.FC = () => {


    const { loading, error, data, refetch, called } = useDataQuery(query)
    const settings = data ? data.settings : null;
    const [mutate, { loading: saving, error: saveError }] = useDataMutation(createMutation)


    return (
        <>
            {(loading || saving) && <FullScreenLoader />}
            {!loading &&
                <div>
                    <br />
                    <br />
                    <Button>
                        Clean up Logs
                    </Button>
                    <br />
                    <br />
                    <Button>
                        Clean up Messages
                    </Button>
                    <br />
                    <br />
                    <Button>
                        Clean up rejected List
                    </Button>
                    <br />
                    <br />
                    <Checkbox label="Enable OrgUnit creations." checked={settings?.enableCreation}
                        onChange={async (value) => {
                            await mutate({
                                data:
                                    settings ? { ...settings, enableCreation: value.checked } : { enableCreation: value.checked }
                            })
                            await refetch();
                        }}>
                    </Checkbox>
                </div >
            }
        </>
    )
}