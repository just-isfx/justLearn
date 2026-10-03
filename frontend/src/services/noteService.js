import api from './api';

/**
 * GET /api/notes?search=&page=&per_page=
 * Returns { data: [...], pagination: {...} }
 */
export const getNotes = async ({ search = '', page = 1, perPage = 20 } = {}) => {
    const params = { page, per_page: perPage };
    if (search.trim()) params.search = search.trim();
    const response = await api.get('/notes', { params });
    return response.data; // { data, pagination }
};

/**
 * POST /api/notes
 * @param {{ title, content, related_type?, related_id? }} payload
 */
export const createNote = async (payload) => {
    const response = await api.post('/notes', payload);
    return response.data;
};

/**
 * GET /api/notes/{id}
 */
export const getNote = async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
};

/**
 * PUT /api/notes/{id}
 * @param {number} id
 * @param {{ title, content, related_type?, related_id? }} payload
 */
export const updateNote = async (id, payload) => {
    const response = await api.put(`/notes/${id}`, payload);
    return response.data;
};

/**
 * DELETE /api/notes/{id}
 */
export const deleteNote = async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
};
