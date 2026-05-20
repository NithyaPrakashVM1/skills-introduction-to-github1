const authSection = document.getElementById('auth-section');
const bookingSection = document.getElementById('booking-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const bookingForm = document.getElementById('booking-form');

const showLoginButton = document.getElementById('show-login');
const showRegisterButton = document.getElementById('show-register');
const authMessage = document.getElementById('auth-message');
const bookingResult = document.getElementById('booking-result');
const welcomeText = document.getElementById('welcome-text');
const logoutButton = document.getElementById('logout');
const movieSelect = document.getElementById('movie');

const USERS_KEY = 'movie_booking_users';
const SESSION_KEY = 'movie_booking_current_user';
const DEFAULT_SALT = 'AAAAAAAAAAAAAAAAAAAAAA==';
const FALLBACK_HASH = '0'.repeat(64);
const PBKDF2_ITERATIONS = 600000;

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function showMessage(element, text, success = false) {
  element.textContent = text;
  element.style.color = success ? '#15803d' : '#b91c1c';
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function fromBase64(base64Value) {
  return Uint8Array.from(atob(base64Value), (char) => char.charCodeAt(0));
}

function createSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return btoa(String.fromCharCode(...salt));
}

async function derivePasswordHash(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256
  );
  return toHex(hashBits);
}

function timingSafeEqual(valueA, valueB) {
  if (valueA.length !== valueB.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < valueA.length; index += 1) {
    mismatch |= valueA.charCodeAt(index) ^ valueB.charCodeAt(index);
  }
  return mismatch === 0;
}

function switchToLoginTab() {
  showLoginButton.classList.add('active');
  showRegisterButton.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  authMessage.textContent = '';
}

function switchToRegisterTab() {
  showRegisterButton.classList.add('active');
  showLoginButton.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  authMessage.textContent = '';
}

function enterBooking(username) {
  authSection.classList.add('hidden');
  bookingSection.classList.remove('hidden');
  welcomeText.textContent = `Welcome, ${username}! Select your movie tickets.`;
}

function exitBooking() {
  bookingSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  bookingResult.textContent = '';
  loginForm.reset();
}

showLoginButton.addEventListener('click', switchToLoginTab);
showRegisterButton.addEventListener('click', switchToRegisterTab);

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const users = readUsers();

  if (users[username]) {
    showMessage(authMessage, 'Username already exists. Please login.');
    return;
  }

  const salt = createSalt();
  users[username] = {
    salt,
    hash: await derivePasswordHash(password, salt),
  };
  writeUsers(users);
  showMessage(authMessage, 'Registration successful! Please login.', true);
  switchToLoginTab();
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const users = readUsers();
  const userRecord = users[username];
  const isLegacyUser = typeof userRecord === 'string';
  const salt = !isLegacyUser && userRecord?.salt ? userRecord.salt : DEFAULT_SALT;
  const passwordHash = await derivePasswordHash(password, salt);
  const storedHash = !isLegacyUser && userRecord?.hash ? userRecord.hash : FALLBACK_HASH;
  let isValidUser = Boolean(userRecord) && timingSafeEqual(storedHash, passwordHash);

  if (isLegacyUser) {
    const legacyHash = await hashPassword(password);
    isValidUser = timingSafeEqual(userRecord, legacyHash);
    if (isValidUser) {
      const migratedSalt = createSalt();
      users[username] = {
        salt: migratedSalt,
        hash: await derivePasswordHash(password, migratedSalt),
      };
      writeUsers(users);
    }
  }

  if (!isValidUser) {
    showMessage(authMessage, 'Invalid username or password.');
    return;
  }

  sessionStorage.setItem(SESSION_KEY, username);
  showMessage(authMessage, 'Login successful!', true);
  enterBooking(username);
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const movieOption = movieSelect.options[movieSelect.selectedIndex];
  const movieName = movieOption.value;
  const price = Number(movieOption.dataset.price);
  const showTime = document.getElementById('showtime').value;
  const ticketCount = Number(document.getElementById('tickets').value);
  const totalAmount = price * ticketCount;

  showMessage(
    bookingResult,
    `Booked ${ticketCount} ticket(s) for ${movieName} at ${showTime}. Total: ₹${totalAmount}.`,
    true
  );
});

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  exitBooking();
  switchToLoginTab();
  showMessage(authMessage, 'You are logged out.', true);
});

const activeUser = sessionStorage.getItem(SESSION_KEY);
if (activeUser) {
  enterBooking(activeUser);
} else {
  switchToLoginTab();
}
