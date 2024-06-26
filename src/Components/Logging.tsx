
import React, { createContext, useEffect, useContext } from "react"
import { useAlert, useDataMutation } from "@dhis2/app-runtime"
import { Log } from "../model/Log.model";
import { Button } from "@dhis2/ui";

const postMutation = {
    type: 'update',
    resource: 'dataStore/Dhis2-MFRLogging',
    id: ({ id }) => id,
    data: ({ data }) => data
}


interface LoggingContextType {
    showAndSaveLog: (data: Log) => Promise<any>;
    showLogOnly: (data: Log) => void;
}


const LogingContext = createContext<LoggingContextType | undefined>(undefined);

export const LoggingProvider: React.FC = ({ children }) => {
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) =>
            type === "Success" ? { success: true, duration: 5000 } : type === "Error" ? { critical: true, duration: 10000 }
                : { duration: 2000 }
    );
    const showLogOnly = async (data: Log) => {
        show({ message: data.message, type: data.logType })
    }

    const [mutate] = useDataMutation(postMutation);

    const showAndSaveLog = async (data: Log) => {
        show({ message: data.message, type: data.logType })
        try {
            const result = await mutate({ id: data.id, data })
            return result;
        } catch (error) {
            show({ message: "Unable to save log", type: "Error" })
            console.error("Unable to save log", error)
        }
    }
    

    return (
        <LogingContext.Provider value={{ showAndSaveLog, showLogOnly }}>
            {children}
        </LogingContext.Provider>
    )
}

export const useLoggingContext = (): LoggingContextType => {
    const context = useContext(LogingContext);
    if (!context) {
        throw new Error('useAlertContext must be used within a LoggingContextProvider')
    }
    return context;
}