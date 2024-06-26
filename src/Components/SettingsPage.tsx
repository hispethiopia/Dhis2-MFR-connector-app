import { Button, ButtonStrip, InputField, Modal, ModalActions, ModalContent, ModalTitle } from '@dhis2/ui';
import React from 'react'



export const SettingsPage: React.FC = () => {
    return (
        <>
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
            </div >
        </>
    )
}