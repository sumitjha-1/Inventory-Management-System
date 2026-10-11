document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  // Cadre change handler - updates designation options
  document.getElementById('cadre').addEventListener('change', function() {
    updateDesignationOptions();
  });

  // Real-time validation checks
  document.getElementById('regUserId').addEventListener('blur', checkUserId);
  document.getElementById('regEmail').addEventListener('blur', checkEmail);
  document.getElementById('phone').addEventListener('blur', checkPhone);
  document.getElementById('regPassword').addEventListener('input', validatePasswordStrength);
  document.getElementById('regConfirmPassword').addEventListener('blur', validatePasswordMatch);

  // Form submission handler
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous errors and alerts
    clearErrors();
    clearAlerts();
    
    const isValid = validateForm();

    if (isValid) {
      try {
        // Show loading state
        const submitBtn = document.querySelector('.register-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Form is valid, collect data
        const formData = getFormData();
        
        // Submit form
        const response = await fetch('/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
          if (data.success) {
            showSuccess(data.message);
            resetForm();
          } else {
            // Handle server-side validation errors
            handleServerErrors(data.errors || {});
          }
        } else {
          // Handle HTTP errors
          if (data.error) {
            throw new Error(data.error);
          } else {
            throw new Error(data.message || 'Registration failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        showError(error.message);
      } finally {
        // Reset button state
        const submitBtn = document.querySelector('.register-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
      }
    }
  });

  // Initialize designation options if cadre is already selected
  if (document.getElementById('cadre').value) {
    updateDesignationOptions();
  }

  // Check if User ID exists
  async function checkUserId() {
    const userId = document.getElementById('regUserId').value.trim();
    const errorElement = document.getElementById('userIdError');
    
    if (!userId) {
      errorElement.textContent = 'User ID is required';
      return;
    }

    if (!/^\d{6}$/.test(userId)) {
      errorElement.textContent = 'User ID must be exactly 6 digits';
      return;
    }

    try {
      const response = await fetch(`/check-userid?userId=${userId}`);
      const data = await response.json();
      
      if (data.exists) {
        errorElement.textContent = 'This User ID is already registered';
        showError('This User ID is already in use. Please use a different ID.');
      }
    } catch (error) {
      console.error('Error checking User ID:', error);
    }
  }

  // Check if email exists
  async function checkEmail() {
    const email = document.getElementById('regEmail').value.trim();
    const errorElement = document.getElementById('emailError');
    
    if (!email) {
      errorElement.textContent = 'Email is required';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorElement.textContent = 'Please enter a valid email address';
      return;
    }

    try {
      const response = await fetch(`/check-email?email=${email}`);
      const data = await response.json();
      
      if (data.exists) {
        errorElement.textContent = 'This email is already registered';
        showError('This email address is already in use. Please use a different email.');
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  }

  // Check if phone exists
  async function checkPhone() {
    const phone = document.getElementById('phone').value.trim();
    const errorElement = document.getElementById('phoneError');
    
    if (!phone) {
      errorElement.textContent = 'Phone number is required';
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      errorElement.textContent = 'Phone number must be 10 digits';
      return;
    }

    try {
      const response = await fetch(`/check-phone?phone=${phone}`);
      const data = await response.json();
      
      if (data.exists) {
        errorElement.textContent = 'This phone number is already registered';
        showError('This phone number is already in use. Please use a different number.');
      }
    } catch (error) {
      console.error('Error checking phone:', error);
    }
  }

  // Validate password strength
  function validatePasswordStrength() {
    const password = document.getElementById('regPassword').value;
    const errorElement = document.getElementById('passwordError');
    
    if (!password) {
      errorElement.textContent = 'Password is required';
      return;
    }

    if (password.length < 8) {
      errorElement.textContent = 'Password must be at least 8 characters';
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      errorElement.textContent = 
        'Password must contain uppercase, lowercase, number, and special character';
      return;
    }

    errorElement.textContent = '';
  }

  // Validate password match
  function validatePasswordMatch() {
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorElement = document.getElementById('confirmPasswordError');
    
    if (!confirmPassword) {
      errorElement.textContent = 'Please confirm password';
      return;
    }

    if (password !== confirmPassword) {
      errorElement.textContent = 'Passwords do not match';
      showError('The passwords you entered do not match. Please try again.');
      return;
    }

    errorElement.textContent = '';
  }

  function clearErrors() {
    document.querySelectorAll('.error').forEach(el => {
      el.textContent = '';
    });
  }

  function clearAlerts() {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', errorDiv);
    
    // Scroll to the error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    setTimeout(() => {
      errorDiv.remove();
    }, 10000);
  }

  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', successDiv);
    
    // Scroll to the success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    setTimeout(() => {
      successDiv.remove();
    }, 10000);
  }

  function handleServerErrors(errors) {
    if (!errors) return;

    // Handle specific field errors
    for (const [field, message] of Object.entries(errors)) {
      const errorElement = document.getElementById(`${field}Error`);
      if (errorElement) {
        errorElement.textContent = message;
      }
      
      // Show general error for important fields
      if (['userId', 'email', 'phone', 'password'].includes(field)) {
        showError(message);
      }
    }
  }

  // Update designation options based on selected cadre
  function updateDesignationOptions() {
    const cadre = document.getElementById('cadre').value;
    const container = document.getElementById('designation-container');
    const select = document.getElementById('designation');

    // Clear previous options
    select.innerHTML = '<option value="">Select Designation</option>';
    container.style.display = 'none';

    if (!cadre) return;

    // Designation options for each cadre
    const designationOptions = {
      drds: [
        { value: 'sci-h', text: 'SCI-H' },
        { value: 'sci-g', text: 'SCI-G' },
        { value: 'sci-f', text: 'SCI-F' },
        { value: 'sci-e', text: 'SCI-E' },
        { value: 'sci-d', text: 'SCI-D' },
        { value: 'sci-c', text: 'SCI-C' },
        { value: 'sci-b', text: 'SCI-B' }
      ],
      drtc: [
        { value: 'to-d', text: 'TO-D' },
        { value: 'to-c', text: 'TO-C' },
        { value: 'to-b', text: 'TO-B' },
        { value: 'to-a', text: 'TO-A' },
        { value: 'sta-b', text: 'STA-B' }
      ],
      admin: [
        { value: 'cao', text: 'CAO' },
        { value: 'ao-ii', text: 'AO-II' },
        { value: 'ao', text: 'AO' },
        { value: 'sso', text: 'SSO' },
        { value: 'so-ii', text: 'SO-II' },
        { value: 'so', text: 'SO' }
      ]
    };

    // Add options to select element
    designationOptions[cadre].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.text;
      select.appendChild(opt);
    });

    // Show the container
    container.style.display = 'block';
  }

  // Validate all form fields
  function validateForm() {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = [
      { 
        id: 'regName', 
        message: 'Full name is required',
        validate: (value) => value.trim().length >= 3,
        errorMessage: 'Name must be at least 3 characters'
      },
      { 
        id: 'regUserId', 
        message: 'User ID is required', 
        pattern: /^\d{6}$/, 
        errorMessage: 'User ID must be exactly 6 digits' 
      },
      { 
        id: 'phone', 
        message: 'Phone number is required', 
        pattern: /^\d{10}$/, 
        errorMessage: 'Phone number must be 10 digits' 
      },
      { 
        id: 'regEmail', 
        message: 'Email is required', 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
        errorMessage: 'Please enter a valid email address' 
      },
      { 
        id: 'regPassword', 
        message: 'Password is required', 
        validate: (value) => value.length >= 8,
        errorMessage: 'Password must be at least 8 characters long'
      },
      { 
        id: 'regConfirmPassword', 
        message: 'Please confirm password' 
      },
      { 
        id: 'group', 
        message: 'Please select a group' 
      },
      { 
        id: 'cadre', 
        message: 'Please select a cadre' 
      }
    ];

    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      const value = element.value.trim();
      const errorElement = document.getElementById(`${field.id}Error`);
      
      if (!value) {
        errorElement.textContent = field.message;
        isValid = false;
      } else if (field.pattern && !field.pattern.test(value)) {
        errorElement.textContent = field.errorMessage;
        isValid = false;
      } else if (field.validate && !field.validate(value)) {
        errorElement.textContent = field.errorMessage;
        isValid = false;
      }
    });

    // Validate gender selection
    const genderSelected = document.querySelector('input[name="gender"]:checked');
    if (!genderSelected) {
      document.getElementById('genderError').textContent = 'Please select a gender';
      isValid = false;
    }

    // Validate employment type
    const employmentTypeSelected = document.querySelector('input[name="employmentType"]:checked');
    if (!employmentTypeSelected) {
      document.getElementById('employmentError').textContent = 'Please select employment type';
      isValid = false;
    }

    // Validate date of birth
    const dob = document.getElementById('dob').value;
    if (!dob) {
      document.getElementById('dobError').textContent = 'Date of birth is required';
      isValid = false;
    } else {
      const dobDate = new Date(dob);
      const today = new Date();
      const minAgeDate = new Date();
      minAgeDate.setFullYear(today.getFullYear() - 18);
      
      if (dobDate >= today) {
        document.getElementById('dobError').textContent = 'Date of birth must be in the past';
        isValid = false;
      } else if (dobDate > minAgeDate) {
        document.getElementById('dobError').textContent = 'You must be at least 18 years old';
        isValid = false;
      }
    }

    // Validate password match
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
      showError('The passwords you entered do not match. Please try again.');
      isValid = false;
    }

    // Validate designation if cadre is selected
    const cadre = document.getElementById('cadre').value;
    const designation = document.getElementById('designation').value;
    if (cadre && !designation) {
      document.getElementById('designationError').textContent = 'Please select a designation';
      isValid = false;
    }

    return isValid;
  }

  // Collect all form data
  function getFormData() {
    return {
      name: document.getElementById('regName').value.trim(),
      userId: document.getElementById('regUserId').value.trim(),
      gender: document.querySelector('input[name="gender"]:checked').value,
      dob: document.getElementById('dob').value,
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      employmentType: document.querySelector('input[name="employmentType"]:checked').value,
      group: document.getElementById('group').value,
      cadre: document.getElementById('cadre').value,
      designation: document.getElementById('designation').value,
      password: document.getElementById('regPassword').value,
      confirmPassword: document.getElementById('regConfirmPassword').value
    };
  }

  function resetForm() {
    document.getElementById('registerForm').reset();
    document.getElementById('designation-container').style.display = 'none';
    clearErrors();
  }

  // Update theme icon based on current theme
  function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (theme === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
});