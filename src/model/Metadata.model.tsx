import { Configuration } from "./Configuration.model"

interface AttributeValue {
    value: string,
    attribute: {
        code: string
    }
}

interface OrganisationUnitGroup {
    id: string,
    displayName: string,
}

interface DataSet {
    id: string,
    displayName: string,
}

interface UserGroup {
    id: string,
    displayName: string,
}

interface UserRole {
    id: string,
    displayName: string,
}

interface CategoryOption {
    id: string,
    displayName: string,
}

interface Option {
    id: string,
    code: string,
    displayName: string
}

interface OptionSet {
    id: string,
    displayName: string,
    code: string,
    attributeValues: AttributeValue[],
    options: Option[],
}

interface OrganisationUnitCondensed {
    id: string,
    displayName: string,
    attributeValues: {[code: string]: String}
}


interface Metadata {
    organisationUnitGroups: OrganisationUnitGroup[],
    dataSets: DataSet[],
    userRoles: UserRole[],
    userGroups: UserGroup[],
    categoryOptions: CategoryOption[],
    optionSets: OptionSet[],
    options: Option[],
    configurations: Configuration[],
    me: {
        organisationUnits: OrganisationUnitCondensed[],
        username: string,
    }
}

const getEmptyMetadata = (): Metadata => {
    return {
        categoryOptions: [],
        configurations: [],
        organisationUnitGroups: [],
        dataSets: [],
        options: [],
        optionSets: [],
        userGroups: [],
        userRoles: [],
        me: {
            organisationUnits: [],
            username: ''
        },
    }
}

export {
    AttributeValue,
    OrganisationUnitGroup,
    DataSet,
    UserGroup,
    UserRole,
    CategoryOption,
    Option,
    OptionSet,
    Metadata,
    getEmptyMetadata
}
