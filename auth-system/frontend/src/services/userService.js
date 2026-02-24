import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/users';

const getAuthHeader = () => {
    const user = authService.getCurrentUser();
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    }
    return {};
};

const getProfile = async () => {
    const response = await axios.get(`${API_URL}/profile`, { headers: getAuthHeader() });
    return response.data;
};

const updateProfile = async (profileData) => {
    const response = await axios.put(`${API_URL}/profile`, profileData, { headers: getAuthHeader() });
    return response.data;
};

const getAllUsers = async () => {
    const response = await axios.get(API_URL, { headers: getAuthHeader() });
    return response.data;
};

const createUser = async (userData) => {
    const response = await axios.post(API_URL, userData, { headers: getAuthHeader() });
    return response.data;
};

const userService = {
    getProfile,
    updateProfile,
    getAllUsers,
    createUser
};

export default userService;
