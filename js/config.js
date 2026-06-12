// ============================================
// CONFIG.JS - AtomA Admin System
// Firebase Realtime Database Configuration
// Secret Key Only Authentication (No Email)
// ============================================

import { initializeApp } from "firebase/app";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    update, 
    remove, 
    push, 
    onValue,
    query,
    orderByChild,
    equalTo,
    limitToLast
} from "firebase/database";

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyB2kK4XCKF2wN434O0On9gFHPdrYUJdsug",
    authDomain: "atomea-f9c0b.firebaseapp.com",
    projectId: "atomea-f9c0b",
    storageBucket: "atomea-f9c0b.firebasestorage.app",
    messagingSenderId: "41581075830",
    appId: "1:41581075830:web:f74f7f5fe27713c8feae57",
    measurementId: "G-7M7FYVHZEH",
    databaseURL: "https://atomea-f9c0b-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ============================================
// DEFAULT CONFIGURATION
// ============================================
const DEFAULT_SECRET_KEY = "admin1234";
const APP_NAME = "AtomA Admin";
const APP_VERSION = "1.0.0";

// ============================================
// INITIALIZE SYSTEM
// ============================================

// Initialize admin secret key in Firebase
async function initAdmin() {
    try {
        const adminRef = ref(database, 'admin/config');
        const snapshot = await get(adminRef);
        
        if (!snapshot.exists()) {
            await set(adminRef, {
                secretKey: DEFAULT_SECRET_KEY,
                createdAt: new Date().toISOString(),
                isDefault: true,
                appName: APP_NAME,
                version: APP_VERSION
            });
            console.log("✅ Default admin initialized with secret key:", DEFAULT_SECRET_KEY);
        } else {
            console.log("✅ Admin already exists");
        }
        return { success: true };
    } catch (error) {
        console.error("Init admin error:", error);
        return { success: false, error: error.message };
    }
}

// Initialize default phases
async function initPhases() {
    try {
        const phasesRef = ref(database, 'phases');
        const snapshot = await get(phasesRef);
        
        if (!snapshot.exists()) {
            const defaultPhases = {
                phase1: { 
                    active: false, 
                    name: "Alpha Launch", 
                    description: "Initial rollout: Credit increase up to ₱5,000", 
                    icon: "🚀",
                    createdAt: new Date().toISOString()
                },
                phase2: { 
                    active: false, 
                    name: "Growth Surge", 
                    description: "Credit limit up to ₱10,000 + cashback boost", 
                    icon: "📈",
                    createdAt: new Date().toISOString()
                },
                phase3: { 
                    active: false, 
                    name: "Elite Access", 
                    description: "Unlimited perks, priority withdrawals, iPhone raffle", 
                    icon: "💎",
                    createdAt: new Date().toISOString()
                }
            };
            await set(phasesRef, defaultPhases);
            console.log("✅ Default phases initialized");
        }
        return { success: true };
    } catch (error) {
        console.error("Init phases error:", error);
        return { success: false, error: error.message };
    }
}

// Initialize settings
async function initSettings() {
    try {
        const settingsRef = ref(database, 'settings');
        const snapshot = await get(settingsRef);
        
        if (!snapshot.exists()) {
            await set(settingsRef, {
                maxWaitlistUsers: 10000,
                maxClaimAmount: 10000,
                minClaimAmount: 300,
                maintenanceMode: false,
                updatedAt: new Date().toISOString()
            });
            console.log("✅ Default settings initialized");
        }
        return { success: true };
    } catch (error) {
        console.error("Init settings error:", error);
        return { success: false, error: error.message };
    }
}

// Complete system initialization
async function initializeSystem() {
    console.log("🔥 Initializing AtomA System...");
    await initAdmin();
    await initPhases();
    await initSettings();
    console.log("✅ AtomA System Ready!");
    console.log("🔑 Default Secret Key: admin1234");
    return { success: true };
}

