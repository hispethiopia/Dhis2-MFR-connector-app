import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import ConfigurationList from './Components/ConfigurationList'
import AddConfiguration from './Components/AddConfiguration'
import EditConfiguration from './Components/EditConfiguration'
import ApproveImports from './Components/ApproveImports'

const App = () => (
    <Router>
        <Routes>
            <Route path="/" element={<ConfigurationList />} />
            <Route path="/add" element={<AddConfiguration />} />
            <Route path="/approveImports" element={<ApproveImports />} />
            <Route path="/edit/:Key" element={<EditConfiguration />} />
        </Routes>
    </Router>
)

export default App
