import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import ConfigurationList from './Components/ConfigurationList'
import AddConfiguration from './Components/AddConfiguration'
import EditConfiguration from './Components/EditConfiguration'
import ApproveImports from './Components/ApproveImports'
import Logs from './Components/Logs'
import { Navigation } from './navigation/Navigation'
import styles from './App.module.css'

const App = () => (
    
    <Router>
      <div className={styles.navigation}>
            <div className={styles.left}>
                <Navigation />
            </div>
            <div className={styles.right}>
        <Routes>
            <Route path="/" element={<ConfigurationList />} />
            <Route path="/add" element={<AddConfiguration />} />
            <Route path="/approveImports" element={<ApproveImports />} />
            <Route path="/logs" element={<Logs/>}/>
            <Route path="/edit/:Key" element={<EditConfiguration />} />
        </Routes>
        </div>
        </div>
    </Router>
    
    
)

export default App
