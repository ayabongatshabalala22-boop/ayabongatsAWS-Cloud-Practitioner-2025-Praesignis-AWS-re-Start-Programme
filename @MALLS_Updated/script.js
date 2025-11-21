// DOM Elements
const dineInForm = document.getElementById('dineInForm');
const takeawayForm = document.getElementById('takeawayForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const confirmationTitle = document.getElementById('confirmationTitle');
const confirmationText = document.getElementById('confirmationText');
const generalMessage = document.getElementById('generalMessage');
const generalMessageText = document.getElementById('generalMessageText');

// PayFast Configuration
const PAYFAST_CONFIG = {
    merchantId: 'YOUR_MERCHANT_ID',
    passphrase: 'YOUR_MERCHANT_PASSPHRASE',
    sandbox: true,
    returnUrl: window.location.href + '#takeaway',
    notifyUrl: 'https://yourserver.com/notify',
    cancelUrl: window.location.href + '#takeaway'
};

// Utility: Generate unique ID
function generateId(prefix) {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace('Z', '');
    return `${prefix}-${timestamp}`;
}

// Utility: Generate PayFast signature
function generateSignature(params) {
    const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
    const pass = PAYFAST_CONFIG.passphrase ? '&passphrase=' + PAYFAST_CONFIG.passphrase : '';
    const signature = btoa(sortedParams + pass);
    return signature;
}

// Show Confirmation Modal
function showConfirmation(title, message, paymentData = null) {
    confirmationTitle.textContent = title;
    let fullMessage = message + '<br><br><em>Press close to redirect you to payment page</em>';
    confirmationText.innerHTML = fullMessage;
    confirmationMessage.classList.remove('hidden');
    setTimeout(() => {
        confirmationMessage.style.opacity = '1';
        confirmationMessage.querySelector('.scale-95').style.transform = 'scale(1)';
    }, 10);
    window.pendingPayment = paymentData;
}

// Show General Message
function showMessage(text) {
    generalMessageText.textContent = text;
    generalMessage.classList.remove('hidden');
    setTimeout(() => {
        generalMessage.style.opacity = '1';
        generalMessage.querySelector('.scale-95').style.transform = 'scale(1)';
    }, 10);
}

// Hide Modal and Redirect to Payment
function hideMessage() {
    const boxes = document.querySelectorAll('.message-box');
    boxes.forEach(box => {
        box.style.opacity = '0';
        box.querySelector('.scale-95').style.transform = 'scale(0.95)';
    });
    setTimeout(() => {
        boxes.forEach(box => box.classList.add('hidden'));
        if (window.pendingPayment) {
            redirectToPayFast(window.pendingPayment);
            delete window.pendingPayment;
        }
    }, 300);
}

// Redirect to PayFast
function redirectToPayFast(paymentData) {
    const pf = new PayFast(PAYFAST_CONFIG);
    pf.startPayment(paymentData, (result) => {
        if (result.success) {
            console.log('Payment initiated:', result);
        } else {
            showMessage('Payment initiation failed: ' + result.error);
        }
    });
}

// Dine-In Form Submission
dineInForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('dine_name').value;
    const guests = document.getElementById('dine_guests').value;
    const date = document.getElementById('dine_date').value;

    if (name && guests && date) {
        const reservationNumber = generateId('RES');
        const depositAmount = (parseInt(guests) || 1) * 50;
        const message = `
            Your reservation <strong>${reservationNumber}</strong> for <strong>${guests} guests</strong> on <strong>${new Date(date).toLocaleString()}</strong> has been received. 
            Dining time: 1 hour (extend to 2 hours with additional booking). 
            Deposit required: <strong>R${depositAmount.toFixed(2)}</strong>. 
            We look forward to sharing Africa's finest roots with you! 
            Confirmation sent to your cell phone.
        `;

        const paymentData = {
            merchant_id: PAYFAST_CONFIG.merchantId,
            merchant_key: 'YOUR_MERCHANT_KEY',
            return_url: PAYFAST_CONFIG.returnUrl,
            cancel_url: PAYFAST_CONFIG.cancelUrl,
            notify_url: PAYFAST_CONFIG.notifyUrl,
            name_first: name.split(' ')[0],
            name_last: name.split(' ').slice(1).join(' '),
            email_address: '', // No user login, so email is empty
            cellphone_number: '',
            amount: depositAmount,
            item_name: `Reservation Deposit ${reservationNumber}`,
            item_description: `${guests} guests on ${new Date(date).toLocaleDateString()}`,
            order_id: reservationNumber,
            signature: ''
        };
        paymentData.signature = generateSignature(paymentData);

        showConfirmation('Dine-In Confirmed! (Deposit Pending)', message, paymentData);
        dineInForm.reset();
    } else {
        showMessage('Please fill in all required fields.');
    }
});

