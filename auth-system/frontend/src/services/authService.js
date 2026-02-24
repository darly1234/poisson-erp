import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
    });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const register = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
    });
    return response.data;
};

const forgotPassword = async (email) => {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
};

const resetPassword = async (token, newPassword) => {
    const response = await axios.post(`${API_URL}/reset-password`, {
        token,
        newPassword,
    });
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const verifyEmail = async (token) => {
    const response = await axios.get(`${API_URL}/verify-email/${token}`);
    return response.data;
};

const authService = {
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    logout,
    getCurrentUser,
};

export default authService;