// ============================================
// ADMIN AUTHENTICATION (Secret Key Only)
// ============================================

// Login with secret key only
async function adminLogin(secretKey) {
    try {
        const adminRef = ref(database, 'admin/config');
        const snapshot = await get(adminRef);
        
        if (!snapshot.exists()) {
            await initAdmin();
            return adminLogin(secretKey);
        }
        
        const adminData = snapshot.val();
        
        if (secretKey !== adminData.secretKey) {
            // Log failed attempt
            const logRef = ref(database, `admin/logs/failed/${Date.now()}`);
            await set(logRef, {
                timestamp: new Date().toISOString(),
                success: false,
                reason: "Invalid secret key"
            });
            return { success: false, error: "Invalid secret key" };
        }
        
        // Log successful login
        const logRef = ref(database, `admin/logs/success/${Date.now()}`);
        await set(logRef, {
            loginTime: new Date().toISOString(),
            success: true
        });
        
        // Store session in localStorage
        const sessionData = {
            isLoggedIn: true,
            role: "admin",
            loginTime: new Date().toISOString(),
            sessionId: Date.now().toString()
        };
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        
        return { success: true, message: "Login successful" };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
    }
}

// Check if admin is logged in
function isAdminLoggedIn() {
    try {
        const session = localStorage.getItem('adminSession');
        if (!session) return false;
        const sessionData = JSON.parse(session);
        return sessionData.isLoggedIn === true;
    } catch {
        return false;
    }
}

// Get current admin session
function getCurrentAdmin() {
    try {
        const session = localStorage.getItem('adminSession');
        if (!session) return null;
        return JSON.parse(session);
    } catch {
        return null;
    }
}

// Admin logout
function adminLogout() {
    localStorage.removeItem('adminSession');
    return { success: true, message: "Logged out successfully" };
}

// Verify secret key
async function verifySecretKey(secretKey) {
    try {
        const adminRef = ref(database, 'admin/config');
        const snapshot = await get(adminRef);
        if (!snapshot.exists()) return false;
        return snapshot.val().secretKey === secretKey;
    } catch {
        return false;
    }
}

// Update secret key
async function updateSecretKey(currentKey, newKey) {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    if (!newKey || newKey.length < 4) {
        return { success: false, error: "New secret key must be at least 4 characters" };
    }
    
    const adminRef = ref(database, 'admin/config');
    const snapshot = await get(adminRef);
    
    if (!snapshot.exists()) {
        return { success: false, error: "Admin not configured" };
    }
    
    const adminData = snapshot.val();
    
    if (currentKey !== adminData.secretKey) {
        return { success: false, error: "Current secret key is incorrect" };
    }
    
    await update(adminRef, {
        secretKey: newKey,
        updatedAt: new Date().toISOString(),
        previousKey: currentKey
    });
    
    return { success: true, message: "Secret key updated successfully" };
}

// ============================================
// PHASE MANAGEMENT
// ============================================

