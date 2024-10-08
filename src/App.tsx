import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import ConfigurationList from './Components/ConfigurationList'
import Logs from './Components/Logs.Component'
import { Navigation } from './navigation/Navigation'
import { fetchMetadataHook } from './communication/dhis'
import ConfigurationForm from './Components/ConfigurationForm'
import { Metadata, getEmptyMetadata } from './model/Metadata.model'
import { SettingsPage } from './Components/SettingsPage'
import { LoggingProvider } from './Components/Logging'
import PendingApprovalsList from './Components/PendingApprovalsList'


export const MetadataContext = React.createContext<Metadata>(getEmptyMetadata())

const App = () => {
    const { loading, error, data: metadata } = fetchMetadataHook();

    const css =
        `
.navigation {
    display: flex;
    min-height: 100vh;
    flex-direction: row;
}
.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: top;
    justify-content: top;
    font-size: 1rem;
    margin-left: 5%;
    max-width: 90%;
}
.searchbar {
    width: 30%;
    height: 30px;
    margin-bottom: 10px;
    border-radius: 8px;
}
.left {
    min-width: 200px;
    max-width: 200px;
    min-height: 100vh;
    padding-top: 20px;
}
.right {
    flex-grow: 1;
    min-height: 100vh;
    padding: 26px 16px 0;
    background: #f0f0f0;
}`
    return (
        <div>
            <style>
                {css}
            </style>
            {
                !loading && metadata &&

                <MetadataContext.Provider value={metadata}>
                    <LoggingProvider>
                        {
                            error ?
                                <span>ERROR</span>
                                : loading ?
                                    <span>...</span>
                                    : !metadata ?
                                        <span>No data available</span>
                                        : <></>
                        }
                        <Router>
                            <div className='navigation'>
                                <div className='left'>
                                    <Navigation />
                                </div>
                                <div className='right'>
                                    <Routes>
                                        <Route path="/" element={<PendingApprovalsList />} />
                                        <Route path="/edit" element={<ConfigurationList />} />
                                        <Route path="/add" element={<ConfigurationForm />} />
                                        <Route path="/logs" element={<Logs />} />
                                        <Route path="/edit/:Key" element={<ConfigurationForm />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                    </Routes>
                                </div>
                            </div>
                        </Router>
                    </LoggingProvider>
                </MetadataContext.Provider>
            }
        </div>
    )
}

export default App
