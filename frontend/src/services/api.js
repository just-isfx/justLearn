import axios from 'axios';

const csrfMeta = () => document.querySelector('meta[name="csrf-token"]');
const getCsrfToken = () => csrfMeta()?.getAttribute('content');

const csrfRefreshClient = axios.create({ withCredentials: true });

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = getCsrfToken();
    if (token) config.headers['X-CSRF-TOKEN'] = token;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config;
        if (error.response?.status !== 419 || !request || request._csrfRetried) {
            return Promise.reject(error);
        }

        request._csrfRetried = true;
        try {
            const { data } = await csrfRefreshClient.get('/csrf-token');
            const token = data?.token;
            if (!token) throw new Error('CSRF token refresh returned no token.');

            csrfMeta()?.setAttribute('content', token);
            request.headers['X-CSRF-TOKEN'] = token;
            return api.request(request);
        } catch (refreshError) {
            const responseError = refreshError.response || error.response;
            responseError.data = {
                ...responseError.data,
                message: 'Your session expired. Refresh the page and try again.',
                code: 'CSRF_SESSION_EXPIRED',
            };
            return Promise.reject({ ...error, response: responseError });
        }
    }
);

export const getHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