// Get all phases (real-time listener)
function getAllPhases(callback) {
    const phasesRef = ref(database, 'phases');
    return onValue(phasesRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
}

// Get phases once (without listener)
async function getPhasesOnce() {
    try {
        const phasesRef = ref(database, 'phases');
        const snapshot = await get(phasesRef);
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: false, data: null, error: "No phases found" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get single phase
async function getPhase(phaseNumber) {
    try {
        const phaseRef = ref(database, `phases/phase${phaseNumber}`);
        const snapshot = await get(phaseRef);
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: false, error: `Phase ${phaseNumber} not found` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update phase status
async function updatePhaseStatus(phaseNumber, isActive, phaseData = {}) {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const phaseRef = ref(database, `phases/phase${phaseNumber}`);
        const currentAdmin = getCurrentAdmin();
        
        await update(phaseRef, {
            active: isActive,
            name: phaseData.name,
            description: phaseData.description,
            updatedAt: new Date().toISOString(),
            updatedBy: "admin"
        });
        
        // Log action
        const logRef = ref(database, `admin/logs/actions/${Date.now()}`);
        await set(logRef, {
            action: `phase${phaseNumber}_toggle`,
            status: isActive ? "active" : "inactive",
            timestamp: new Date().toISOString(),
            admin: currentAdmin?.sessionId || "unknown"
        });
        
        return { success: true, message: `Phase ${phaseNumber} updated successfully` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// WAITLIST MANAGEMENT
// ============================================

// Add to waitlist (public)
async function addToWaitlist(phoneNumber, userData = {}) {
    try {
        // Validate phone number
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length < 10) {
            return { success: false, error: "Invalid phone number" };
        }
        
        // Check if phone number already exists
        const waitlistRef = ref(database, 'waitlist');
        const snapshot = await get(waitlistRef);
        
        if (snapshot.exists()) {
            const entries = snapshot.val();
            for (let key in entries) {
                if (entries[key].phoneNumber === phoneNumber) {
                    return { success: false, error: "Phone number already registered" };
                }
            }
        }
        
        // Add new entry
        const newEntryRef = push(waitlistRef);
        const newEntry = {
            phoneNumber: phoneNumber,
            registeredAt: new Date().toISOString(),
            status: 'pending',
            source: userData.source || 'web',
            ...userData
        };
        await set(newEntryRef, newEntry);
        
        return { success: true, message: "Added to waitlist successfully", id: newEntryRef.key, data: newEntry };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get all waitlist entries (admin only)
async function getWaitlistEntries() {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const waitlistRef = ref(database, 'waitlist');
        const snapshot = await get(waitlistRef);
        
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: true, data: {} };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get waitlist count
async function getWaitlistCount() {
    try {
        const result = await getWaitlistEntries();
        if (result.success && result.data) {
            return Object.keys(result.data).length;
        }
        return 0;
    } catch {
        return 0;
    }
}

// Update waitlist status (admin only)
async function updateWaitlistStatus(entryId, status) {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const entryRef = ref(database, `waitlist/${entryId}`);
        await update(entryRef, {
            status: status,
            updatedAt: new Date().toISOString()
        });
        return { success: true, message: "Waitlist entry updated" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete waitlist entry (admin only)
async function deleteWaitlistEntry(entryId) {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const entryRef = ref(database, `waitlist/${entryId}`);
        await remove(entryRef);
        return { success: true, message: "Waitlist entry deleted" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// CLAIMS MANAGEMENT
// ============================================

// Record a claim
async function recordClaim(userId, claimData) {
    try {
        const claimsRef = ref(database, 'claims');
        const newClaimRef = push(claimsRef);
        
        const newClaim = {
            userId: userId,
            amount: claimData.amount,
            timestamp: new Date().toISOString(),
            phase: claimData.phase || 1,
            status: 'completed',
            source: claimData.source || 'app',
            ...claimData
        };
        
        await set(newClaimRef, newClaim);
        
        // Update user stats if user exists
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            await update(userRef, {
                totalClaimed: (userData.totalClaimed || 0) + claimData.amount,
                lastClaimDate: new Date().toISOString(),
                claimCount: (userData.claimCount || 0) + 1
            });
        }
        
        return { success: true, message: "Claim recorded", claimId: newClaimRef.key };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get all claims (admin only)
async function getAllClaims() {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const claimsRef = ref(database, 'claims');
        const snapshot = await get(claimsRef);
        
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: true, data: {} };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get claims count
async function getClaimsCount() {
    try {
        const result = await getAllClaims();
        if (result.success && result.data) {
            return Object.keys(result.data).length;
        }
        return 0;
    } catch {
        return 0;
    }
}

// Get total rewards amount
async function getTotalRewardsAmount() {
    try {
        const result = await getAllClaims();
        let total = 0;
        if (result.success && result.data) {
            Object.values(result.data).forEach(claim => {
                total += claim.amount || 0;
            });
        }
        return total;
    } catch {
        return 0;
    }
}

// Get claims by user
async function getClaimsByUser(userId) {
    try {
        const claimsRef = ref(database, 'claims');
        const userClaimsQuery = query(claimsRef, orderByChild('userId'), equalTo(userId));
        const snapshot = await get(userClaimsQuery);
        
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: true, data: {} };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// STATISTICS
// ============================================

// Get complete stats
async function getStats() {
    try {
        const waitlistCount = await getWaitlistCount();
        const claimsCount = await getClaimsCount();
        const totalAmount = await getTotalRewardsAmount();
        
        return { 
            success: true, 
            waitlistCount, 
            claimsCount, 
            totalAmount,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get dashboard summary
async function getDashboardSummary() {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const phases = await getPhasesOnce();
        const stats = await getStats();
        
        return {
            success: true,
            phases: phases.data,
            stats: stats,
            systemInfo: {
                appName: APP_NAME,
                version: APP_VERSION,
                serverTime: new Date().toISOString()
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// SYSTEM SETTINGS
// ============================================

// Get system settings
async function getSettings() {
    try {
        const settingsRef = ref(database, 'settings');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        await initSettings();
        return getSettings();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update system settings (admin only)
async function updateSettings(settingsData) {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        const settingsRef = ref(database, 'settings');
        await update(settingsRef, {
            ...settingsData,
            updatedAt: new Date().toISOString(),
            updatedBy: "admin"
        });
        return { success: true, message: "Settings updated" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// CLEAR ALL DATA (Admin only - Use with caution)
// ============================================
async function clearAllData() {
    if (!isAdminLoggedIn()) {
        return { success: false, error: "Admin access required" };
    }
    
    try {
        // Clear waitlist
        const waitlistRef = ref(database, 'waitlist');
        await set(waitlistRef, {});
        
        // Clear claims
        const claimsRef = ref(database, 'claims');
        await set(claimsRef, {});
        
        return { success: true, message: "All data cleared" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORTS
// ============================================
export {
    // Firebase instances
    app,
    database,
    
    // Configuration
    DEFAULT_SECRET_KEY,
    APP_NAME,
    APP_VERSION,
    
    // Initialization
    initializeSystem,
    initAdmin,
    initPhases,
    initSettings,
    
    // Admin authentication
    adminLogin,
    adminLogout,
    isAdminLoggedIn,
    getCurrentAdmin,
    verifySecretKey,
    updateSecretKey,
    
    // Phase management
    getAllPhases,
    getPhasesOnce,
    getPhase,
    updatePhaseStatus,
    
    // Waitlist management
    addToWaitlist,
    getWaitlistEntries,
    getWaitlistCount,
    updateWaitlistStatus,
    deleteWaitlistEntry,
    
    // Claims management
    recordClaim,
    getAllClaims,
    getClaimsCount,
    getTotalRewardsAmount,
    getClaimsByUser,
    
    // Statistics
    getStats,
    getDashboardSummary,
    
    // Settings
    getSettings,
    updateSettings,
    
    // Dangerous operations (use with caution)
    clearAllData,
    
    // Re-export Firebase methods for direct use
    ref,
    set,
    get,
    update,
    remove,
    push,
    onValue,
    query,
    orderByChild,
    equalTo,
    limitToLast
};

// Default export
export default {
    app,
    database,
    DEFAULT_SECRET_KEY,
    initializeSystem,
    adminLogin,
    adminLogout,
    isAdminLoggedIn,
    getCurrentAdmin,
    updateSecretKey,
    getAllPhases,
    getPhasesOnce,
    updatePhaseStatus,
    addToWaitlist,
    getWaitlistEntries,
    getWaitlistCount,
    recordClaim,
    getAllClaims,
    getStats,
    getSettings,
    updateSettings
};
