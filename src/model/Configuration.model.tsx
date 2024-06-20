export interface UserConfig {
    suffix: string;
    userRoles: string[],
    userGroups: string[]
}

export interface Configuration {
    /**
     * The uid of the configuration
     */
    key: string,
    /**
     * This is the name of the configuration
     */
    name: string,
    /**
     * This is the optionSets selected for the configuration
     */
    optionSets: string[],
    /**
     * This is the selected orgUnitGroups
     */
    orgUnitGroups: string[],
    /**
     * This holds the dataSets selected for theOrgUnitGroups
     */
    dataSets: string[],
    /**
     * This holds the categoryOptionCombos of the configuration [OPD1,IPD2...]
     */
    categoryOptionCombos: string[],
    /**
     * This is an array of objects whose structure is:
     * {
     * prefix: string,
     * 
     * }
     */
    userConfigs: UserConfig[]
}

export interface ConfigurationCondensed {
    name: string,
    key: string,
}