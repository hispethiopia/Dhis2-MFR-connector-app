import { Configuration, UserConfig } from "../model/Configuration";
import { MFRMapped } from "../model/MFRMapped";
import { generateId } from "./helpers";

const mfrString = `

[
    {
        "mfrId": "10a3456c-d683-47dd-a602-e5f9c01a7aa5",
        "lastUdated": "2024-05-10T19:26:15.287+00:00",
        "versionId": "5",
        "status": "Approved",
        "createdDate": "2021-06-28T14:18:22.508236",
        "reportingHierarchyId": "10a3456c-d683-47dd-a602-e5f9c01a7aa5/dd02fbd9-ef80-4fb4-8344-d2405881ed42/c1db44a8-2537-42cc-8fd4-41897e5487e1/216c2b25-b9e8-4c47-9750-8b2e5a732f7a/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "closedDate": "2023-02-23T00:00:00",
        "suspensionStartDate": "2023-02-26T00:00:00",
        "suspensionEndDate": "2023-08-25T00:00:00",
        "settlement": "Rural",
        "yearOpened": "2012-03-10",
        "ownership": "Private for profit",
        "operationalStatus": "Operational",
        "name": "new Sumaya Primary Clinic",
        "FT": "Primary Clinic",
        "longitude": 15,
        "latitude": 0,
        "altitude": 0,
        "managingOrganization": "Organization/10a3456c-d683-47dd-a602-e5f9c01a7aa5"
    },
    {
        "mfrId": "2f3cee0c-1550-48e4-a202-6111b86b5bcf",
        "lastUdated": "2024-05-20T09:31:51.467+00:00",
        "versionId": "6",
        "status": "Approved",
        "createdDate": "2022-07-06T13:52:31.344873",
        "reportingHierarchyId": "2f3cee0c-1550-48e4-a202-6111b86b5bcf/981c3a6e-f36e-432d-9a70-9d39d09e32d7/82ace742-7487-42c2-92af-f3982cdc7f93/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Urban",
        "yearOpened": "2010-09-10",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Sedie Health Center",
        "FT": "Health Center",
        "longitude": 37.8907809,
        "latitude": 10.9214546,
        "altitude": 2534,
        "managingOrganization": "Organization/2f3cee0c-1550-48e4-a202-6111b86b5bcf"
    },
    {
        "mfrId": "de8539d8-0de8-44b1-9c90-fb48335e4af6",
        "lastUdated": "2024-05-20T09:52:24.182+00:00",
        "versionId": "7",
        "status": "Approved",
        "createdDate": "2022-07-06T12:58:46.651955",
        "reportingHierarchyId": "de8539d8-0de8-44b1-9c90-fb48335e4af6/ed84b1df-787b-453e-8a56-48059d7d2839/a048c4a5-edd7-41df-b505-dfdbf1a4fc54/ef702aad-e780-4dc7-847a-333504e79b36/ad6f0cdd-6666-476a-8f67-29eca950e35e/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "closedDate": "2024-01-22T00:00:00",
        "suspensionStartDate": "2021-12-26T00:00:00",
        "suspensionEndDate": "2022-01-02T00:00:00",
        "settlement": "Rural",
        "yearOpened": "2021-09-01",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Kole zale Basic Health Post",
        "FT": "Basic Health Post",
        "longitude": 0,
        "latitude": 0,
        "altitude": 0,
        "managingOrganization": "Organization/de8539d8-0de8-44b1-9c90-fb48335e4af6"
    },
    {
        "mfrId": "1d5c06c4-e0c3-4794-a607-d058e3e847b5",
        "lastUdated": "2024-05-10T08:45:55.993+00:00",
        "versionId": "3",
        "status": "Approved",
        "createdDate": "2022-07-06T08:06:46.722924",
        "reportingHierarchyId": "1d5c06c4-e0c3-4794-a607-d058e3e847b5/c508b110-1196-4c25-8d79-61b00e306c34/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Urban",
        "yearOpened": "2001-07-08",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Wenberma Woreda",
        "FT": "Woreda Health Office",
        "longitude": 0,
        "latitude": 0,
        "altitude": 0,
        "managingOrganization": "Organization/1d5c06c4-e0c3-4794-a607-d058e3e847b5"
    },
    {
        "mfrId": "79608bed-62ae-46d1-834a-0c87e328a1a1",
        "lastUdated": "2024-05-10T09:19:39.222+00:00",
        "versionId": "3",
        "status": "Approved",
        "createdDate": "2022-07-06T13:52:31.344873",
        "reportingHierarchyId": "79608bed-62ae-46d1-834a-0c87e328a1a1/146263dc-2b7e-4472-8083-f64b3862c129/aa744f68-597b-4b76-80b7-69a81282b0f8/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Rural",
        "yearOpened": "1975-09-12",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Degaga Health Center",
        "FT": "Health Center",
        "longitude": 39.6356673,
        "latitude": 10.8062025,
        "altitude": 2539.329605,
        "managingOrganization": "Organization/79608bed-62ae-46d1-834a-0c87e328a1a1"
    },
    {
        "mfrId": "f4f14d6b-f6d5-4971-895c-526670a1a8c6",
        "lastUdated": "2024-05-10T09:20:08.972+00:00",
        "versionId": "4",
        "status": "Approved",
        "createdDate": "2022-07-06T13:52:31.344873",
        "reportingHierarchyId": "f4f14d6b-f6d5-4971-895c-526670a1a8c6/fac5634e-43d7-41f3-b3c3-8f314bb0bf0a/aa744f68-597b-4b76-80b7-69a81282b0f8/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Rural",
        "yearOpened": "2010-09-10",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Ewa Health Center ",
        "FT": "Health Center",
        "longitude": 38.933806,
        "latitude": 11.0310717,
        "altitude": 3131.4,
        "managingOrganization": "Organization/f4f14d6b-f6d5-4971-895c-526670a1a8c6"
    },
    {
        "mfrId": "936359fb-784d-47b3-acf9-2cc1de4eb63e",
        "lastUdated": "2024-05-22T09:02:06.758+00:00",
        "versionId": "5",
        "status": "Approved",
        "createdDate": "2024-05-22T08:11:00.041157",
        "reportingHierarchyId": "936359fb-784d-47b3-acf9-2cc1de4eb63e",
        "settlement": "Urban",
        "yearOpened": "2010-01-13",
        "ownership": "Private for profit",
        "operationalStatus": "Operational",
        "name": "Dildiy Pharmacy ",
        "FT": "pharmacy",
        "longitude": 0,
        "latitude": 0,
        "altitude": 0,
        "managingOrganization": "Organization/936359fb-784d-47b3-acf9-2cc1de4eb63e"
    },
    {
        "mfrId": "46b60b99-913e-4c4b-893b-ab9bf7db4759",
        "lastUdated": "2024-05-10T09:23:42.928+00:00",
        "versionId": "4",
        "status": "Approved",
        "createdDate": "2022-07-06T13:52:31.344873",
        "reportingHierarchyId": "46b60b99-913e-4c4b-893b-ab9bf7db4759/85547b7b-65be-4378-a84f-fc06d6a2f3c7/82ace742-7487-42c2-92af-f3982cdc7f93/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Rural",
        "yearOpened": "2003-04-09",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Gachemuam Health Center",
        "FT": "Health Center",
        "longitude": 38.1407181,
        "latitude": 10.4751803,
        "altitude": 2479.947,
        "managingOrganization": "Organization/46b60b99-913e-4c4b-893b-ab9bf7db4759"
    },
    {
        "mfrId": "d3a71b2b-bf2c-4a43-8e64-c51035996b32",
        "lastUdated": "2024-05-10T09:26:40.176+00:00",
        "versionId": "4",
        "status": "Approved",
        "createdDate": "2022-07-06T13:52:31.344873",
        "reportingHierarchyId": "d3a71b2b-bf2c-4a43-8e64-c51035996b32/a4e17cce-6326-48ae-a67b-79c250badde6/9e3c34ea-b962-47fa-ae56-bccd9503a1fe/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Rural",
        "yearOpened": "2008-11-12",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Bekeja Health Center",
        "FT": "Health Center",
        "longitude": 40.0400567,
        "latitude": 10.4801337,
        "altitude": 1672,
        "managingOrganization": "Organization/d3a71b2b-bf2c-4a43-8e64-c51035996b32"
    },
    {
        "mfrId": "f0a06f45-5cf5-419f-9a93-0bea408d3e7e",
        "lastUdated": "2024-05-10T09:33:25.253+00:00",
        "versionId": "4",
        "status": "Approved",
        "createdDate": "2022-07-06T13:52:31.344873",
        "reportingHierarchyId": "f0a06f45-5cf5-419f-9a93-0bea408d3e7e/85547b7b-65be-4378-a84f-fc06d6a2f3c7/82ace742-7487-42c2-92af-f3982cdc7f93/c3cca938-85ef-4d74-bc27-144f59d8e002/ca7de36e-d768-4172-ade0-3c6dc8359de0",
        "settlement": "Rural",
        "yearOpened": "2003-04-09",
        "ownership": "Public/Government",
        "operationalStatus": "Operational",
        "name": "Yekebehana Health Center",
        "FT": "Health Center",
        "longitude": 38.0655738,
        "latitude": 10.6426138,
        "altitude": 2743.202,
        "managingOrganization": "Organization/f0a06f45-5cf5-419f-9a93-0bea408d3e7e"
    }
]
`

