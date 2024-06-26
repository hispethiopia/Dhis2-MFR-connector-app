import { Menu, MenuItem } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { useNavigate, useMatch } from 'react-router-dom'

const NavigationItem = ({ path, label }) => {
    const navigate = useNavigate()
    const routeMatch = useMatch(path)
    const isActive = Boolean(routeMatch)
    const onClick = () => navigate(path)

    return <MenuItem label={label} active={isActive} onClick={onClick} />
}

NavigationItem.propTypes = {
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
}

export const Navigation = () => (
    <Menu>
        <NavigationItem
            label="Configurations"
            path="/"
        />

        <NavigationItem
            label="Logs"
            path="/logs"
        />

        <NavigationItem
            label="Approval"
            path="/approveImports"
        />
        <NavigationItem
            label="Settings"
            path="/settings"
        />
    </Menu>
)