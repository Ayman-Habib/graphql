class AuthService {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.userId = localStorage.getItem('user_id');
        this.apiUrl = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';
        
        // Clean token on load
        if (this.token) {
            this.token = this.cleanToken(this.token);
        }
    }

    cleanToken(token) {
        // Remove quotes, whitespace, and newlines
        return token.replace(/['"]/g, '').trim();
    }

    
isAuthenticated() {
    if (!this.token || this.token.trim().length === 0) {
        console.log('No token found');
        return false;
    }
    
    // Basic token format check
    const tokenParts = this.token.split('.');
    if (tokenParts.length !== 3) {
        console.log('Invalid token format: not 3 parts');
        this.logout();
        return false;
    }
    
    
    try {
        const payload = this.decodeTokenPayload(this.token);
        if (payload && payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                console.log('Token expired');
                this.logout();
                return false;
            }
        }
    } catch (e) {
        console.log('Could not check token expiration:', e);
    }
    
    return true;
}

    async login(username, password) {
        console.log('Starting login process for:', username);
        
        // Clear any existing token first
        this.logout();
        
        const credentials = btoa(`${username}:${password}`);
        
        try {
            console.log('Making login request...');
            const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Login response status:', response.status);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid credentials. Please check your username/email and password.');
                }
                const errorText = await response.text();
                throw new Error(`Login failed with status: ${response.status}. ${errorText}`);
            }

            let token = await response.text();
            console.log('Received token');
            
            if (!token || token.trim() === '') {
                throw new Error('Empty response from server');
            }
            
            // Clean the token
            token = this.cleanToken(token);
            
            this.token = token;
            
            // Extract user ID from JWT FIRST (before storing)
            this.userId = this.getUserIdFromToken();
            
            if (!this.userId) {
                console.error('Could not extract user ID from token, will fetch from API');
                
            }
            
            localStorage.setItem('jwt_token', this.token);
            if (this.userId) {
                localStorage.setItem('user_id', this.userId);
            }
            
            console.log('Login successful. Token stored.');
            return true;
            
        } catch (error) {
            console.error('Login error:', error);
            this.logout();
            throw error;
        }
    }

    decodeTokenPayload(token) {
        try {
            const base64Url = token.split('.')[1];
            
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token payload:', error);
            return null;
        }
    }

    getUserIdFromToken() {
        if (!this.token) return null;
        
        try {
            const payload = this.decodeTokenPayload(this.token);
            if (!payload) {
                console.log('Could not decode token payload');
                return null;
            }
            
            console.log('Token payload:', payload);
            
            
            let userId = payload.sub || payload.userId || payload.id || payload.user_id;
            
            
            if (!userId && payload['https://hasura.io/jwt/claims']) {
                const claims = payload['https://hasura.io/jwt/claims'];
                userId = claims['x-hasura-user-id'] || claims['x-hasura-default-role'] || claims.sub;
            }
            
            // Convert to number if it's a string
            if (userId && typeof userId === 'string') {
                userId = parseInt(userId);
            }
            
            console.log('Extracted user ID:', userId);
            return userId;
            
        } catch (e) {
            console.error('Error getting user ID from token:', e);
            return null;
        }
    }

    logout() {
        console.log('Logging out...');
        this.token = null;
        this.userId = null;
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_id');
    }

    getAuthHeader() {
        if (!this.token) {
            throw new Error('No authentication token available');
        }
        
        // Ensure token is clean
        const cleanToken = this.cleanToken(this.token);
        
        return {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
}

const auth = new AuthService();
