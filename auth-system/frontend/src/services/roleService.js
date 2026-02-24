import axios from 'axios';

const API_URL = 'http://localhost:5000/api/roles/';

// Configure axios to use the token
const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { headers: { Authorization: `Bearer ${user.token}` } };
    }
    return {};
};

const getRoles = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
};

const getPermissions = async () => {
    const response = await axios.get(`${API_URL}permissions`, getAuthHeaders());
    return response.data;
};

const createRole = async (roleData) => {
    const response = await axios.post(API_URL, roleData, getAuthHeaders());
    return response.data;
};

const updateRole = async (id, roleData) => {
    const response = await axios.put(`${API_URL}${id}`, roleData, getAuthHeaders());
    return response.data;
};

const deleteRole = async (id) => {
    const response = await axios.delete(`${API_URL}${id}`, getAuthHeaders());
    return response.data;
};

const roleService = {
    getRoles,
    getPermissions,
    createRole,
    updateRole,
    deleteRole
};

export default roleService;