export const mfrObjects: MFRMapped = JSON.parse(mfrString)


const orgUnitTemplate =
{
    "code": "4032100300",
    "name": "01 Health Post",
    "created": "2023-05-20T04:38:46.526",
    "lastUpdated": "2024-02-01T08:10:42.777",
    "translations": [],
    "shortName": "01 Health Post",
    "dimensionItemType": "ORGANISATION_UNIT",
    "legendSets": [],
    "parent": { "id": "Ncoy9KGyJPD" },
    "children": [],
    "path": "/b3aCK1PTn5S/XU2wpLlX4Vk/AG9aCPKDjkC/HcN4AWA6EnQ/Ncoy9KGyJPD/kDT7VZQiFKz",
    "openingDate": "1980-01-01T00:00:00.000",
    "dataSets": [{ "id": "GlNthKK8UXL" }, { "id": "IS8jPW53xcP" }, { "id": "zFWFOJEuwBp" }, { "id": "Mre2Z4B9ngj" }, { "id": "T0PqeqN2YhW" }, { "id": "ov9vk4pXq3V" }, { "id": "l7TGupESNGU" }, { "id": "Rwm5GKIxOFV" }, { "id": "XGlOZxRT9re" }, { "id": "oiRxPXrCByy" }, { "id": "CKn66n4gPO5" }, { "id": "mrymNknMzMd" }, { "id": "b4OGd9FeMw3" }, { "id": "uxFwgL2TtLI" }, { "id": "COitmBbuwd1" }, { "id": "JKOfZFr4R5m" }, { "id": "HtR5xK9TKYp" }, { "id": "utWW2sMzSc5" }, { "id": "wJkrUgkwphR" }, { "id": "JXiOYKPIaQ1" }, { "id": "wQsLMMBaJWi" }, { "id": "PgzHGiey7Fq" }, { "id": "AC9yKi1CGpf" }, { "id": "EsC0o3wLISN" }, { "id": "Zu6Bw09tms8" }, { "id": "WrKhOu23Pja" }, { "id": "Mit66Ie5u6x" }],
    "programs": [],
    "users": [],
    "geometry": { "type": "Point", "coordinates": [36.353895, 8.462583] },
    "leaf": true,
    "dimensionItem": "kDT7VZQiFKz",
    "displayShortName": "01 Health Post",
    "displayName": "01 Health Post",
    "access": { "manage": true, "externalize": true, "write": true, "read": true, "update": true, "delete": true },
    "favorite": false,
    "user": { "id": "M5zQapPyTZI", "code": "admin", "name": "admin admin", "displayName": "admin admin", "username": "admin" },
    "externalAccess": false,
    "userGroupAccesses": [],
    "userAccesses": [],
    "href": "http://localhost:8080/api/organisationUnits/kDT7VZQiFKz",
    "displayFormName": "01 Health Post",
    "id": "kDT7VZQiFKz",
    "attributeValues": [],
    "organisationUnitGroups": [{ "id": "hdCBfjmUBua" }, { "id": "FW4oru60vgc" }, { "id": "N8KhYuEFsSX" }], "level": 6, "ancestors": [{ "id": "b3aCK1PTn5S" }, { "id": "XU2wpLlX4Vk" }, { "id": "AG9aCPKDjkC" }, { "id": "HcN4AWA6EnQ" }, { "id": "Ncoy9KGyJPD" }]
}


