// Authentication and Premium Features Manager
class AuthManager {
    constructor() {
        this.user = null;
        this.isPremium = false;
        this.init();
    }

    async init() {
        // Check if user is already logged in
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            this.user = session.user;
            await this.checkPremiumStatus();
            this.updateUI();
        }

        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            if (session) {
                this.user = session.user;
                this.checkPremiumStatus();
            } else {
                this.user = null;
                this.isPremium = false;
            }
            this.updateUI();
        });
    }

    async signUp(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;

            // Create user profile in database
            if (data.user) {
                await this.createUserProfile(data.user);
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async createUserProfile(user) {
        try {
            const { error } = await supabaseClient
                .from('user_profiles')
                .insert([
                    {
                        id: user.id,
                        email: user.email,
                        is_premium: false,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error && error.code !== '23505') { // Ignore duplicate key error
                throw error;
            }
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async checkPremiumStatus() {
        if (!this.user) return false;

        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('is_premium, premium_tier')
                .eq('id', this.user.id)
                .single();

            if (error) {
                console.error('Error checking premium status:', error);
                return false;
            }

            this.isPremium = data?.is_premium || false;
            this.premiumTier = data?.premium_tier || 'free';
            return this.isPremium;
        } catch (error) {
            console.error('Premium status check error:', error);
            return false;
        }
    }

    async upgradeToPremium() {
        if (!this.user) return { success: false, error: 'User not logged in' };

        try {
            const { error } = await supabaseClient
                .from('user_profiles')
                .update({ is_premium: true })
                .eq('id', this.user.id);

            if (error) throw error;

            this.isPremium = true;
            this.updateUI();
            return { success: true };
        } catch (error) {
            console.error('Premium upgrade error:', error);
            return { success: false, error: error.message };
        }
    }

    updateUI() {
        const loginBtn = document.querySelector('.login-btn');
        const premiumBtn = document.querySelector('.get-premium-btn');
        
        if (this.user) {
            // User is logged in
            if (loginBtn) {
                loginBtn.textContent = 'Logout';
                loginBtn.onclick = () => this.handleLogout();
            }

            if (this.isPremium) {
                // User has premium access - show tier status
                if (premiumBtn) {
                    if (this.premiumTier === 'small_indie') {
                        premiumBtn.textContent = 'Small Indie ✓';
                        premiumBtn.style.background = '#28a745';
                    } else if (this.premiumTier === 'veteran_indie') {
                        premiumBtn.textContent = 'Veteran Indie ✓';
                        premiumBtn.style.background = '#007bff';
                    } else {
                        premiumBtn.textContent = 'Premium ✓';
                        premiumBtn.style.background = '#28a745';
                    }
                    premiumBtn.onclick = null;
                }
                this.enablePremiumFeatures();
            } else {
                // User logged in but no premium
                if (premiumBtn) {
                    premiumBtn.textContent = 'Upgrade to Premium';
                    premiumBtn.onclick = () => this.showPremiumModal();
                }
                this.disablePremiumFeatures();
            }
        } else {
            // User not logged in
            if (loginBtn) {
                loginBtn.textContent = 'Login';
                loginBtn.onclick = () => this.showLoginModal();
            }
            if (premiumBtn) {
                premiumBtn.textContent = 'Get Premium';
                premiumBtn.onclick = () => this.showLoginModal();
            }
            this.disablePremiumFeatures();
        }
    }

    enablePremiumFeatures() {
        // Enable all calculator features
        const calculateBtn = document.getElementById('calcBtn');
        if (calculateBtn) {
            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
        }

        // Remove blur effects for premium users
        this.removePremiumBlur();

        // Show premium badge
        this.showPremiumBadge();
    }

    disablePremiumFeatures() {
        // Remove any existing login overlays - allow basic access for everyone
        const overlay = document.querySelector('.login-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Apply blur effects to premium pricing results instead
        this.applyPremiumBlur();
    }

    showPremiumBadge() {
        let badge = document.querySelector('.premium-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'premium-badge';
            badge.innerHTML = '⭐ Premium User';
            badge.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                color: #000;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
            `;
            document.body.appendChild(badge);
        }
    }

    applyPremiumBlur() {
        // Apply different blur effects based on premium tier
        if (!this.user) {
            // Free users: blur Price C, D and game images 2-5
            this.applyFreeUserBlur();
        } else if (this.premiumTier === 'small_indie') {
            // Tier 1 ($15): Show all prices, blur only game images 4-5
            this.applyTier1Blur();
        } else if (this.premiumTier === 'veteran_indie') {
            // Tier 2 ($25): Show everything (no blur)
            this.removePremiumBlur();
        } else {
            // Default to free user restrictions
            this.applyFreeUserBlur();
        }
    }

    applyFreeUserBlur() {
        // Free users: blur Price C, D and game images 2-5
        const priceCElement = document.getElementById('price-c-value');
        const priceDElement = document.getElementById('price-d-value');
        
        if (priceCElement) {
            priceCElement.style.filter = 'blur(5px)';
            priceCElement.style.position = 'relative';
            priceCElement.setAttribute('data-premium', 'true');
        }
        
        if (priceDElement) {
            priceDElement.style.filter = 'blur(5px)';
            priceDElement.style.position = 'relative';
            priceDElement.setAttribute('data-premium', 'true');
        }

        // Blur game images 2-5 (keep first image visible)
        for (let i = 2; i <= 5; i++) {
            const gameImg = document.getElementById(`game-img-${i}`);
            if (gameImg) {
                gameImg.style.filter = 'blur(8px)';
                gameImg.style.position = 'relative';
                gameImg.setAttribute('data-premium', 'true');
            }
        }

        this.addPremiumOverlays(['price-c-value', 'price-d-value', 'game-img-2', 'game-img-3', 'game-img-4', 'game-img-5']);
    }

    applyTier1Blur() {
        // Tier 1 ($15): Show all prices, show first 3 games, blur games 4-5
        // Remove any existing blur from prices
        const priceCElement = document.getElementById('price-c-value');
        const priceDElement = document.getElementById('price-d-value');
        
        if (priceCElement) {
            priceCElement.style.filter = 'none';
            const overlay = priceCElement.querySelector('.premium-overlay');
            if (overlay) overlay.remove();
        }
        
        if (priceDElement) {
            priceDElement.style.filter = 'none';
            const overlay = priceDElement.querySelector('.premium-overlay');
            if (overlay) overlay.remove();
        }

        // Remove blur from first 3 game images
        for (let i = 1; i <= 3; i++) {
            const gameImg = document.getElementById(`game-img-${i}`);
            if (gameImg) {
                gameImg.style.filter = 'none';
                const overlay = gameImg.querySelector('.premium-overlay');
                if (overlay) overlay.remove();
            }
        }

        // Blur only game images 4-5
        for (let i = 4; i <= 5; i++) {
            const gameImg = document.getElementById(`game-img-${i}`);
            if (gameImg) {
                gameImg.style.filter = 'blur(8px)';
                gameImg.style.position = 'relative';
                gameImg.setAttribute('data-premium', 'true');
            }
        }

        this.addPremiumOverlays(['game-img-4', 'game-img-5']);
    }

    addPremiumOverlays(elements) {
        const premiumElements = elements || ['price-c-value', 'price-d-value', 'game-img-2', 'game-img-3', 'game-img-4', 'game-img-5'];
        
        premiumElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element && !element.querySelector('.premium-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'premium-overlay';
                overlay.innerHTML = '🔒 Premium';
                overlay.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 215, 0, 0.9);
                    color: #000;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: bold;
                    pointer-events: none;
                    z-index: 10;
                `;
                element.style.position = 'relative';
                element.appendChild(overlay);
            }
        });
    }

    removePremiumBlur() {
        // Remove blur effects for premium users
        const priceCElement = document.getElementById('price-c-value');
        const priceDElement = document.getElementById('price-d-value');
        
        if (priceCElement) {
            priceCElement.style.filter = 'none';
            const overlay = priceCElement.querySelector('.premium-overlay');
            if (overlay) overlay.remove();
        }
        
        if (priceDElement) {
            priceDElement.style.filter = 'none';
            const overlay = priceDElement.querySelector('.premium-overlay');
            if (overlay) overlay.remove();
        }

        // Remove blur from game images 2-5
        for (let i = 2; i <= 5; i++) {
            const gameImg = document.getElementById(`game-img-${i}`);
            if (gameImg) {
                gameImg.style.filter = 'none';
                const overlay = gameImg.querySelector('.premium-overlay');
                if (overlay) overlay.remove();
            }
        }
    }

    async handleLogout() {
        const result = await this.signOut();
        if (result.success) {
            // Remove premium badge
            const badge = document.querySelector('.premium-badge');
            if (badge) badge.remove();
            
            // Remove login overlay
            const overlay = document.querySelector('.login-overlay');
            if (overlay) overlay.remove();
            
            alert('Logged out successfully!');
        }
    }

    showLoginModal() {
        this.createAuthModal();
    }

    showPremiumModal() {
        // Show existing premium modal
        const modal = document.getElementById('premiumModal');
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    }

    createAuthModal() {
        // Remove existing auth modal if any
        const existingModal = document.getElementById('authModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'premium-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal" onclick="document.getElementById('authModal').remove()">&times;</button>
                
                <div class="auth-header">
                    <h2>Welcome to P*MIG</h2>
                    <p>Sign in to access premium pricing calculations</p>
                </div>

                <div class="auth-tabs">
                    <button class="auth-tab active" onclick="authManager.switchTab('login')">Login</button>
                    <button class="auth-tab" onclick="authManager.switchTab('signup')">Sign Up</button>
                </div>

                <form id="authForm" class="auth-form">
                    <div class="input-group">
                        <label>Email</label>
                        <input type="email" id="authEmail" class="input-field" required>
                    </div>
                    <div class="input-group">
                        <label>Password</label>
                        <input type="password" id="authPassword" class="input-field" required>
                    </div>
                    <button type="submit" class="auth-submit-btn">Login</button>
                </form>

                <div class="auth-error" id="authError" style="display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');

        // Add form submit handler
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthSubmit();
        });
    }

    switchTab(tab) {
        const tabs = document.querySelectorAll('.auth-tab');
        const submitBtn = document.querySelector('.auth-submit-btn');
        
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[onclick="authManager.switchTab('${tab}')"]`).classList.add('active');
        
        if (tab === 'login') {
            submitBtn.textContent = 'Login';
            submitBtn.onclick = () => this.handleAuthSubmit('login');
        } else {
            submitBtn.textContent = 'Sign Up';
            submitBtn.onclick = () => this.handleAuthSubmit('signup');
        }
    }

    async handleAuthSubmit(mode = 'login') {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const errorDiv = document.getElementById('authError');
        const submitBtn = document.querySelector('.auth-submit-btn');

        if (!email || !password) {
            this.showAuthError('Please fill in all fields');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = mode === 'login' ? 'Logging in...' : 'Signing up...';

        let result;
        if (mode === 'signup') {
            result = await this.signUp(email, password);
        } else {
            result = await this.signIn(email, password);
        }

        if (result.success) {
            document.getElementById('authModal').remove();
            document.body.classList.remove('modal-open');
            alert(mode === 'signup' ? 'Account created successfully!' : 'Logged in successfully!');
        } else {
            this.showAuthError(result.error);
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'login' ? 'Login' : 'Sign Up';
        }
    }

    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#ff4444';
            errorDiv.style.padding = '10px';
            errorDiv.style.marginTop = '10px';
            errorDiv.style.borderRadius = '4px';
            errorDiv.style.background = 'rgba(255, 68, 68, 0.1)';
        }
    }

    // Method to set premium tier (for testing/manual assignment)
    async setPremiumTier(tier) {
        if (!this.user) {
            console.log('User must be logged in to set premium tier');
            return;
        }

        try {
            const { error } = await window.supabase
                .from('user_profiles')
                .update({ 
                    is_premium: true, 
                    premium_tier: tier 
                })
                .eq('id', this.user.id);

            if (error) throw error;

            // Update local state
            this.isPremium = true;
            this.premiumTier = tier;
            
            // Update UI
            this.updateUI();
            this.applyPremiumBlur();

            console.log(`Premium tier set to: ${tier}`);
        } catch (error) {
            console.error('Error setting premium tier:', error);
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
