document.addEventListener('DOMContentLoaded', function() {
  // ======================
  // Theme Management
  // ======================
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-sun', theme === 'dark');
    icon.classList.toggle('fa-moon', theme !== 'dark');
  }

  applyTheme(currentTheme);
  
  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // ======================
  // Login Form Handling
  // ======================
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    
    const formData = {
      userId: document.getElementById('userId').value.trim(),
      password: document.getElementById('password').value,
      rememberMe: document.getElementById('rememberMe').checked
    };

    if (!validateForm(formData)) return;

    try {
      const { redirectUrl } = await authenticateUser(formData);
      handleRememberMe(formData);
      navigateTo(redirectUrl);
    } catch (error) {
      handleLoginError(error);
    }
  });

  // ======================
  // Core Functions
  // ======================
  function validateForm({ userId, password }) {
    let isValid = true;
    
    if (!userId || !/^\d{6}$/.test(userId)) {
      showError('userIdError', 'User ID must be 6 digits');
      isValid = false;
    }

    if (!password || password.length < 8) {
      showError('passwordError', 'Password must be at least 8 characters');
      isValid = false;
    }

    return isValid;
  }

  async function authenticateUser({ userId, password, rememberMe }) {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password, rememberMe }),
      credentials: 'include'
    });

    if (response.redirected) {
      return { redirectUrl: response.url };
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    return {
      redirectUrl: data.redirect || '/dashboard'
    };
  }

  function handleRememberMe({ userId, rememberMe }) {
    if (rememberMe) {
      localStorage.setItem('rememberedUserId', userId);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedUserId');
      localStorage.removeItem('rememberMe');
    }
  }

  function navigateTo(url) {
    // Clear sensitive data from memory
    document.getElementById('password').value = '';
    window.location.href = url;
  }

  // ======================
  // UI Helpers
  // ======================
  function clearErrors() {
    document.querySelectorAll('.error').forEach(el => {
      el.textContent = '';
    });
    const existingAlert = document.querySelector('.alert.alert-error');
    if (existingAlert) existingAlert.remove();
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(`${elementId}`);
    if (errorElement) {
      errorElement.textContent = message;
    } else {
      // Fallback for general errors
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.textContent = message;
      document.querySelector('.header').insertAdjacentElement('afterend', errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }

  function handleLoginError(error) {
    console.error('Login Error:', error);
    showError('', error.message || 'An error occurred during login');
  }

  // ======================
  // Initialization
  // ======================
  function initializeRememberMe() {
    if (localStorage.getItem('rememberMe') === 'true') {
      const rememberedUserId = localStorage.getItem('rememberedUserId');
      if (rememberedUserId) {
        document.getElementById('userId').value = rememberedUserId;
        document.getElementById('rememberMe').checked = true;
      }
    }
  }

  initializeRememberMe();
});