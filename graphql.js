const API_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

class GraphQLService {
    constructor(authService) {
        this.auth = authService;
    }

    async query(query, variables = {}) {
        if (!this.auth.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        console.log('Executing GraphQL query with variables:', variables);
        
        try {
            const headers = this.auth.getAuthHeader();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.errors) {
                console.error('GraphQL errors:', result.errors);
                const errorMsg = result.errors[0]?.message || 'GraphQL error';
                throw new Error(errorMsg);
            }

            return result.data;
        } catch (error) {
            console.error('GraphQL query failed:', error);
            throw error;
        }
    }

    // SIMPLE NORMAL QUERY - REQUIRED
    async getUserInfo() {
        const query = `
            query {
                user {
                    id
                    login
                    attrs
                }
            }
        `;
        return this.query(query);
    }

    // QUERY WITH ARGUMENTS - REQUIRED
    // Get all XP transactions (including piscine)
    // Get total XP for a user (only passed projects)
    async getTotalXP() {
        const query = `
            query GetTotalXP($userId: Int!) {
                user(where: { id: { _eq: $userId } }) {
                    transactions(where: { type: { _eq: "xp" } }, order_by: { createdAt: asc }) {
                        amount
                        objectId
                        path
                        createdAt
                        object {
                            id
                            type
                        }
                    }
                }
                result(where: { userId: { _eq: $userId }, grade: { _gte: 1 } }) {
                    objectId
                }
                progress(where: { userId: { _eq: $userId }, grade: { _gte: 1 } }) {
                    objectId
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get XP grouped by project/object
    async getXPByProject() {
        const query = `
            query GetXPByProject($userId: Int!) {
                transaction(
                    where: {
                        userId: { _eq: $userId }
                        type: { _eq: "xp" }
                    }
                    order_by: { amount: desc }
                ) {
                    id
                    amount
                    path
                    createdAt
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get pass/fail statistics (excluding piscine)
    async getPassFailStats() {
        const query = `
            query GetPassFailStats($userId: Int!) {
                result(
                    where: {
                        userId: { _eq: $userId }
                        path: { _nlike: "%/piscine-%" }
                    }
                ) {
                    objectId
                    grade
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // NESTED QUERY - REQUIRED
    async getProgressWithUser() {
        const query = `
            query GetProgressWithUser($userId: Int!) {
                progress(
                    where: { userId: { _eq: $userId } },
                    limit: 5
                ) {
                    id
                    grade
                    createdAt
                    object {
                        name
                        type
                    }
                    user {
                        id
                        login
                    }
                }
            }
        `;
        
        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get user ID first
    async getCurrentUserId() {
        try {
            const userData = await this.getUserInfo();
            if (userData?.user?.[0]?.id) {
                const userId = userData.user[0].id;
                console.log('Got user ID from API:', userId);
                
                // Store it in auth service
                this.auth.userId = userId;
                localStorage.setItem('user_id', userId);
                
                return userId;
            }
            return null;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    }

    // Get audit counts
    async getAuditCounts() {
        const query = `
            query GetAuditCounts($userId: Int!) {
                up: transaction_aggregate(
                    where: {
                        userId: { _eq: $userId },
                        type: { _eq: "up" }
                    }
                ) {
                    aggregate {
                        count
                    }
                }
                down: transaction_aggregate(
                    where: {
                        userId: { _eq: $userId },
                        type: { _eq: "down" }
                    }
                ) {
                    aggregate {
                        count
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get audit ratio
    async getAuditRatio() {
        const query = `
            query GetAuditRatio($userId: Int!) {
                auditUp: transaction_aggregate(
                    where: {
                        userId: { _eq: $userId },
                        type: { _eq: "up" }
                    }
                ) {
                    aggregate {
                        sum { amount }
                    }
                }
                auditDown: transaction_aggregate(
                    where: {
                        userId: { _eq: $userId },
                        type: { _eq: "down" }
                    }
                ) {
                    aggregate {
                        sum { amount }
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get audit amounts in XP (for display in KB)
    async getAuditAmounts() {
        const query = `
            query GetAuditAmounts($userId: Int!) {
                up: transaction(
                    where: { 
                        userId: { _eq: $userId },
                        type: { _eq: "up" }
                    }
                ) {
                    amount
                }
                down: transaction(
                    where: { 
                        userId: { _eq: $userId },
                        type: { _eq: "down" }
                    }
                ) {
                    amount
                }
            }
        `;
        
        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    
    async getProjectsStatus() {
        const query = `
            query GetProjectsStatus($userId: Int!) {
                progress(
                    where: {
                        userId: { _eq: $userId },
                        object: { type: { _eq: "project" } }
                    },
                    order_by: { createdAt: desc }
                ) {
                    id
                    grade
                    createdAt
                    objectId
                    object {
                        id
                        name
                        type
                    }
                }
                result(
                    where: {
                        userId: { _eq: $userId },
                        object: { type: { _eq: "project" } }
                    },
                    order_by: { createdAt: desc }
                ) {
                    id
                    grade
                    createdAt
                    objectId
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get user level from transaction table (excluding Piscine JS and Piscine Go)
    async getUserLevel() {
        const query = `
            query GetUserLevel($userId: Int!) {
                transaction(
                    where: { 
                        userId: { _eq: $userId },
                        type: { _eq: "level" },
                        path: { _nlike: "%/piscine-%" }
                    },
                    order_by: { createdAt: desc },
                    limit: 1
                ) {
                    amount
                    createdAt
                }
            }
        `;
        
        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get user results (grades, pass/fail)
    async getUserResults(limit = 50) {
        const query = `
            query GetUserResults($userId: Int!, $limit: Int = 50) {
                result(
                    where: {
                        userId: { _eq: $userId }
                    }
                    order_by: { createdAt: desc }
                    limit: $limit
                ) {
                    id
                    grade
                    type
                    path
                    createdAt
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId),
            limit: limit
        });
    }

    // Get user progress
    async getUserProgress(limit = 50) {
        const query = `
            query GetUserProgress($userId: Int!, $limit: Int = 50) {
                progress(
                    where: {
                        userId: { _eq: $userId }
                    }
                    order_by: { updatedAt: desc }
                    limit: $limit
                ) {
                    id
                    grade
                    path
                    createdAt
                    updatedAt
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId),
            limit: limit
        });
    }

    // Get skills - using type pattern matching
    async getSkillsWithNames() {
        const query = `
            query GetUserSkills($userId: Int!) {
                transaction(
                    where: {
                        userId: { _eq: $userId }
                        type: { _like: "skill_%" }
                    }
                    order_by: { amount: desc }
                    limit: 1000
                ) {
                    id
                    type
                    objectId
                    amount
                    createdAt
                    object {
                        id
                        name
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get average grade
    async getAverageGrade() {
        const query = `
            query GetAverageGrade($userId: Int!) {
                progress_aggregate(
                    where: { 
                        userId: { _eq: $userId },
                        grade: { _is_null: false }
                    }
                ) {
                    aggregate {
                        avg { grade }
                    }
                }
            }
        `;
        
        return this.query(query, {
            userId: parseInt(this.auth.userId)
        });
    }

    // Get detailed audit transactions
    async getAuditTransactions(limit = 20) {
        const query = `
            query GetAuditTransactions($userId: Int!, $limit: Int = 20) {
                audit(
                    where: {
                        auditorId: { _eq: $userId }
                    }
                    order_by: { createdAt: desc }
                    limit: $limit
                ) {
                    id
                    grade
                    createdAt
                    auditorId
                    endAt
                    resultId
                    group {
                        object {
                            name
                            type
                        }
                        captain {
                            login
                        }
                    }
                    result {
                        id
                        grade
                        object {
                            name
                            type
                        }
                    }
                }
            }
        `;

        return this.query(query, {
            userId: parseInt(this.auth.userId),
            limit: limit
        });
    }
}

const graphql = new GraphQLService(auth);