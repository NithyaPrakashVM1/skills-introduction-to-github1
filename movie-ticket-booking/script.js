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

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const users = readUsers();

  if (users[username]) {
    showMessage(authMessage, 'Username already exists. Please login.');
    return;
  }

  users[username] = password;
  writeUsers(users);
  showMessage(authMessage, 'Registration successful! Please login.', true);
  switchToLoginTab();
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const users = readUsers();

  if (users[username] !== password) {
    showMessage(authMessage, 'Invalid username or password.');
    return;
  }

  localStorage.setItem(SESSION_KEY, username);
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
  localStorage.removeItem(SESSION_KEY);
  exitBooking();
  switchToLoginTab();
  showMessage(authMessage, 'You are logged out.', true);
});

const activeUser = localStorage.getItem(SESSION_KEY);
if (activeUser) {
  enterBooking(activeUser);
} else {
  switchToLoginTab();
}