// Take Away Form Submission
takeawayForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('order_name').value;
    const phone = document.getElementById('order_phone').value;

    const items = [];
    const qtySelectors = [
        { id: 'qty_bobotie', name: 'Bobotie', price: 95.00 },
        { id: 'qty_braai', name: 'Braai Platter', price: 280.00 },
        { id: 'qty_kota', name: 'Kota/Bunny Bites', price: 75.00 },
        { id: 'qty_potjiekos', name: 'Traditional Potjiekos', price: 110.00 },
        { id: 'qty_malva', name: 'Malva Pudding', price: 55.00 },
        { id: 'qty_mala', name: 'Mala and Mogudu (Tripe)', price: 120.00 }
    ];

    let totalAmount = 0;
    qtySelectors.forEach(item => {
        const qty = parseInt(document.getElementById(item.id).value) || 0;
        if (qty > 0) {
            items.push(`${qty} x ${item.name}`);
            totalAmount += qty * item.price;
        }
    });

    if (name && phone && items.length > 0) {
        const orderNumber = generateId('ORD');
        const message = `
            Thank you, <strong>${name}</strong>! Your order <strong>${orderNumber}</strong> for:
            <ul class="list-disc list-inside mt-4 mb-4 font-semibold text-left mx-auto max-w-fit">
                ${items.map(i => '<li>' + i + '</li>').join('')}
            </ul>
            is being prepared. Total amount: <strong>R${totalAmount.toFixed(2)}</strong>. We will call <strong>${phone}</strong> when ready (~30 mins).
        `;

        const paymentData = {
            merchant_id: PAYFAST_CONFIG.merchantId,
            merchant_key: 'YOUR_MERCHANT_KEY',
            return_url: PAYFAST_CONFIG.returnUrl,
            cancel_url: PAYFAST_CONFIG.cancelUrl,
            notify_url: PAYFAST_CONFIG.notifyUrl,
            name_first: name.split(' ')[0],
            name_last: name.split(' ').slice(1).join(' '),
            email_address: '', // No user login, so email is empty
            cellphone_number: phone,
            amount: totalAmount,
            item_name: `Order ${orderNumber}`,
            item_description: items.join(', '),
            order_id: orderNumber,
            signature: ''
        };
        paymentData.signature = generateSignature(paymentData);

        showConfirmation('Order Placed! (Payment Pending)', message, paymentData);
        takeawayForm.reset();
    } else {
        showMessage('Please enter your details and select at least one item.');
    }
});

// Handle PayFast Return
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pfpayment_id')) {
        showMessage('Payment successful! Your order/reservation is confirmed. Check your phone for details.');
    } else if (urlParams.get('cancel')) {
        showMessage('Payment cancelled. You can try again.');
    }
});

/* ============================================================
   REWARDS SECTION JAVASCRIPT
   ============================================================ */

// State variables
let userName = '';
let userPoints = 0;
let isJoined = false;

// DOM element references
const joinSection = document.getElementById('join-section');
const joinBtn = document.getElementById('joinLoyaltyProgramBtn');
const redeemBtn = document.getElementById('redeemPointsBtn');
const welcomeMsg = document.getElementById('welcome-message');
const currentPointsSpan = document.getElementById('currentPoints');
const notificationArea = document.getElementById('notification-area');

