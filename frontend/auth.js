/**
 * Authentication Helper for Student Risk Management System
 * Handles localStorage session management, user store, and role-based access.
 *
 * ROLES:
 *   superuser  - Full system access, user management, system settings.
 *   admin      - Default teacher/admin dashboard access.
 */
const Auth = {

    // Built-in accounts (cannot be deleted or overwritten via register)
    _BUILTIN: [
        { username: 'superuser', password: 'super@2024', fullname: 'Super Administrator', role: 'superuser' },
        { username: 'admin',     password: 'admin123',   fullname: 'System Administrator', role: 'admin'      }
    ],

    /**
     * Attempts to login a user with the provided credentials.
     * @param {string} username
     * @param {string} password
     * @returns {boolean} Success status
     */
    login: function(username, password) {
        // Check built-in accounts first
        const builtin = this._BUILTIN.find(u => u.username === username && u.password === password);
        if (builtin) {
            this._setSession(builtin);
            return true;
        }
        // Check registered users in localStorage
        const users = this._getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            this._setSession(user);
            return true;
        }
        return false;
    },

    /**
     * Registers a new user account (role defaults to 'admin').
     * @param {Object} userData
     * @returns {boolean} Success status
     */
    register: function(userData) {
        // Block overwriting built-in accounts
        if (this._BUILTIN.find(u => u.username === userData.username)) return false;
        const users = this._getUsers();
        if (users.find(u => u.username === userData.username)) return false;
        userData.role = userData.role || 'admin';
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    },

    /**
     * Promotes/demotes a registered user to a given role (superuser only).
     * @param {string} username
     * @param {string} newRole  'superuser' | 'admin'
     * @returns {boolean}
     */
    setRole: function(username, newRole) {
        if (!this.isSuperUser()) return false;
        const users = this._getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return false;
        user.role = newRole;
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    },

    /**
     * Deletes a registered user account (superuser only; built-ins are protected).
     * @param {string} username
     * @returns {boolean}
     */
    deleteUser: function(username) {
        if (!this.isSuperUser()) return false;
        if (this._BUILTIN.find(u => u.username === username)) return false;
        let users = this._getUsers();
        const before = users.length;
        users = users.filter(u => u.username !== username);
        localStorage.setItem('users', JSON.stringify(users));
        return users.length < before;
    },

    /**
     * Returns all users (built-ins + registered). Superuser only.
     * @returns {Array|null}
     */
    getAllUsers: function() {
        if (!this.isSuperUser()) return null;
        const registered = this._getUsers().map(u => ({ ...u, builtin: false }));
        const builtin = this._BUILTIN.map(u => ({
            username: u.username, fullname: u.fullname, role: u.role, builtin: true
        }));
        return [...builtin, ...registered];
    },

    /**
     * Checks if a valid session exists.
     * @returns {Object|null} The current session user or null
     */
    checkSession: function() {
        try {
            const session = localStorage.getItem('currentUser');
            if (!session || session === 'null' || session === 'undefined') return null;
            return JSON.parse(session);
        } catch (e) {
            console.error('Session check failed', e);
            return null;
        }
    },

    /** Returns true if the logged-in user is a superuser. */
    isSuperUser: function() {
        const s = this.checkSession();
        return s && s.role === 'superuser';
    },

    /** Returns true if the logged-in user is admin or superuser. */
    isAdmin: function() {
        const s = this.checkSession();
        return s && (s.role === 'superuser' || s.role === 'admin');
    },

    /** Clears the current session and redirects to login. */
    logout: function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    // Private helpers
    _getUsers: function() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },

    _setSession: function(user) {
        localStorage.setItem('currentUser', JSON.stringify({
            username:  user.username,
            fullname:  user.fullname,
            role:      user.role || 'admin',
            loginTime: new Date().toISOString()
        }));
    }
};
