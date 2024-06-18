import { Button, ButtonStrip, Modal, ModalActions, ModalContent, ModalTitle } from '@dhis2/ui';
import React from 'react'

interface ModalProps {
    title: string;
    message: string;
    onAccept: Function;
    onReject: Function;
}


export const CustomModal: React.FC<ModalProps> = ({
    title, message, onAccept, onReject
}) => {
    return (
        <Modal large>
            <ModalTitle>
                {title}
            </ModalTitle>
            <ModalContent>
                {message}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button destructive onClick={() => onAccept()} >
                        Yes
                    </Button>
                    <Button primary onClick={() => onReject()} >
                        No
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}