// Utility function to show temporary notifications
function showNotification(message, type = 'success') {
    notificationArea.textContent = message;
    notificationArea.className = `mb-4 p-3 rounded-lg text-sm transition-all duration-300 block`;

    if (type === 'success') {
        notificationArea.classList.add('bg-green-100', 'text-green-800');
    } else if (type === 'error') {
        notificationArea.classList.add('bg-red-100', 'text-red-800');
    } else {
        notificationArea.classList.add('bg-blue-100', 'text-blue-800');
    }
    
    // Hide after 4 seconds
    setTimeout(() => {
        notificationArea.classList.remove('block');
        notificationArea.classList.add('hidden');
    }, 4000);
}

// Function to update the UI based on the current state
function updateUI() {
    currentPointsSpan.textContent = userPoints;
    
    // The form (join-section) hides when the user has joined
    if (isJoined) {
        joinSection.classList.add('hidden');
        welcomeMsg.textContent = `Welcome, ${userName}!`;
    } else {
        joinSection.classList.remove('hidden');
        // When not joined, display the generic welcome message from the image
        welcomeMsg.textContent = `Welcome, !`; 
    }

    // Disable Redeem button if points are insufficient
    if (userPoints < 100) {
        redeemBtn.disabled = true;
        redeemBtn.title = "You need 100 points to redeem.";
    } else {
        redeemBtn.disabled = false;
        redeemBtn.title = "Redeem 100 points for R50 off!";
    }
}

/**
 * Handles the click event for the "Join Loyalty Program" button.
 */
function handleJoinProgram() {
    const nameInput = document.getElementById('fullName').value.trim();
    const emailInput = document.getElementById('emailAddress').value.trim();
    const phoneInput = document.getElementById('phoneNumber').value.trim();

    if (!nameInput || !emailInput || !phoneInput) {
        showNotification("Please fill in all fields to join the program.", 'error');
        return;
    }

    // Set state variables
    userName = nameInput.split(' ')[0] || nameInput; // Use first name if possible
    userPoints = 100; // Giving a 100-point joining bonus
    isJoined = true;

    showNotification(`Success! Welcome to the @MALLS Loyalty Program, ${userName}. You've received a 100-point bonus!`);
    
    // Update the display
    updateUI();
}

/**
 * Handles the click event for the "Redeem 100 points" button.
 */
function handleRedeemPoints() {
    if (!isJoined) {
        showNotification("You must join the program first to redeem points.", 'error');
        return;
    }

    if (userPoints >= 100) {
        userPoints -= 100;
        showNotification("R50 discount successfully applied! Check your email for the coupon code.", 'success');
    } else {
        showNotification(`Not enough points. You only have ${userPoints} points.`, 'error');
    }
    
    // Update the display
    updateUI();
}

// Attach event listeners for Rewards Section
if (joinBtn) joinBtn.addEventListener('click', handleJoinProgram);
if (redeemBtn) redeemBtn.addEventListener('click', handleRedeemPoints);

// Initial UI render for Rewards Section
if (typeof updateUI === 'function') updateUI();

/* ============================================================
   END REWARDS SECTION JAVASCRIPT
   ============================================================ */

/* ============================================================
   BEGIN ADD-ON: Client-side login modal & UI guard (appended)
   - Does NOT modify any HTML file.
   - All IDs/classes are unique and isolated.
   - Change LOGIN_CREDENTIALS at top to update username/password.
   ============================================================ */

/* ======= Config: change credentials here if you wish ======= */
const LOGIN_CREDENTIALS = { username: 'admin', password: 'Malls2025!' };
const LOGIN_STORAGE_KEY = 'malls_demo_logged_in_v1';
/* =========================================================== */

/* ---------- Small non-blocking toast helper (unique) -------- */
function _malls_showToast(msg, duration = 2200) {
    const t = document.createElement('div');
    t.className = 'malls-toast';
    t.style.position = 'fixed';
    t.style.right = '18px';
    t.style.bottom = '22px';
    t.style.padding = '10px 14px';
    t.style.background = '#FFD700';
    t.style.color = '#7B3F00';
    t.style.fontWeight = '700';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    t.style.zIndex = '200000';
    t.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.transition = 'opacity 300ms';
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
    }, duration);
}

