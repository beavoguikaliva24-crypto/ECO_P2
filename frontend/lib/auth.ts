export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};