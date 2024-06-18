import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import ConfigurationList from './Components/ConfigurationList'
import ApproveImports from './Components/ApproveImports'
import Logs from './Components/Logs'
import { Navigation } from './navigation/Navigation'
import styles from './App.module.css'
import { fetchMetadataHook } from './communication/dhis'
import ConfigurationForm from './Components/ConfigurationForm'

export const MetadataContext = React.createContext(null)

const App = () => {
    const { loading, error, data: metadata, refetch } = fetchMetadataHook();


    return (
        <div>
            <MetadataContext.Provider value={{ metadata }}>
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
                    <div className={styles.navigation}>
                        <div className={styles.left}>
                            <Navigation />
                        </div>
                        <div className={styles.right}>
                            <Routes>
                                <Route path="/" element={<ConfigurationList />} />
                                <Route path="/add" element={<ConfigurationForm />} />
                                <Route path="/approveImports" element={<ApproveImports />} />
                                <Route path="/logs" element={<Logs />} />
                                <Route path="/edit/:Key" element={<ConfigurationForm />} />
                            </Routes>
                        </div>
                    </div>
                </Router>
            </MetadataContext.Provider>
        </div>
    )
}

export default App
