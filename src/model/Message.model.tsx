interface IdArray {
    id: string;
}

export interface Message {
    subject: string,
    text: string,
    userGroups: IdArray[],
    users: IdArray[],
    organisationUnits: IdArray[],
}