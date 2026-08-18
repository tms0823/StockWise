import api from './api';

// Topics come straight from CueCard.topic and contain spaces, parentheses and
// slashes, so they must be encoded into the path. Express decodes req.params
// automatically, so the server sees the original string.
export const getQuiz = (topic) =>
  api.get(`/learning/quiz/${encodeURIComponent(topic)}`);

export const submitQuiz = (topic, answers) =>
  api.post('/learning/quiz/submit', { topic, answers });

export const completeCueCard = (topic) =>
  api.post('/learning/cuecard/complete', { topic });

export const getLearningProgress = () => api.get('/learning/progress');
