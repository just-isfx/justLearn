import api from './api';

export const getLanguages = async () => {
    const response = await api.get('/programming-languages');
    return response.data.data;
};

export const getLanguageBySlug = async (slug) => {
    const response = await api.get(`/programming-languages/${slug}`);
    return response.data.data;
};

export const getCoursesByLanguage = async (slug) => {
    const response = await api.get(`/programming-languages/${slug}/courses`);
    return response.data.data;
};

export const getCourseBySlug = async (slug) => {
    const response = await api.get(`/courses/${slug}`);
    return response.data.data;
};

export const getCourseContinueLesson = async (courseId) => {
    const response = await api.get(`/courses/${courseId}/continue`);
    return response.data.data;
};

export const getLessonsByCourse = async (slug) => {
    const response = await api.get(`/courses/${slug}/lessons`);
    return response.data.data;
};

export const getLessonBySlug = async (slug) => {
    const response = await api.get(`/lessons/${slug}`);
    return response.data.data;
};

export const getLibraryCategories = async () => {
    const response = await api.get('/library/categories');
    return response.data.data;
};

export const getLibraryArticles = async (query = '') => {
    const response = await api.get('/library/articles', { params: { q: query } });
    return response.data.data;
};

export const getLibraryArticleBySlug = async (slug) => {
    const response = await api.get(`/library/articles/${slug}`);
    return response.data.data;
};

export const searchLibrary = async (query) => {
    const response = await api.get('/library/search', { params: { q: query } });
    return response.data.data;
};
