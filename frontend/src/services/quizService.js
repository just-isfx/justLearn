import api from './api';

export async function getQuizzes() {
    const response = await api.get('/quizzes');
    return response.data.data;
}

export async function getQuiz(id) {
    const response = await api.get(`/quizzes/${id}`);
    return response.data.data;
}

export async function submitQuiz(id, answers) {
    const response = await api.post(`/quizzes/${id}/attempts`, { answers });
    return response.data.data;
}

export async function getQuizAttempts() {
    const response = await api.get('/quiz-attempts');
    return response.data.data;
}

export async function getQuizAttempt(id) {
    const response = await api.get(`/quiz-attempts/${id}`);
    return response.data.data;
}

export async function getLessonQuiz(lessonId) {
    const response = await api.get(`/lessons/${lessonId}/quiz`);
    return response.data.data;
}

export async function submitLessonQuiz(lessonId, answers) {
    const response = await api.post(`/lessons/${lessonId}/quiz/submit`, { answers });
    return response.data.data;
}