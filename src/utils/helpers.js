/**
* Returns the 'name' field of an element from a list based on its ID
* @param {string} id - Element ID to find
* @param {Array<Object>} list - List of objects (e.g., categories, parameters)
* @returns {string} Element name or description if not found
*/
export const getNameById = (id, list) =>
    (list || []).find(item => item.id === id)?.name || `Nieznana (ID: ${id})`;

/**
 * Fetch user role from Firestore
 * Currently returns 'Admin' for all users
 * @param {string} uid - User ID
 * @returns {Promise<string>} User role
 */
export async function fetchUserRole(uid) {
    if (!uid) return 'User';
    try {
        // TODO: Implement actual role fetching from Firestore
        return 'Admin';
    } catch (e) {
        console.error('fetchUserRole error', e);
        return 'User';
    }
}