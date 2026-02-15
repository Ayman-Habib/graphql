class ProfileApp {
    constructor() {
        if (window.profileAppInstance) {
            console.log('ProfileApp already initialized, returning existing instance');
            return window.profileAppInstance;
        }
        
        this.isLoading = false;
        this.userStats = {};
        this.hasDataLoaded = false;
        this.isInitializing = false;
        this.chartHandlers = {};
        
        window.profileAppInstance = this;
    }

    async init() {
        if (this.isInitializing) return;
        this.isInitializing = true;
        
        console.log('Initializing ProfileApp...');
        this.setupEventListeners();
        await this.checkAuth();
        
        this.isInitializing = false;
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            if (this.handleLoginBound) {
                loginForm.removeEventListener('submit', this.handleLoginBound);
            }
            this.handleLoginBound = this.handleLogin.bind(this);
            loginForm.addEventListener('submit', this.handleLoginBound);
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            if (this.handleLogoutBound) {
                logoutBtn.removeEventListener('click', this.handleLogoutBound);
            }
            this.handleLogoutBound = this.handleLogout.bind(this);
            logoutBtn.addEventListener('click', this.handleLogoutBound);
        }

        // Chart buttons
        ['xp', 'audit', 'projects'].forEach(type => {
            const btn = document.getElementById(`btn-${type}-chart`);
            if (!btn) return;

            if (this.chartHandlers[type]) {
                btn.removeEventListener('click', this.chartHandlers[type]);
            }

            this.chartHandlers[type] = () => {
                this.switchChart(`${type}-chart`, btn);
            };

            btn.addEventListener('click', this.chartHandlers[type]);
        });
    }

    async checkAuth() {
        try {
            if (auth.isAuthenticated()) {
                console.log('User is authenticated, showing profile...');
                await this.showProfilePage();
                
                // Clear any previous data first
                this.clearProfileData();
                
                // Get fresh user ID from API
                await this.ensureUserId();
                
                // Load profile data
                await this.loadProfileData();
            } else {
                console.log('User is not authenticated, showing login...');
                await this.showLoginPage();
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            await this.showLoginPage();
        }
    }

    async ensureUserId() {
        try {
            // If we don't have a user ID, get it from the API
            if (!auth.userId) {
                console.log('No user ID found, fetching from API...');
                await graphql.getCurrentUserId();
            }
            console.log('Using user ID:', auth.userId);
        } catch (error) {
            console.error('Error ensuring user ID:', error);
            throw error;
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        const errorElement = document.getElementById('error-message');

        if (!errorElement) return;

        errorElement.style.display = 'none';
        errorElement.textContent = '';
        
        if (!username || !password) {
            errorElement.textContent = 'Please enter both username/email and password';
            errorElement.style.display = 'block';
            return;
        }

        // Reset loading state
        this.isLoading = false;
        this.showLoading(true);

        try {
            console.log('Attempting login for user:', username);
            await auth.login(username, password);
            
            console.log('Login successful! Showing profile...');
            await this.showProfilePage();
            document.getElementById('password').value = '';
            
            // Clear any cached data
            this.userStats = {};
            this.hasDataLoaded = false;
            
            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get fresh user ID
            await this.ensureUserId();
            
            // Small delay before loading data
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Load profile data
            await this.loadProfileData();
            
        } catch (error) {
            console.error('Login failed:', error);
            let errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
            
            if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401') || errorMessage.includes('403')) {
                errorMessage = 'Invalid username/email or password. Please try again.';
            }
            
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
            auth.logout();
            
        } finally {
            // Ensure loading is turned off
            setTimeout(() => {
                this.showLoading(false);
                this.isLoading = false;
            }, 500);
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            auth.logout();
            this.hasDataLoaded = false;
            this.userStats = {};
            this.isLoading = false;
            this.showLoginPage();
            document.getElementById('login-form')?.reset();
            document.getElementById('error-message').style.display = 'none';
            
            // Clear all displayed data
            this.clearProfileData();
        }
    }

    clearProfileData() {
        // Clear all displayed information
        const elementsToClear = {
            'user-id': '-',
            'user-login': '-',
            'user-email': '-',
            'user-level': '-',
            'total-xp': '0',
            'xp-today': '0',
            'xp-week': '0',
            'audits-done': '0',
            'audits-received': '0',
            'audit-ratio': '0',
            'completed-projects': '0',
            'current-grade': '0%',
            'total-transactions': '0'
        };
        
        Object.entries(elementsToClear).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Clear skills list
        const skillsList = document.getElementById('skills-list');
        if (skillsList) skillsList.innerHTML = '<p>Loading skills...</p>';
        
        // Clear charts
        this.clearCharts();
    }

    clearCharts() {
        const svgElements = ['#xp-svg', '#audit-svg', '#projects-svg'];
        svgElements.forEach(selector => {
            const svg = d3.select(selector);
            if (svg) {
                svg.selectAll("*").remove();
            }
        });
    }

    async showLoginPage() {
        const loginPage = document.getElementById('login-page');
        const profilePage = document.getElementById('profile-page');
        
        if (loginPage) {
            loginPage.classList.remove('hidden');
        }
        if (profilePage) {
            profilePage.classList.add('hidden');
        }
        
        // Force a reflow
        await new Promise(resolve => {
            if (loginPage) void loginPage.offsetHeight;
            setTimeout(resolve, 50);
        });
    }

    async showProfilePage() {
        const loginPage = document.getElementById('login-page');
        const profilePage = document.getElementById('profile-page');
        
        if (loginPage) {
            loginPage.classList.add('hidden');
        }
        if (profilePage) {
            profilePage.classList.remove('hidden');
            
            // Force a reflow to ensure DOM is updated
            await new Promise(resolve => {
                void profilePage.offsetHeight;
                setTimeout(resolve, 100);
            });
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (!loadingElement) return;
        
        if (show) {
            loadingElement.classList.remove('hidden');
            this.isLoading = true;
        } else {
            loadingElement.classList.add('hidden');
            this.isLoading = false;
        }
    }

    switchChart(chartId, buttonElement) {
        if (this.isLoading || !this.hasDataLoaded) return;
        
        // Hide all charts
        document.querySelectorAll('.chart').forEach(chart => {
            chart.classList.add('hidden');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.btn-chart').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected chart
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            chartElement.classList.remove('hidden');
        }
        
        // Set active button
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
    }

    async loadProfileData() {
        // Reset loading state to ensure we can load
        if (this.isLoading) {
            console.log('Resetting loading state and retrying...');
            this.isLoading = false;
            this.showLoading(false);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('Starting to load profile data for user:', auth.userId);
        this.showLoading(true);
        this.hasDataLoaded = false;
        this.isLoading = true;

        try {
            // Load all data in parallel
            await Promise.all([
                this.loadUserInfo(),
                this.loadUserLevel(),
                this.loadAverageGrade(),
                this.loadXPStats(),
                this.loadAuditStats(),
                this.loadProjectsStats(),
                this.loadSkills()
            ]);
            
            this.hasDataLoaded = true;
            console.log('All profile data loaded successfully!');
            
            console.log('Data loaded - Projects:', this.userStats.projects);
            console.log('Data loaded - Audits:', this.userStats.audits);
            
            // Ensure XP chart is shown by default
            this.switchChart('xp-chart', document.getElementById('btn-xp-chart'));
            
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.hasDataLoaded = false;
            
            if (error.message.includes('Session expired') || error.message.includes('JWT')) {
                auth.logout();
                this.showLoginPage();
                const errorElement = document.getElementById('error-message');
                if (errorElement) {
                    errorElement.textContent = 'Your session has expired. Please login again.';
                    errorElement.style.display = 'block';
                }
            } else {
                console.error('Data loading error:', error);
            }
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    }

    async loadUserInfo() {
        try {
            console.log('Loading user info...');
            const userData = await graphql.getUserInfo();
            
            if (userData?.user?.[0]) {
                this.displayUserInfo(userData.user[0]);
                console.log('User info loaded');
            } else {
                console.warn('No user data found');
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            throw error;
        }
    }

    displayUserInfo(user) {
        
        const idElement = document.getElementById('user-id');
        const loginElement = document.getElementById('user-login');
        const emailElement = document.getElementById('user-email');
        
        if (idElement) idElement.textContent = user.id || 'N/A';
        if (loginElement) loginElement.textContent = user.login || 'N/A';
        
        let email = 'N/A';
        if (user.attrs) {
            if (typeof user.attrs === 'string') {
                try {
                    const attrs = JSON.parse(user.attrs);
                    email = attrs.email || attrs.Email || attrs.EMAIL || 'N/A';
                } catch (e) {
                    email = user.attrs;
                }
            } else if (typeof user.attrs === 'object') {
                email = user.attrs.email || user.attrs.Email || user.attrs.EMAIL || 'N/A';
            }
        }
        if (emailElement) emailElement.textContent = email;
        
        console.log('User info displayed:', user.login);
    }

    async loadUserLevel() {
        try {
            console.log('Loading user level...');
            const levelData = await graphql.getUserLevel();
            
            if (levelData?.transaction?.[0]?.amount) {
                const level = levelData.transaction[0].amount;
                this.userStats.level = level;
                
                
                const levelElement = document.getElementById('user-level');
                if (levelElement) {
                    levelElement.textContent = level;
                }
                console.log('User level loaded:', level);
            } else {
                console.log('No level data found');
                const levelElement = document.getElementById('user-level');
                if (levelElement) {
                    levelElement.textContent = 'N/A';
                }
            }
        } catch (error) {
            console.error('Error loading user level:', error);
            const levelElement = document.getElementById('user-level');
            if (levelElement) {
                levelElement.textContent = 'Error';
            }
        }
    }

    async loadAverageGrade() {
        try {
            console.log('Loading average grade...');
            const gradeData = await graphql.getAverageGrade();
            
            if (gradeData?.progress_aggregate?.aggregate?.avg?.grade) {
                const averageGrade = gradeData.progress_aggregate.aggregate.avg.grade;
                const percentage = (averageGrade * 100).toFixed(1);
                
                
                const gradeElement = document.getElementById('current-grade');
                if (gradeElement) {
                    gradeElement.textContent = `${percentage}%`;
                }
                console.log('Average grade loaded:', percentage + '%');
            } else {
                console.log('No grade data found');
                const gradeElement = document.getElementById('current-grade');
                if (gradeElement) {
                    gradeElement.textContent = 'N/A';
                }
            }
        } catch (error) {
            console.error('Error loading average grade:', error);
            const gradeElement = document.getElementById('current-grade');
            if (gradeElement) {
                gradeElement.textContent = 'Error';
            }
        }
    }

   async loadXPStats() {
    try {
        console.log('Loading XP stats...');

        // Get all XP transactions
        const xpData = await graphql.getTotalXP();

        // Extract transactions
        let allTransactions = xpData?.user?.[0]?.transactions || [];
        
        console.log('Total transactions:', allTransactions.length);
        console.log('=== XP CALCULATION ===');

        
        let includedCount = 0;
        let excludedCount = 0;
        let totalXP = 0;
        
        let validTransactions = allTransactions.filter(transaction => {
            const path = transaction.path || '';
            const objectType = transaction.object?.type || '';
            const amount = transaction.amount || 0;
            
            console.log({
                amount: amount,
                objectType: objectType,
                path: path
            });
            
            if (path.includes('/bh-piscine')) {
                console.log('   EXCLUDED (bh-piscine)');
                excludedCount++;
                return false;
            }
            if (path.includes('/piscine') && objectType !== 'piscine') {
                console.log('   EXCLUDED (exercise/raid inside piscine)');
                excludedCount++;
                return false;
            }
            
            console.log('   INCLUDED:', amount);
            includedCount++;
            totalXP += amount;
            return true;
        });
        
        console.log('---');
        console.log('Included:', includedCount);
        console.log('Excluded:', excludedCount);
        console.log('Total XP:', totalXP);
        console.log('====================');

        if (validTransactions.length === 0) {
            console.warn('No valid XP transactions found');
            const totalXpElement = document.getElementById('total-xp');
            if (totalXpElement) totalXpElement.textContent = '0 kB';
            return;
        }

        // Convert bytes to KB 
        const totalXPKB = (totalXP / 1000).toFixed(2);

        this.userStats.totalXP = totalXPKB;
        this.userStats.xpTransactions = validTransactions;

        
        const totalXpElement = document.getElementById('total-xp');
        if (totalXpElement) {
            totalXpElement.textContent = `${totalXPKB} kB`;
            totalXpElement.title = `${validTransactions.length} passed transactions`;
        }

        console.log('Total XP (in bytes):', totalXP);
        console.log('Total XP (in kB):', totalXPKB);
        console.log('Valid transactions:', validTransactions.length);

        // Calculate XP info by date
        this.calculateXPInfo(validTransactions);

        // Generate chart
        setTimeout(() => {
            if (validTransactions.length > 0) {
                const sortedTransactions = [...validTransactions].sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );
                charts.generateXPChart('#xp-svg', sortedTransactions);
                console.log('XP chart generated with', validTransactions.length, 'transactions');
            }
        }, 500);

        
        const transactionsElement = document.getElementById('total-transactions');
        if (transactionsElement) {
            transactionsElement.textContent = validTransactions.length.toLocaleString();
        }

    } catch (error) {
        console.error('Error loading XP stats:', error);
        const totalXpElement = document.getElementById('total-xp');
        if (totalXpElement) totalXpElement.textContent = 'Error';
    }
}

// Calculate XP info by date
calculateXPInfo(transactions) {
    if (!transactions || transactions.length === 0) {
        const todayElement = document.getElementById('xp-today');
        const weekElement = document.getElementById('xp-week');

        if (todayElement) todayElement.textContent = '0 kB';
        if (weekElement) weekElement.textContent = '0 kB';
        return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    let xpTodayBytes = 0;
    let xpThisWeekBytes = 0;

    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const amount = parseInt(transaction.amount) || 0;

        if (transactionDate >= todayStart) {
            xpTodayBytes += amount;
        }

        if (transactionDate >= weekAgo) {
            xpThisWeekBytes += amount;
        }
    });

    // Convert to KB 
    const xpToday = (xpTodayBytes / 1000).toFixed(2);
    const xpThisWeek = (xpThisWeekBytes / 1000).toFixed(2);

    
    const todayElement = document.getElementById('xp-today');
    const weekElement = document.getElementById('xp-week');

    if (todayElement) {
        todayElement.textContent = `${xpToday} kB`;
        todayElement.title = `XP earned today`;
    }
    if (weekElement) {
        weekElement.textContent = `${xpThisWeek} kB`;
        weekElement.title = `XP earned this week`;
    }

    console.log('XP this week:', xpThisWeek, 'kB');
    console.log('XP today:', xpToday, 'kB');
}

    async loadAuditStats() {
        try {
            console.log('Loading audit stats...');

            // Get all audit transactions 
            const auditResponse = await graphql.getAuditTransactions(1000);
            const auditsGiven = auditResponse?.audit || [];

            console.log('Total audits:', auditsGiven.length);

            // Calculate statistics based on audit status
            const succeededCount = auditsGiven.filter(a => {
                const grade = a.grade;
                return grade !== null && grade >= 1;
            }).length;

            const failedCount = auditsGiven.filter(a => {
                const grade = a.grade;
                return grade !== null && grade < 1;
            }).length;

            const expiredCount = auditsGiven.filter(a => {
                const isExpired = a.endAt && new Date(a.endAt) < new Date() && a.grade === null;
                return isExpired;
            }).length;

            const invalidatedCount = auditsGiven.filter(a => {
                const isExpired = a.endAt && new Date(a.endAt) < new Date() && a.grade === null;
                const isInvalidated = a.resultId !== null && a.grade === null && !isExpired;
                return isInvalidated;
            }).length;

            const pendingCount = auditsGiven.filter(a => {
                const isExpired = a.endAt && new Date(a.endAt) < new Date() && a.grade === null;
                const isInvalidated = a.resultId !== null && a.grade === null && !isExpired;
                return !isExpired && !isInvalidated && (a.grade === null || a.grade === undefined);
            }).length;

            const totalAudits = auditsGiven.length;

            console.log('Audit stats - Succeeded:', succeededCount, 'Failed:', failedCount, 'Expired:', expiredCount, 'Pending:', pendingCount);

            // Get audit XP for ratio calculation
            const auditRatioData = await graphql.getAuditRatio();
            let auditsDoneXP = 0;
            let auditsReceivedXP = 0;
            let auditRatio = 0;

            if (auditRatioData) {
                auditsDoneXP = auditRatioData?.auditUp?.aggregate?.sum?.amount || 0;
                auditsReceivedXP = auditRatioData?.auditDown?.aggregate?.sum?.amount || 0;

                // Calculate ratio: given / received
                if (!auditsReceivedXP || auditsReceivedXP === 0) {
                    auditRatio = 0;
                } else {
                    auditRatio = auditsDoneXP / auditsReceivedXP;
                }
            }

            console.log('Audit XP - Done:', auditsDoneXP, 'Received:', auditsReceivedXP, 'Ratio:', auditRatio);

            // Store data
            this.userStats.audits = {
                total: totalAudits,
                succeeded: succeededCount,
                failed: failedCount,
                expired: expiredCount,
                invalidated: invalidatedCount,
                pending: pendingCount,
                ratio: auditRatio,
                xp: { done: auditsDoneXP, received: auditsReceivedXP }
            };

            
            const doneElement = document.getElementById('audits-done');

            if (doneElement) {
                doneElement.innerHTML = `<div style="margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 0.8rem;">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 0.3rem;">Total Audits</div>
                        <div style="font-size: 2em; font-weight: bold; color: #333;">${totalAudits}</div>
                    </div>
                    <div style="margin-bottom: 1rem; padding-top: 1rem; border-top: 2px solid #ddd;">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 0.3rem;">Audit Ratio</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #4a6fa5;">${auditRatio.toFixed(2)}</div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 16px; height: 16px; background: #4caf50; border-radius: 2px;"></div>
                        <span style="font-size: 0.95em;">Succeeded: ${succeededCount} <span style="opacity: 0.7;">(${totalAudits > 0 ? ((succeededCount / totalAudits) * 100).toFixed(1) : 0}%)</span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 16px; height: 16px; background: #f44336; border-radius: 2px;"></div>
                        <span style="font-size: 0.95em;">Failed: ${failedCount} <span style="opacity: 0.7;">(${totalAudits > 0 ? ((failedCount / totalAudits) * 100).toFixed(1) : 0}%)</span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 16px; height: 16px; background: #ff9800; border-radius: 2px;"></div>
                        <span style="font-size: 0.95em;">Expired: ${expiredCount} <span style="opacity: 0.7;">(${totalAudits > 0 ? ((expiredCount / totalAudits) * 100).toFixed(1) : 0}%)</span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 16px; height: 16px; background: #2196f3; border-radius: 2px;"></div>
                        <span style="font-size: 0.95em;">Pending: ${pendingCount} <span style="opacity: 0.7;">(${totalAudits > 0 ? ((pendingCount / totalAudits) * 100).toFixed(1) : 0}%)</span></span>
                    </div>
                </div>`;
            }

            // Generate chart with status breakdown
            setTimeout(() => {
                charts.generateAuditChart('#audit-svg', [
                    { label: 'Succeeded', value: succeededCount },
                    { label: 'Failed', value: failedCount },
                    { label: 'Expired', value: expiredCount },
                    { label: 'Pending', value: pendingCount }
                ]);
                console.log('Audit chart generated');
            }, 500);

        } catch (error) {
            console.error('Error loading audit stats:', error);

            const doneElement = document.getElementById('audits-done');

            if (doneElement) doneElement.textContent = 'Error loading audits';
        }
    }

    async loadProjectsStats() {
        try {
            console.log('Loading projects stats...');
            const projectsData = await graphql.getProjectsStatus();

            // Combine results from both tables
            let allRecords = [];

            if (projectsData?.progress && Array.isArray(projectsData.progress)) {
                allRecords = allRecords.concat(projectsData.progress);
            }

            if (projectsData?.result && Array.isArray(projectsData.result)) {
                allRecords = allRecords.concat(projectsData.result);
            }

            console.log('Total records found:', allRecords.length);
            console.log('First 5 records:', allRecords.slice(0, 5));

            if (allRecords.length > 0) {
                
                const latestByObjectId = {};

                allRecords.forEach(record => {
                    const objectId = record.objectId;
                    const projectName = record.object?.name || `Project ${objectId}`;

                    if (!objectId) {
                        console.warn('Record without objectId:', record);
                        return;
                    }

                   
                    if (!latestByObjectId[objectId] ||
                        new Date(record.createdAt) > new Date(latestByObjectId[objectId].createdAt)) {
                        latestByObjectId[objectId] = {
                            ...record,
                            projectName: projectName
                        };
                    }
                });

                const uniqueProjects = Object.values(latestByObjectId);
                console.log('Unique projects after deduplication:', uniqueProjects.length);
                console.log('Unique projects:', uniqueProjects.map(p => ({ name: p.projectName, grade: p.grade })));

                // Calculate statistics
                let passed = 0;
                let failed = 0;
                let inProgress = 0;

                uniqueProjects.forEach(project => {
                    const grade = project.grade;

                    if (grade === null || grade === undefined) {
                        inProgress++;
                    } else {
                        const numericGrade = parseFloat(grade);
                        if (numericGrade > 0) {
                            passed++;
                        } else if (numericGrade === 0) {
                            failed++;
                        } else {
                            inProgress++;
                        }
                    }
                });

                const totalProjects = uniqueProjects.length;

                this.userStats.projects = {
                    total: totalProjects,
                    passed: passed,
                    failed: failed,
                    inProgress: inProgress
                };

                console.log('Projects stats:', this.userStats.projects);

                
                const completedElement = document.getElementById('completed-projects');
                if (completedElement) {
                    completedElement.textContent = passed;
                }

                // Prepare chart data
                const projectData = [
                    { label: "Passed", value: passed, color: '#28a745' },
                    { label: "Failed", value: failed, color: '#e74c3c' },
                    { label: "In Progress", value: inProgress, color: '#ffc107' }
                ];

                // Generate chart
                setTimeout(() => {
                    charts.generateProjectsChart('#projects-svg', projectData);
                    console.log('Projects chart generated');
                }, 500);

            } else {
                console.log('No projects data found');
                const completedElement = document.getElementById('completed-projects');
                if (completedElement) {
                    completedElement.textContent = '0';
                }

                
                setTimeout(() => {
                    charts.generateProjectsChart('#projects-svg', [
                        { label: "No Data", value: 1, color: '#cccccc' }
                    ]);
                }, 500);
            }
        } catch (error) {
            console.error('Error loading projects stats:', error);
            const completedElement = document.getElementById('completed-projects');
            if (completedElement) {
                completedElement.textContent = 'Error';
            }
        }
    }

    async loadSkills() {
        try {
            console.log('Loading skills...');
            const skillsData = await graphql.getSkillsWithNames();

            console.log('Skills data received:', skillsData);
            console.log('Skills transaction array:', skillsData?.transaction);

            if (skillsData?.transaction && Array.isArray(skillsData.transaction)) {
                let allSkills = skillsData.transaction;
                console.log('Total ALL skill records:', allSkills.length);
                console.log('First 5 skills:', allSkills.slice(0, 5));

                if (allSkills.length === 0) {
                    console.log('Received empty skills array');
                    const skillsList = document.getElementById('skills-list');
                    if (skillsList) {
                        skillsList.innerHTML = '<p class="no-data">No skills data available</p>';
                    }
                    return;
                }

                // Group skills by type and keep the max amount for each skill
                const skillsMap = new Map();
                allSkills.forEach(s => {
                    const amount = parseInt(s.amount) || 0;
                    const skillName = s.type.replace('skill_', '').replace(/_/g, ' ').replace(/-/g, ' ').toUpperCase();
                    
                    const currentAmount = skillsMap.get(skillName)?.amount || 0;
                    if (amount > currentAmount) {
                        skillsMap.set(skillName, {
                            type: s.type,
                            amount: amount,
                            name: skillName,
                            objectName: s.object?.name || 'Unknown'
                        });
                    }
                });
                
                // Convert to array and sort by amount descending
                const uniqueSkills = Array.from(skillsMap.values())
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 6); 
                
                console.log('Unique skills after grouping:', uniqueSkills.length);
                console.log('Top skills:', uniqueSkills.map(s => ({ name: s.name, amount: s.amount })));

                if (uniqueSkills.length > 0) {
                    this.userStats.skills = uniqueSkills;

                    
                    setTimeout(() => {
                        charts.generateSkillsChart(uniqueSkills);
                        console.log('Skills chart generated with', uniqueSkills.length, 'skills');
                    }, 500);
                } else {
                    console.log('No unique skills after filtering');
                    const skillsList = document.getElementById('skills-list');
                    if (skillsList) {
                        skillsList.innerHTML = '<p class="no-data">No skills data available</p>';
                    }
                }
            } else {
                console.log('No skills in response - response:', skillsData);
                const skillsList = document.getElementById('skills-list');
                if (skillsList) {
                    skillsList.innerHTML = '<p class="no-data">No skills data available</p>';
                }
            }
        } catch (error) {
            console.error('Error loading skills:', error);
            const skillsList = document.getElementById('skills-list');
            if (skillsList) {
                skillsList.innerHTML = '<p class="error">Error loading skills</p>';
            }
        }
    }

    formatXP(xp) {
        if (xp >= 1000000) {
            return (xp / 1000000).toFixed(1) + ' MB';
        } else if (xp >= 1000) {
            return (xp / 1000).toFixed(1) + ' kB';
        } else {
            return xp + ' B';
        }
    }

    formatKB(kb) {
        if (kb >= 1000) {
            return (kb / 1000).toFixed(1) + ' MB';
        } else {
            return kb.toFixed(1) + ' kB';
        }
    }
}

function fixAutocompleteWarning() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) {
        usernameInput.setAttribute('autocomplete', 'username');
    }
    if (passwordInput) {
        passwordInput.setAttribute('autocomplete', 'current-password');
    }
}

let appInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileApp...');
    
    if (appInitialized) {
        console.log('App already initialized, skipping...');
        return;
    }
    
    // Fix autocomplete warning
    fixAutocompleteWarning();
    
    try {
        const app = new ProfileApp();
        app.init();
        appInitialized = true;
        console.log('ProfileApp initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ProfileApp:', error);
    }
});