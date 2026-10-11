document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const profileBtn = document.getElementById('profileBtn');
  const profilePanel = document.getElementById('profilePanel');
  const closeProfile = document.getElementById('closeProfile');
  const themeToggle = document.getElementById('themeToggle');
  const logoutBtn = document.getElementById('logoutBtn');
  const editProfileBtn = document.getElementById('editProfile');
  const content = document.querySelector('.content');
  const searchInput = document.getElementById('searchItems');
  const searchBtn = document.querySelector('.search-btn');
  const designationInput = document.getElementById('designationInput');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordFields = document.getElementById('passwordFields');
  const exportBtn = document.getElementById('exportBtn');
  const itemsTableBody = document.getElementById('itemsTableBody');

  // Initialize sidebar as closed
  sidebar.classList.remove('active');
  content.classList.remove('with-sidebar');

  // Theme toggle functionality
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

  // Toggle sidebar
  hamburgerBtn.addEventListener('click', function() {
    sidebar.classList.toggle('active');
    content.classList.toggle('with-sidebar');
    
    // Save state to localStorage
    localStorage.setItem('sidebarState', sidebar.classList.contains('active') ? 'open' : 'closed');
  });

  // Load saved sidebar state
  const savedSidebarState = localStorage.getItem('sidebarState');
  if (savedSidebarState === 'open') {
    sidebar.classList.add('active');
    content.classList.add('with-sidebar');
  }

  // Toggle profile panel
  profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profilePanel.classList.add('open');
  });

  // Close profile panel
  closeProfile.addEventListener('click', function() {
    profilePanel.classList.remove('open');
    resetEditMode();
  });

  // Close profile panel when clicking outside
  document.addEventListener('click', function(e) {
    if (!profilePanel.contains(e.target) && e.target !== profileBtn) {
      profilePanel.classList.remove('open');
      resetEditMode();
    }
  });

  // Logout functionality
  logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
      fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin'
      })
      .then(response => {
        if (response.ok) {
          window.location.href = '/login';
        } else {
          alert('Logout failed. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Logout failed. Please try again.');
      });
    }
  });

  // Edit profile functionality
  editProfileBtn.addEventListener('click', function() {
    const isDisabled = designationInput.disabled;
    
    if (isDisabled) {
      // Entering edit mode
      enterEditMode();
    } else {
      // Saving changes
      saveChanges();
    }
  });

  function enterEditMode() {
    designationInput.disabled = false;
    passwordFields.style.display = 'block';
    editProfileBtn.textContent = 'Save';
    editProfileBtn.style.backgroundColor = '#28a745';
  }

  function saveChanges() {
    const designation = designationInput.value;
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate password fields if they have values
    if (currentPassword || newPassword || confirmPassword) {
      if (!validatePasswordChange()) {
        return; // Stay in edit mode if validation fails
      }
    }

    // Prepare data for update
    const updateData = { designation };
    if (newPassword) {
      updateData.currentPassword = currentPassword;
      updateData.newPassword = newPassword;
    }

    // Send update request
    fetch('/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Update failed');
    })
    .then(data => {
      if (data.success) {
        alert('Profile updated successfully!');
        resetEditMode();
      } else {
        alert(data.message || 'Update failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to update profile. Please try again.');
    });
  }

  function resetEditMode() {
    designationInput.disabled = true;
    passwordFields.style.display = 'none';
    editProfileBtn.textContent = 'Edit';
    editProfileBtn.style.backgroundColor = '#0055aa';
    resetPasswordFields();
  }

  function resetPasswordFields() {
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
  }

  function validatePasswordChange() {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        alert('Please enter your current password');
        return false;
      }
      
      if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return false;
      }
      
      if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return false;
      }
    }
    
    return true;
  }

  // Search functionality
  searchBtn.addEventListener('click', filterTable);
  searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      filterTable();
    }
  });

  function filterTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#itemsTableBody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
      
      row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
  }

  // Export to CSV functionality
  exportBtn.addEventListener('click', exportToCSV);

  function exportToCSV() {
    const table = document.querySelector('.items-table');
    const rows = table.querySelectorAll('tr');
    const csvContent = [];
    
    // Process header row
    const headerCells = rows[0].querySelectorAll('th');
    const headerRow = Array.from(headerCells).map(cell => 
      `"${cell.textContent.trim().replace(/"/g, '""')}"`
    ).join(',');
    csvContent.push(headerRow);
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      // Skip rows that are hidden by search filter
      if (rows[i].style.display === 'none') continue;
      
      const cells = rows[i].querySelectorAll('td');
      const row = Array.from(cells).map(cell => 
        `"${cell.textContent.trim().replace(/"/g, '""')}"`
      ).join(',');
      csvContent.push(row);
    }
    
    // Create CSV file
    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `issued_items_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert('CSV file downloaded successfully!');
  }

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
});