export const prepareOrganizationsObject = (
    allConfigurations: Configuration[],
    approvedObject: MFRMapped,
    parentId: string,
) => {
    let applicableConfigurations: Configuration[] = [];

    let orgUnitGroups: string[] = []
    let dataSets: string[] = []
    let categoryOptionCombos: string[] = []
    let userConfigs: UserConfig[] = []

    allConfigurations.forEach(config => {
        let allOptionsTrue = true;
        Object.keys(config.optionSets).forEach(option => {
            //If there is one option that doesn't satisfy then ignore that configuration.
            if (config.optionSets[option] !== approvedObject[option]) {
                allOptionsTrue = false;
            }
        })
        if (allOptionsTrue) {
            //If all options meet the criteria then consider that configuration.
            applicableConfigurations.push(config)
            orgUnitGroups.push(...config.orgUnitGroups)
            dataSets.push(...config.dataSets)
            categoryOptionCombos.push(...config.categoryOptionCombos)
            userConfigs.push(...config.userConfigs);
        }
    });


    return {
        code: approvedObject.hmisCode,
        name: approvedObject.name,
        shortName: approvedObject.name,
        parent: {
            "id": parentId
        },
        openingDate: approvedObject.yearOpened,
        dataSets: dataSets.map(dataSet => ({ id: dataSet })),
        geometry: { "type": "Point", "coordinates": [approvedObject.latitude, approvedObject.longitude] },
        id: generateId(11),
        organisationUnitGroups: orgUnitGroups.map(oug => ({ id: oug }))
    }

}