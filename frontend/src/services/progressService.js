import api from './api';

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /api/my/dashboard
 * Returns { statistics, continue_learning, recent_activity }
 */
export const getDashboard = async () => {
    const response = await api.get('/my/dashboard');
    const data = response.data ?? {};

    return {
        ...data,
        statistics: {
            courses: 0,
            lessons_completed: 0,
            total_lessons: 0,
            learning_time_seconds: 0,
            learning_time_formatted: '0 min',
            overall_progress: 0,
            completion_percentage: 0,
            quizzes_taken: 0,
            quiz_average_score: 0,
            ...data.statistics,
        },
        continue_learning: data.continue_learning ?? null,
        recent_activity: Array.isArray(data.recent_activity) ? data.recent_activity : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
    };
};

// ─── Per-lesson progress ──────────────────────────────────────────────────────

/**
 * GET /api/lessons/{lessonId}/progress
 * Returns the current user's progress record for one lesson.
 */
export const getLessonProgress = async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}/progress`);
    return response.data;
};

/**
 * POST /api/lessons/{lessonId}/progress
 * Create or update progress for a lesson.
 *
 * @param {number} lessonId
 * @param {object} payload  { progress_percentage, time_spent_seconds, last_position }
 */
export const saveLessonProgress = async (lessonId, payload) => {
    const response = await api.post(`/lessons/${lessonId}/progress`, payload);
    return response.data;
};

/**
 * PUT /api/lessons/{lessonId}/time
 * Update only the time-spent counter (lightweight heartbeat call).
 *
 * @param {number} lessonId
 * @param {number} timeSpentSeconds   Cumulative seconds from lesson open
 */
export const updateTimeSpent = async (lessonId, timeSpentSeconds) => {
    const response = await api.put(`/lessons/${lessonId}/time`, {
        time_spent_seconds: timeSpentSeconds,
    });
    return response.data;
};

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * GET /api/my/history
 * Returns paginated learning history for the authenticated user.
 *
 * @param {number} page     Page number (1-based)
 * @param {number} perPage  Items per page (default 15)
 */
export const getHistory = async (page = 1, perPage = 15) => {
    const response = await api.get('/my/history', {
        params: { page, per_page: perPage },
    });
    return response.data; // { data: [...], pagination: {...} }
};

// ─── Course progress ──────────────────────────────────────────────────────────

/**
 * GET /api/my/courses/{slug}/progress
 * Returns per-lesson completion state for the authenticated user within a course.
 */
export const getCourseProgress = async (courseSlug) => {
    const response = await api.get(`/my/courses/${courseSlug}/progress`);
    return response.data;
};
