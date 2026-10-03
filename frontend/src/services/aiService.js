import api from './api';

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * GET /api/ai/conversations
 * Returns { data: [{ id, title, created_at, updated_at }] }
 */
export const getConversations = async () => {
    const response = await api.get('/ai/conversations');
    return response.data.data;
};

/**
 * POST /api/ai/conversations
 * Creates a new empty conversation.
 * Returns { id, title, messages: [], created_at }
 */
export const createConversation = async () => {
    const response = await api.post('/ai/conversations');
    return response.data;
};

/**
 * GET /api/ai/conversations/{id}
 * Loads a conversation with its full message history.
 * Returns { id, title, messages: [...], created_at, updated_at }
 */
export const getConversation = async (id) => {
    const response = await api.get(`/ai/conversations/${id}`);
    return response.data;
};

/**
 * DELETE /api/ai/conversations/{id}
 */
export const deleteConversation = async (id) => {
    const response = await api.delete(`/ai/conversations/${id}`);
    return response.data;
};

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/conversations/{id}/messages
 * Send a user message and receive the AI reply.
 *
 * @param {number} conversationId
 * @param {string} message             The user's text
 * @param {string|null} learningContext  Optional plain-text lesson/course context
 *
 * Returns { message: { id, role, content, created_at }, conversation_title }
 */
export const sendMessage = async (conversationId, message, learningContext = null) => {
    const payload = { message };
    if (learningContext) payload.learning_context = learningContext;

    const response = await api.post(
        `/ai/conversations/${conversationId}/messages`,
        payload
    );
    return response.data;
};
