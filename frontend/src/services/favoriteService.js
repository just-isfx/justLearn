import api from './api';

/**
 * GET /api/favorites
 * Returns { data: [...], grouped: { courses, lessons, articles }, total }
 */
export const getFavorites = async () => {
    const response = await api.get('/favorites');
    return response.data;
};

/**
 * GET /api/favorites/status?type=&id=
 * Returns { favorited: bool, favorite_id: number|null }
 */
export const getFavoriteStatus = async (type, id) => {
    const response = await api.get('/favorites/status', { params: { type, id } });
    return response.data;
};

/**
 * POST /api/favorites  — toggles: adds if absent, removes if present
 * @param {'course'|'lesson'|'article'} type
 * @param {number} id
 * Returns { favorited: bool, message: string, favorite?: {...} }
 */
export const toggleFavorite = async (type, id) => {
    const response = await api.post('/favorites', { type, id });
    return response.data;
};

/**
 * DELETE /api/favorites/{favoriteId}
 * Direct removal by favorite record ID.
 */
export const removeFavorite = async (favoriteId) => {
    const response = await api.delete(`/favorites/${favoriteId}`);
    return response.data;
};
