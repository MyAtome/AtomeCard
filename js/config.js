// config.js - Simple Firebase Config with Admin Secret Key
// AtomA Firebase Project: atomea-f9c0b

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, push } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

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
const auth = getAuth(app);

// ============================================
// DEFAULT ADMIN CREDENTIALS (Only one)
// ============================================
const DEFAULT_ADMIN = {
  email: "admin@atomea.com",
  password: "admin1234",
  secretKey: "admin1234"
};

// Initialize admin in Firebase if not exists
async function initAdmin() {
  const adminRef = ref(database, 'admin/config');
  const snapshot = await get(adminRef);
  
  if (!snapshot.exists()) {
    await set(adminRef, {
      email: DEFAULT_ADMIN.email,
      secretKey: DEFAULT_ADMIN.secretKey,
      createdAt: new Date().toISOString(),
      isDefault: true
    });
    console.log("✅ Default admin initialized");
  }
  return { success: true };
}

// ============================================
// ADMIN LOGIN (Email + Password + Secret Key)
// ============================================
async function adminLogin(email, password, secretKey) {
  try {
    // Check if secret key matches
    const adminRef = ref(database, 'admin/config');
    const snapshot = await get(adminRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: "Admin not configured" };
    }
    
    const adminData = snapshot.val();
    
    // Verify secret key
    if (secretKey !== adminData.secretKey) {
      return { success: false, error: "Invalid admin secret key" };
    }
    
    // Verify email and password
    if (email !== DEFAULT_ADMIN.email || password !== DEFAULT_ADMIN.password) {
      return { success: false, error: "Invalid email or password" };
    }
    
    // Optional: Sign in with Firebase Auth (for future use)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase auth successful");
    } catch (authError) {
      // If Firebase auth fails but credentials match, still allow login
      console.log("Firebase auth not configured, but credentials valid");
    }
    
    // Log login attempt
    const logRef = ref(database, `admin/logs/${Date.now()}`);
    await set(logRef, {
      email: email,
      loginTime: new Date().toISOString(),
      success: true
    });
    
    // Store session
    const sessionData = {
      isLoggedIn: true,
      email: email,
      role: "admin",
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('adminSession', JSON.stringify(sessionData));
    
    return { 
      success: true, 
      message: "Login successful",
      admin: { email: email, role: "admin" }
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CHECK IF ADMIN IS LOGGED IN
// ============================================
function isAdminLoggedIn() {
  const session = localStorage.getItem('adminSession');
  if (!session) return false;
  
  try {
    const sessionData = JSON.parse(session);
    return sessionData.isLoggedIn === true;
  } catch {
    return false;
  }
}

// Get current admin session
function getCurrentAdmin() {
  const session = localStorage.getItem('adminSession');
  if (!session) return null;
  
  try {
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

// ============================================
// UPDATE SECRET KEY (Admin only)
// ============================================
async function updateSecretKey(currentSecretKey, newSecretKey) {
  // Verify current secret key
  const adminRef = ref(database, 'admin/config');
  const snapshot = await get(adminRef);
  
  if (!snapshot.exists()) {
    return { success: false, error: "Admin not configured" };
  }
  
  const adminData = snapshot.val();
  
  if (currentSecretKey !== adminData.secretKey) {
    return { success: false, error: "Current secret key is incorrect" };
  }
  
  // Update secret key
  await update(adminRef, {
    secretKey: newSecretKey,
    updatedAt: new Date().toISOString()
  });
  
  return { success: true, message: "Secret key updated successfully" };
}

// ============================================
// PHASE MANAGEMENT
// ============================================
async function getAllPhases() {
  const phasesRef = ref(database, 'phases');
  const snapshot = await get(phasesRef);
  
  if (snapshot.exists()) {
    return { success: true, data: snapshot.val() };
  } else {
    // Initialize default phases
    const defaultPhases = {
      phase1: { active: false, name: "Alpha Launch", description: "Initial rollout: Credit increase up to ₱5,000" },
      phase2: { active: false, name: "Growth Surge", description: "Credit limit up to ₱10,000 + cashback boost" },
      phase3: { active: false, name: "Elite Access", description: "Unlimited perks, priority withdrawals" }
    };
    await set(phasesRef, defaultPhases);
    return { success: true, data: defaultPhases };
  }
}

async function updatePhaseStatus(phaseNumber, isActive, phaseData = {}) {
  if (!isAdminLoggedIn()) {
    return { success: false, error: "Admin access required" };
  }
  
  const phaseRef = ref(database, `phases/phase${phaseNumber}`);
  const currentAdmin = getCurrentAdmin();
  
  await update(phaseRef, {
    active: isActive,
    name: phaseData.name,
    description: phaseData.description,
    updatedAt: new Date().toISOString(),
    updatedBy: currentAdmin?.email || "admin"
  });
  
  return { success: true, message: `Phase ${phaseNumber} updated successfully` };
}

// ============================================
// WAITLIST MANAGEMENT
// ============================================
async function addToWaitlist(phoneNumber, userData = {}) {
  const waitlistRef = ref(database, 'waitlist');
  const newEntryRef = push(waitlistRef);
  
  await set(newEntryRef, {
    phoneNumber: phoneNumber,
    registeredAt: new Date().toISOString(),
    status: 'pending',
    source: userData.source || 'web',
    ...userData
  });
  
  return { success: true, message: "Added to waitlist", id: newEntryRef.key };
}

async function getWaitlistEntries() {
  if (!isAdminLoggedIn()) {
    return { success: false, error: "Admin access required" };
  }
  
  const waitlistRef = ref(database, 'waitlist');
  const snapshot = await get(waitlistRef);
  
  if (snapshot.exists()) {
    return { success: true, data: snapshot.val() };
  }
  return { success: true, data: {} };
}

// ============================================
// CLAIM MANAGEMENT
// ============================================
async function recordClaim(userId, claimData) {
  const claimsRef = ref(database, 'claims');
  const newClaimRef = push(claimsRef);
  
  await set(newClaimRef, {
    userId: userId,
    amount: claimData.amount,
    timestamp: new Date().toISOString(),
    phase: claimData.phase || 1,
    status: 'completed',
    ...claimData
  });
  
  return { success: true, claimId: newClaimRef.key };
}

async function getAllClaims() {
  if (!isAdminLoggedIn()) {
    return { success: false, error: "Admin access required" };
  }
  
  const claimsRef = ref(database, 'claims');
  const snapshot = await get(claimsRef);
  
  if (snapshot.exists()) {
    return { success: true, data: snapshot.val() };
  }
  return { success: true, data: {} };
}

// ============================================
// SYSTEM INITIALIZATION
// ============================================
async function initializeSystem() {
  await initAdmin();
  await getAllPhases();
  console.log("✅ AtomA System Ready");
  return { success: true };
}

// ============================================
// EXPORTS
// ============================================
export {
  app,
  database,
  auth,
  adminLogin,
  adminLogout,
  isAdminLoggedIn,
  getCurrentAdmin,
  updateSecretKey,
  getAllPhases,
  updatePhaseStatus,
  addToWaitlist,
  getWaitlistEntries,
  recordClaim,
  getAllClaims,
  initializeSystem,
  DEFAULT_ADMIN
};

export default {
  app,
  database,
  auth,
  adminLogin,
  adminLogout,
  isAdminLoggedIn,
  getCurrentAdmin,
  updateSecretKey,
  getAllPhases,
  updatePhaseStatus,
  addToWaitlist,
  getWaitlistEntries,
  recordClaim,
  getAllClaims,
  initializeSystem,
  defaultAdmin: DEFAULT_ADMIN
};
