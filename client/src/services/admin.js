import api from './api';

const data = (r) => r.data;

// ---------- Back-Office ----------
export const getStats = () => api.get('/admin/stats').then(data);

export const getUsers = (params) => api.get('/admin/users', { params }).then(data);
export const updateUser = (id, body) => api.patch(`/admin/users/${id}`, body).then(data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then(data);

export const getCategories = () => api.get('/admin/categories').then(data);
export const createCategory = (body) => api.post('/admin/categories', body).then(data);
export const updateCategory = (id, body) => api.patch(`/admin/categories/${id}`, body).then(data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`).then(data);

export const getTags = () => api.get('/admin/tags').then(data);
export const createTag = (body) => api.post('/admin/tags', body).then(data);
export const updateTag = (id, body) => api.patch(`/admin/tags/${id}`, body).then(data);
export const deleteTag = (id) => api.delete(`/admin/tags/${id}`).then(data);

export const getCollections = (params) => api.get('/admin/collections', { params }).then(data);
export const getCollection = (id) => api.get(`/admin/collections/${id}`).then(data);
export const createCollection = (body) => api.post('/admin/collections', body, { timeout: 60000 }).then(data);
export const updateCollection = (id, body) => api.patch(`/admin/collections/${id}`, body, { timeout: 60000 }).then(data);
export const deleteCollection = (id) => api.delete(`/admin/collections/${id}`).then(data);

export const getAdminGroups = (params) => api.get('/admin/groups', { params }).then(data);
export const deleteAdminGroup = (id) => api.delete(`/admin/groups/${id}`).then(data);
export const getComments = () => api.get('/admin/comments').then(data);
export const deleteComment = (groupId, ratingId) => api.delete(`/admin/comments/${groupId}/${ratingId}`).then(data);

// ---------- Parte pública de las colecciones ----------
export const getPublicCollections = (params) => api.get('/collections', { params }).then(data);
export const getPublicCollection = (slug) => api.get(`/collections/${slug}`).then(data);
export const getCollectionCategories = () => api.get('/collections/categories').then(data);

// Reseñas públicas de las fichas
export const getReviews = (params) => api.get('/admin/reviews', { params }).then(data);
export const moderateReview = (id, hidden) => api.patch(`/admin/reviews/${id}`, { hidden }).then(data);
