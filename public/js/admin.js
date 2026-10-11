document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const profileBtn = document.getElementById('profileBtn');
  const profilePanel = document.getElementById('profilePanel');
  const closeProfile = document.getElementById('closeProfile');
  const logoutBtn = document.getElementById('logoutBtn');
  const themeToggle = document.getElementById('themeToggle');
  const content = document.querySelector('.content');
  const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
  const editProfileBtn = document.getElementById('editProfile');
  const designationValue = document.getElementById('designationValue');
  const designationInput = document.getElementById('designationInput');
  const passwordFields = document.getElementById('passwordFields');
  
  // Table elements
  const newUsersTableBody = document.getElementById('newUsersTableBody');
  const userListTableBody = document.getElementById('userListTableBody');
  const itemListTableBody = document.getElementById('itemListTableBody');
  
  // Search elements
  const searchNewUsers = document.getElementById('searchNewUsers');
  const searchUserList = document.getElementById('searchUserList');
  const searchItemList = document.getElementById('searchItemList');
  
  // Export buttons
  const exportNewUsersBtn = document.getElementById('exportNewUsersBtn');
  const exportUserListBtn = document.getElementById('exportUserListBtn');
  const exportItemListBtn = document.getElementById('exportItemListBtn');

  // Modal elements
  const approvalModal = document.getElementById('approvalModal');
  const closeApprovalModal = document.getElementById('closeApprovalModal');
  const cancelApprovalBtn = document.getElementById('cancelApprovalBtn');
  const approveUserBtn = document.getElementById('approveUserBtn');
  const rejectUserBtn = document.getElementById('rejectUserBtn');
  const userApprovalDetails = document.getElementById('userApprovalDetails');
  
  const roleModal = document.getElementById('roleModal');
  const closeRoleModal = document.getElementById('closeRoleModal');
  const cancelRoleBtn = document.getElementById('cancelRoleBtn');
  const roleAssignmentForm = document.getElementById('roleAssignmentForm');
  const roleSelect = document.getElementById('roleSelect');

  // State variables
  let currentUserId = null;
  let currentItemId = null;

  // Initialize the page
  function initializePage() {
    // Set theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    // Open sidebar by default on larger screens
    if (window.innerWidth > 768) {
      sidebar.classList.add('active');
      content.classList.add('with-sidebar');
    }

    // Set User List as active by default
    setActiveSection('userList');
  }

  // Set active section
  function setActiveSection(section) {
    // Remove active class from all menu items and sections
    sidebarMenuItems.forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked menu item and corresponding section
    const activeMenuItem = document.querySelector(`.sidebar-menu li[data-section="${section}"]`);
    if (activeMenuItem) {
      activeMenuItem.classList.add('active');
    }
    document.getElementById(`${section}Section`).classList.add('active');
  }

  // Theme toggle functionality
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
    
    localStorage.setItem('sidebarState', sidebar.classList.contains('active') ? 'open' : 'closed');
  });

  // Load saved sidebar state
  const savedSidebarState = localStorage.getItem('sidebarState');
  if (savedSidebarState === 'open') {
    sidebar.classList.add('active');
    content.classList.add('with-sidebar');
  }

  // Profile panel functionality
  profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profilePanel.classList.add('open');
  });

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
    const isEditing = designationInput.style.display === 'block';
    
    if (!isEditing) {
      // Enter edit mode
      enterEditMode();
    } else {
      // Save changes
      saveProfileChanges();
    }
  });

  function enterEditMode() {
    designationInput.style.display = 'block';
    designationInput.value = designationValue.textContent;
    designationValue.style.display = 'none';
    passwordFields.style.display = 'block';
    editProfileBtn.textContent = 'Save';
    editProfileBtn.style.backgroundColor = '#28a745';
  }

  function saveProfileChanges() {
    const designation = designationInput.value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate password fields if they have values
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        alert('Please enter your current password');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }
    }
    
    const updateData = { designation };
    if (newPassword) {
      updateData.currentPassword = currentPassword;
      updateData.newPassword = newPassword;
    }

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
        designationValue.textContent = designation;
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
    designationInput.style.display = 'none';
    designationValue.style.display = 'inline';
    passwordFields.style.display = 'none';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    editProfileBtn.textContent = 'Edit';
    editProfileBtn.style.backgroundColor = '';
  }

  // Navigation between sections
  sidebarMenuItems.forEach(item => {
    item.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      setActiveSection(section);
    });
  });

  // User approval functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.view-btn')) {
      const userId = e.target.closest('.view-btn').getAttribute('data-id');
      showUserApprovalModal(userId);
    }
    
    if (e.target.closest('.role-btn')) {
      const userId = e.target.closest('.role-btn').getAttribute('data-id');
      showRoleAssignmentModal(userId);
    }
    
    if (e.target.closest('.delete-btn')) {
      const target = e.target.closest('.delete-btn');
      const id = target.getAttribute('data-id');
      const isUser = target.closest('tr').querySelector('.role-btn');
      
      if (isUser) {
        deleteUser(id);
      } else {
        deleteItem(id);
      }
    }
  });

  function showUserApprovalModal(userId) {
    currentUserId = userId;
    
    // Fetch user details
    fetch(`/admin/user-details/${userId}`, {
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(user => {
      userApprovalDetails.innerHTML = `
        <div class="detail-item">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${user.name}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">User ID:</span>
          <span class="detail-value">${user.userId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${user.email}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Group:</span>
          <span class="detail-value">${user.group}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Designation:</span>
          <span class="detail-value">${user.designation}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Registered:</span>
          <span class="detail-value">${new Date(user.createdAt).toLocaleString()}</span>
        </div>
      `;
      
      approvalModal.style.display = 'flex';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to load user details');
    });
  }

  function showRoleAssignmentModal(userId) {
    currentUserId = userId;
    
    // Fetch current role
    fetch(`/admin/user-details/${userId}`, {
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(user => {
      roleSelect.value = user.role;
      roleModal.style.display = 'flex';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to load user details');
    });
  }

  // Close approval modal
  closeApprovalModal.addEventListener('click', function() {
    approvalModal.style.display = 'none';
    currentUserId = null;
  });

  cancelApprovalBtn.addEventListener('click', function() {
    approvalModal.style.display = 'none';
    currentUserId = null;
  });

  // Close role modal
  closeRoleModal.addEventListener('click', function() {
    roleModal.style.display = 'none';
    currentUserId = null;
  });

  cancelRoleBtn.addEventListener('click', function() {
    roleModal.style.display = 'none';
    currentUserId = null;
  });

  // Approve user
  approveUserBtn.addEventListener('click', function() {
    updateUserStatus(currentUserId, 'approved');
  });

  // Reject user
  rejectUserBtn.addEventListener('click', function() {
    updateUserStatus(currentUserId, 'rejected');
  });

  // Role assignment form submission
  roleAssignmentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const role = roleSelect.value;
    updateUserRole(currentUserId, role);
  });

  function updateUserStatus(userId, status) {
    fetch(`/admin/update-user-status/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
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
        alert(`User ${status} successfully!`);
        approvalModal.style.display = 'none';
        window.location.reload();
      } else {
        alert(data.message || 'Update failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to update user status');
    });
  }

  function updateUserRole(userId, role) {
    fetch(`/admin/update-user-role/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
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
        alert(`User role updated to ${role} successfully!`);
        roleModal.style.display = 'none';
        window.location.reload();
      } else {
        alert(data.message || 'Update failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to update user role');
    });
  }

  function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    fetch(`/admin/delete-user/${userId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Delete failed');
    })
    .then(data => {
      if (data.success) {
        alert('User deleted successfully!');
        window.location.reload();
      } else {
        alert(data.message || 'Delete failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete user');
    });
  }

  function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    fetch(`/admin/delete-item/${itemId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Delete failed');
    })
    .then(data => {
      if (data.success) {
        alert('Item deleted successfully!');
        window.location.reload();
      } else {
        alert(data.message || 'Delete failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete item');
    });
  }

  // Search functionality
  searchNewUsers.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      filterTable('newUsersTableBody', searchNewUsers.value);
    }
  });

  searchUserList.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      filterTable('userListTableBody', searchUserList.value);
    }
  });

  searchItemList.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      filterTable('itemListTableBody', searchItemList.value);
    }
  });

  function filterTable(tableBodyId, searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const rows = document.querySelectorAll(`#${tableBodyId} tr`);
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
      
      row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
  }

  // Export functionality
  exportNewUsersBtn.addEventListener('click', function() {
    exportToCSV('newUsersTable', 'new_users');
  });

  exportUserListBtn.addEventListener('click', function() {
    exportToCSV('userListTable', 'user_list');
  });

  exportItemListBtn.addEventListener('click', function() {
    exportToCSV('itemListTable', 'item_list');
  });

  function exportToCSV(tableId, filename) {
    const table = document.querySelector(`#${tableId}Section .items-table`);
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
      if (rows[i].style.display === 'none') continue;
      
      const cells = rows[i].querySelectorAll('td');
      const row = Array.from(cells).map(cell => 
        `"${cell.textContent.trim().replace(/"/g, '""')}"`
      ).join(',');
      csvContent.push(row);
    }
    
    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('CSV file downloaded successfully!');
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === approvalModal) {
      approvalModal.style.display = 'none';
      currentUserId = null;
    }
    if (event.target === roleModal) {
      roleModal.style.display = 'none';
      currentUserId = null;
    }
  });

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

  // Initialize the page
  initializePage();
});