/* ---------------- Storage helpers ---------------- */
function _malls_isLoggedIn() {
    try {
        return localStorage.getItem(LOGIN_STORAGE_KEY) === 'true';
    } catch (e) {
        return false;
    }
}
function _malls_setLoggedIn(val, remember = true) {
    try {
        if (remember) localStorage.setItem(LOGIN_STORAGE_KEY, val ? 'true' : 'false');
        else localStorage.removeItem(LOGIN_STORAGE_KEY);
    } catch (e) {}
}


/* ---------------- NAV BUTTON ---------------- */
function _malls_renderNav() {
    const nav = document.querySelector('header nav') || document.querySelector('nav') || document.body;
    if (!nav) return;

    const existing = document.getElementById('malls_nav_btn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'malls_nav_btn';

    if (_malls_isLoggedIn()) {
        btn.textContent = 'Logout';
        btn.classList.remove('secondary');
        btn.addEventListener('click', () => {
            _malls_setLoggedIn(null);
            _malls_renderNav();
            _malls_showToast('Signed out');
        });
    } else {
        btn.textContent = 'Login';
        btn.classList.add('secondary');
        btn.addEventListener('click', _malls_showModal);
    }

    try { (nav.querySelector('.flex') || nav).appendChild(btn); }
    catch(e) { nav.appendChild(btn); }
}

/* ---------------- GUARD PROTECTED ACTIONS ---------------- */
function _malls_guardActions() {
    const nodes = Array.from(document.querySelectorAll('button, a'));
    const protectedPhrases = ['add to cart','order now','order take away now','order takeaway','place order','checkout'];
    
    nodes.forEach(node => {
        const txt = (node.textContent || '').toLowerCase();
        if (protectedPhrases.some(p => txt.includes(p)) && !node.dataset.mallsGuarded) {
            node.dataset.mallsGuarded = '1';
            node.addEventListener('click', (e) => {
                if (!_malls_isLoggedIn()) {
                    e.preventDefault();
                    e.stopPropagation();
                    _malls_showModal();
                    _malls_showToast('Please sign in to continue');
                }
            }, { capture: true });
        }
    });

    // Wrap any global proceedToCheckout function
    if (typeof window.proceedToCheckout === 'function' && !window._malls_wrappedProceed) {
        const orig = window.proceedToCheckout;
        window._malls_wrappedProceed = true;
        window.proceedToCheckout = function(...args) {
            if (!_malls_isLoggedIn()) {
                _malls_showModal();
                _malls_showToast('Please sign in to checkout');
                return;
            }
            return orig.apply(this, args);
        };
    }
}

/* ---------------- INITIALIZATION ---------------- */
function _malls_init() {
    _malls_renderNav();
    _malls_buildModal();
    _malls_guardActions();

    // Optionally show modal on first visit if not logged in
    if (!_malls_isLoggedIn()) {
        // _malls_showModal(); // uncomment if you want auto modal
    }

    // Observe DOM changes to guard new buttons
    const obs = new MutationObserver(() => _malls_guardActions());
    obs.observe(document.body, { childList: true, subtree: true });
}

// Run initialization after DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _malls_init);
} else {
    _malls_init();
}

