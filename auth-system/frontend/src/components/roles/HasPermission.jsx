import React from 'react';
import authService from '../../services/authService';

/**
 * Component to wrap elements that require specific permissions.
 * If the user does not have the required permission, it renders nothing (or a fallback).
 */
const HasPermission = ({ requiredPermission, children, fallback = null }) => {
    const user = authService.getCurrentUser();

    // Safety check - if no user or no permissions array in token, deny.
    if (!user || Array.isArray(user.user?.permissions) === false) {
        return fallback;
    }

    const { permissions } = user.user;

    if (permissions.includes(requiredPermission)) {
        return <>{children}</>;
    }

    return fallback;
};

export default HasPermission;
