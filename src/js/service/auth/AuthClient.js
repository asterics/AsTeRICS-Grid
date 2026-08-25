/**
 * Lightweight cluster-aware auth client for couch-auth endpoints.
 */
class AuthClient {
    constructor(serverUrls = []) {
        this.serverUrls = serverUrls;
        this.session = null;
    }

    /**
     * Updates the cluster server URLs array.
     */
    setServerUrls(urls) {
        this.serverUrls = Array.isArray(urls) ? urls : [urls];
    }

    /**
     * Returns the active session object.
     */
    getSession() {
        return this.session;
    }

    /**
     * Determines the correct base URL for the request.
     * - If logged in: Extracts the exact node URL from the assigned user database.
     * - If not logged in: Picks a random node from the cluster array.
     */
    getBaseUrl() {
        if (this.session && this.session.userDBs) {
            const dbUrls = Object.values(this.session.userDBs);
            if (dbUrls.length > 0) {
                try {
                    // Extract the origin (e.g., "https://node3.example.com") from the DB URL
                    return new URL(dbUrls[0]).origin;
                } catch (e) {
                    console.warn("AuthClient: Invalid DB URL in session, falling back to random node.", e);
                }
            }
        }

        // Fallback to random node for unauthenticated requests
        if (!this.serverUrls || this.serverUrls.length === 0) {
            throw new Error('AuthClient: No server URLs configured.');
        }

        const randomIndex = Math.floor(Math.random() * this.serverUrls.length);
        return this.serverUrls[randomIndex].replace(/\/+$/, '');
    }

    /**
     * Executes an HTTP request using the dynamically determined base URL.
     */
    async request(path, options = {}) {
        const baseUrl = this.getBaseUrl();
        const formattedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${baseUrl}${formattedPath}`;

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        return fetch(url, { ...options, headers });
    }

    /**
     * Authenticates user against /auth/login.
     */
    async login({ username, password }) {
        const response = await this.request(`proxy/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || 'Login failed');
            error.error = errorData.error || response.statusText;
            throw error;
        }

        this.session = await response.json();
        return this.session;
    }

    /**
     * Registers a new user against /auth/register.
     */
    async register({ username, email, password, confirmPassword }) {
        const response = await this.request(`proxy/register`, {
            method: 'POST',
            body: JSON.stringify({ username, email, password, confirmPassword })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || 'Registration failed');
            error.error = errorData.error || response.statusText;
            throw error;
        }

        return await response.json();
    }

    /**
     * Logs out the user session via /auth/logout using the session's node.
     */
    async logout() {
        if (!this.session) return Promise.resolve();

        try {
            await this.request(`auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.session.token}:${this.session.password}`
                }
            });
        } catch (e) {
            // Ignore logout network errors gracefully
        } finally {
            this.session = null;
        }
    }
}

export const authClient = new AuthClient();