/* ============================================================
   END ADD-ON
   ============================================================ */


   /* ==========================================
       Storage layout (localStorage):
         - "malls_users" => JSON object mapping email -> { name, saltHex, hashHex, createdAt }
         - "malls_session" => email of logged-in user
       Note: This is a frontend-only demo. For production use, use a server and never store passwords client-side.
    ========================================== */

    // DOM refs
    const loginButton = document.getElementById('loginButton');
    const authModal = document.getElementById('authModal');
    const closeModal = document.getElementById('closeModal');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const goRegister = document.getElementById('goRegister');
    const goLogin = document.getElementById('goLogin');
    const loginMsg = document.getElementById('loginMsg');
    const regMsg = document.getElementById('regMsg');
    const pwInput = document.getElementById('regPassword');
    const pwStrengthVal = document.getElementById('pwStrengthVal');

    const notLoggedIn = document.getElementById('notLoggedIn');
    const loggedIn = document.getElementById('loggedIn');
    const userNameEl = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const openAccount = document.getElementById('openAccount');

    // utils: tiny helpers
    function getUsers() {
      return JSON.parse(localStorage.getItem('malls_users') || '{}');
    }
    function saveUsers(users) {
      localStorage.setItem('malls_users', JSON.stringify(users));
    }
    function setSession(email) {
      localStorage.setItem('malls_session', email);
      renderAccountPanel();
    }
    function clearSession() {
      localStorage.removeItem('malls_session');
      renderAccountPanel();
    }
    function getSession() {
      return localStorage.getItem('malls_session') || null;
    }

    // Crypto helpers: generate salt, hash using SHA-256 of (password + salt)
    async function generateSaltHex() {
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      return bufferToHex(salt);
    }

    async function hashPasswordHex(password, saltHex) {
      // concat utf8 password + salt bytes
      const enc = new TextEncoder();
      const pwBytes = enc.encode(password);
      const saltBytes = hexToBuffer(saltHex);
      const combo = new Uint8Array(pwBytes.length + saltBytes.length);
      combo.set(pwBytes, 0);
      combo.set(new Uint8Array(saltBytes), pwBytes.length);
      const hashBuffer = await crypto.subtle.digest('SHA-256', combo);
      return bufferToHex(new Uint8Array(hashBuffer));
    }

    function bufferToHex(buffer) {
      const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
      return hex;
    }
    function hexToBuffer(hex) {
      if (!hex) return new Uint8Array();
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return bytes.buffer;
    }

    // UI helpers for modal/tabs
    function openModal(initialTab = 'login') {
      authModal.classList.remove('hidden');
      authModal.classList.add('flex');
      if (initialTab === 'register') showRegister();
      else showLogin();
      document.querySelector('#loginEmail')?.focus();
    }
    function closeAuthModal() {
      authModal.classList.remove('flex');
      authModal.classList.add('hidden');
      // clear messages
      loginMsg.classList.add('hidden');
      regMsg.classList.add('hidden');
      loginForm.reset();
      registerForm.reset();
      pwStrengthVal.textContent = '—';
    }

    function showLogin() {
      tabLogin.classList.add('bg-white');
      tabLogin.classList.remove('text-gray-600');
      tabRegister.classList.remove('bg-white');
      tabRegister.classList.add('text-gray-600');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    }
    function showRegister() {
      tabRegister.classList.add('bg-white');
      tabRegister.classList.remove('text-gray-600');
      tabLogin.classList.remove('bg-white');
      tabLogin.classList.add('text-gray-600');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      document.getElementById('regName')?.focus();
    }

    // password strength (simple)
    function passwordStrength(pw) {
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      if (pw.length >= 12) score++;
      const labels = ['Very weak','Weak','Okay','Good','Strong','Excellent'];
      return {score, label: labels[score]};
    }

    // registration flow
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      regMsg.classList.add('hidden');

      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const pw = document.getElementById('regPassword').value;
      const pw2 = document.getElementById('regPassword2').value;

      if (!name || !email || !pw) {
        showRegError('Please complete all required fields.');
        return;
      }
      if (pw !== pw2) {
        showRegError('Passwords do not match.');
        return;
      }
      if (pw.length < 6) {
        showRegError('Password must be at least 6 characters.');
        return;
      }

      const users = getUsers();
      if (users[email]) {
        showRegError('An account with that email already exists. Try logging in.');
        return;
      }

      // create account: generate salt and store hash
      const saltHex = await generateSaltHex();
      const hashHex = await hashPasswordHex(pw, saltHex);
      users[email] = {
        name,
        saltHex,
        hashHex,
        createdAt: new Date().toISOString()
      };
      saveUsers(users);

      // auto-login
      setSession(email);

      // UI
      closeAuthModal();
      alert('Account created — you are now logged in.');
    });

    function showRegError(msg) {
      regMsg.textContent = msg;
      regMsg.classList.remove('hidden');
    }

    // login flow
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginMsg.classList.add('hidden');

      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pw = document.getElementById('loginPassword').value;

      const users = getUsers();
      const user = users[email];
      if (!user) {
        showLoginError('No account found with that email.');
        return;
      }

      const hashHex = await hashPasswordHex(pw, user.saltHex);
      if (hashHex !== user.hashHex) {
        showLoginError('Incorrect password.');
        return;
      }

      setSession(email);
      closeAuthModal();
      alert('Signed in successfully.');
    });

    function showLoginError(msg) {
      loginMsg.textContent = msg;
      loginMsg.classList.remove('hidden');
    }

    // Password strength live
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      const s = passwordStrength(val);
      pwStrengthVal.textContent = s.label + (val.length ? ` (${s.score}/5)` : '');
    });

    // modal openers / closers and tab switches
    loginButton.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('login');
    });
    closeModal.addEventListener('click', closeAuthModal);
    tabLogin.addEventListener('click', showLogin);
    tabRegister.addEventListener('click', showRegister);
    goRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
    goLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

    // handle backdrop click to close
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });

    // session UI & logout
    function renderAccountPanel() {
      const sessionEmail = getSession();
      if (!sessionEmail) {
        notLoggedIn.classList.remove('hidden');
        loggedIn.classList.add('hidden');
        // ensure header login button is visible
        document.getElementById('loginButton').classList.remove('hidden');
        document.getElementById('loginButton').textContent = 'Login / Register';
      } else {
        const users = getUsers();
        const user = users[sessionEmail];
        notLoggedIn.classList.add('hidden');
        loggedIn.classList.remove('hidden');
        userNameEl.textContent = user?.name || sessionEmail;
        document.getElementById('loginButton').textContent = `Hi, ${user?.name.split(' ')[0] || 'User'}`;
      }
    }

    logoutBtn.addEventListener('click', () => {
      clearSession();
      alert('You have been logged out.');
    });

    openAccount.addEventListener('click', () => {
      const sessionEmail = getSession();
      if (!sessionEmail) {
        openModal('login');
        return;
      }
      const users = getUsers();
      const user = users[sessionEmail];
      // simple profile view — we reuse modal and show login tab disabled then show info
      openModal();
      // show a message inside modal with profile details
      // quickly swap content to profile read-only view
      const profileHtml = `
        <div class="space-y-3">
          <p class="text-sm text-gray-600">Name: <span class="font-semibold">${escapeHtml(user.name)}</span></p>
          <p class="text-sm text-gray-600">Email: <span class="font-semibold">${escapeHtml(sessionEmail)}</span></p>
          <p class="text-sm text-gray-600">Account created: <span class="font-semibold">${new Date(user.createdAt).toLocaleString()}</span></p>
          <div class="pt-3">
            <button id="closeProfile" class="px-4 py-2 rounded-pill color-primary text-white font-bold">Close</button>
            <button id="logoutFromProfile" class="ml-3 px-4 py-2 rounded-pill bg-gray-200">Logout</button>
          </div>
        </div>
      `;
      document.getElementById('modalContent').innerHTML = profileHtml;
      document.getElementById('closeProfile').addEventListener('click', closeAuthModal);
      document.getElementById('logoutFromProfile').addEventListener('click', () => {
        clearSession();
        closeAuthModal();
        alert('You have been logged out.');
      });
    });

    // small helper to sanitize text displayed in innerHTML
    function escapeHtml(str) {
      return String(str).replace(/[&<>"'\/]/g, function (s) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;'})[s];
      });
    }

    // cart mock (just to demonstrate cartCount usage)
    function updateCartCount() {
      const cnt = parseInt(localStorage.getItem('malls_cart_count') || '0', 10);
      document.getElementById('cartCount').textContent = cnt;
    }
    document.getElementById('cartButton').addEventListener('click', () => {
      // demo: increment cart count
      const current = parseInt(localStorage.getItem('malls_cart_count') || '0', 10);
      localStorage.setItem('malls_cart_count', String(current + 1));
      updateCartCount();
      alert('Added a demo item to cart. (This demo increments cart count in localStorage.)');
    });

    // initialize UI on load
    (function init() {
      renderAccountPanel();
      updateCartCount();
    })();