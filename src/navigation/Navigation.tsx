import { Menu, MenuItem } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { useNavigate, useMatch } from 'react-router-dom'
import { MetadataContext } from '../App'

const NavigationItem = ({ path, label, isAuthenticated }) => {
    const navigate = useNavigate()
    const routeMatch = useMatch(path)
    const isActive = Boolean(routeMatch)
    const onClick = () => navigate(path)

    if (!isAuthenticated) {
        return null;
    }

    return <MenuItem label={label} active={isActive} onClick={onClick} />
}

NavigationItem.propTypes = {
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    isAuthenticated: PropTypes.bool.isRequired
}

export const Navigation = () => {
    const metadata = useContext(MetadataContext)

    return (
        <Menu>
            <NavigationItem
                label="Configurations"
                path="/"
                isAuthenticated={metadata.me.userRoles.some(userRole => userRole.displayName === "Superuser")}
            />

            <NavigationItem
                label="Logs"
                path="/logs"
                isAuthenticated={true}
            />

            <NavigationItem
                label="Approval"
                path="/approveImports"
                isAuthenticated={true}
            />
            <NavigationItem
                label="Settings"
                path="/settings"
                isAuthenticated={metadata.me.userRoles.some(userRole => userRole.displayName === "Superuser")}
            />
        </Menu>)
}