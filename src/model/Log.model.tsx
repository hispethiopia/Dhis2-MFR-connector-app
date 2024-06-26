type LogType = 'Error' | 'Success' | 'Log';


export interface Log {
    //The id is the time
    id: string,
    logType: LogType,
    username: string,
    timestamp: Date,
    message: string,
}