import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, auth }) => {
    if (!auth || !auth.token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;
