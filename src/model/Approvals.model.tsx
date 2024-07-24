import { CHANGE_TYPE_CREATE, CHANGE_TYPE_DELETE, CHANGE_TYPE_DISABLE, CHANGE_TYPE_NEW_MAPPING, CHANGE_TYPE_UPDATE } from "../functions/constants";
import { UserConfig } from "./Configuration.model";
import { CategoryOption, DataSet, OrganisationUnitGroup, UserGroup, UserRole } from "./Metadata.model";

interface User {
    userRoles: UserRole[],
    userGroups: UserGroup[],
    username: string,
    id: string,
    organisationUnits: {
        id: string
    }
}

interface AffectedValues {
    dataSets: string[],
    categoryOptions: string[],
    organisationUnitGroups: string[],
    users: User[],
}

interface UserProperties {
    userRoles: UserRole[],
    userGroups: UserGroup[]
}

interface a {
    /**
     * This is a string array because We need to get this from ther user Configs which are only ids.
     */
    assign: { userRoles: string[], userGroups: string[] },
    unassign: UserProperties,
    unchanged: UserProperties,
    user: User
}

interface UserChange {
    userId: string,
    userConfig: UserConfig,
    userName: string,
}

type ChangeType = typeof CHANGE_TYPE_CREATE | typeof CHANGE_TYPE_DISABLE | typeof CHANGE_TYPE_UPDATE | typeof CHANGE_TYPE_NEW_MAPPING

interface AllChange {
    newAssignments: {
        dataSetsToAssign: string[],
        cocToAssign: string[],
        ougToAssign: string[],
        usersToCreate: UserConfig[],
    },
    unChangedAssignments: {
        dataSets: string[],
        coc: string[]
        oug: string[],
        users: User[],
    },
    unassigns: {
        dataSets: string[],
        coc: string[]
        oug: string[],
        users: User[],
    }
    changedUsers: UserChange[],
    changeType: ChangeType,
    dhisOrgUnitObject: any,
}

interface FetchedObjects {
    orgUnitGroups: any;
    dataSets: any;
    categoryOptions: any;
    users: any;
}

export {
    AffectedValues,
    User,
    UserChange,
    UserProperties,
    FetchedObjects,
    AllChange,
    ChangeType
}