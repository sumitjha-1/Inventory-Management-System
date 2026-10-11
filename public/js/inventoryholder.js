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
  const addItemBtn = document.getElementById('addItemBtn');
  const addItemModal = document.getElementById('addItemModal');
  const closeAddItemModal = document.getElementById('closeAddItemModal');
  const cancelAddItem = document.getElementById('cancelAddItem');
  const addItemForm = document.getElementById('addItemForm');
  const itemsTableBody = document.getElementById('itemsTableBody');
  const deletedTableBody = document.getElementById('deletedTableBody');
  const condemnedTableBody = document.getElementById('condemnedTableBody');
  const searchDeleted = document.getElementById('searchDeleted');
  const searchCondemned = document.getElementById('searchCondemned');
  const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
  const exportItemsBtn = document.getElementById('exportItemsBtn');
  const exportDeletedBtn = document.getElementById('exportDeletedBtn');
  const exportCondemnedBtn = document.getElementById('exportCondemnedBtn');
  const condemnActions = document.getElementById('condemnActions');
  const cancelCondemnBtn = document.getElementById('cancelCondemnBtn');
  const submitCondemnBtn = document.getElementById('submitCondemnBtn');
  const condemItemsBtn = document.getElementById('condemnItemsBtn');
  const issueItemModal = document.getElementById('issueItemModal');
  const closeIssueModal = document.getElementById('closeIssueModal');
  const cancelIssueItem = document.getElementById('cancelIssueItem');
  const issueItemForm = document.getElementById('issueItemForm');
  const editItemModal = document.getElementById('editItemModal');
  const closeEditItemModal = document.getElementById('closeEditItemModal');
  const cancelEditItem = document.getElementById('cancelEditItem');
  const editItemForm = document.getElementById('editItemForm');
  const filterStatus = document.getElementById('filterStatus');

  // State variables
  let showCondemnCheckboxes = false;
  let currentItemToIssue = null;

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
          showError('Logout failed. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showError('Logout failed. Please try again.');
      });
    }
  });

  // Edit profile functionality
  editProfileBtn.addEventListener('click', function() {
    const isDisabled = designationInput.disabled;
    if (isDisabled) enterEditMode();
    else saveChanges();
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

    if (currentPassword || newPassword || confirmPassword) {
      if (!validatePasswordChange()) return;
    }

    const updateData = { designation };
    if (newPassword) {
      updateData.currentPassword = currentPassword;
      updateData.newPassword = newPassword;
    }

    const originalBtnText = editProfileBtn.innerHTML;
    editProfileBtn.disabled = true;
    editProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    fetch('/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
      credentials: 'same-origin'
    })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (data.success) {
        showSuccess('Profile updated successfully!');
        resetEditMode();
      } else {
        showError(data.message || 'Update failed');
      }
    })
    .catch(error => showError('Failed to update profile. Please try again.'))
    .finally(() => {
      editProfileBtn.disabled = false;
      editProfileBtn.innerHTML = originalBtnText;
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
        showError('Please enter your current password');
        return false;
      }
      if (newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return false;
      }
      if (newPassword.length < 8) {
        showError('Password must be at least 8 characters long');
        return false;
      }
    }
    return true;
  }

  // Add item modal functionality
  addItemBtn.addEventListener('click', () => addItemModal.style.display = 'flex');
  closeAddItemModal.addEventListener('click', closeAddModal);
  cancelAddItem.addEventListener('click', closeAddModal);

  function closeAddModal() {
    addItemModal.style.display = 'none';
    addItemForm.reset();
    clearAddItemErrors();
  }

  // Add item form submission
  addItemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearAddItemErrors();
    
    const formData = {
      ledgerNo: document.getElementById('ledgerNo').value.trim(),
      itemName: document.getElementById('itemName').value.trim(),
      quantity: document.getElementById('quantity').value,
      unit: document.getElementById('unit').value,
      procurementDate: document.getElementById('procurementDate').value,
      custodian: document.getElementById('custodian').value
    };

    if (!validateAddForm(formData)) return;

    const submitBtn = addItemForm.querySelector('.submit');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    fetch('/inventory/add-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'same-origin'
    })
    .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
    .then(data => {
      if (data.success) {
        showSuccess('Item added successfully!');
        closeAddModal();
        window.location.reload();
      } else {
        showError(data.message || 'Failed to add item');
      }
    })
    .catch(error => showError(error.message || 'An error occurred while adding item'))
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    });
  });

  function validateAddForm(formData) {
    let isValid = true;

    if (!formData.ledgerNo) {
      showFieldError('ledgerNo', 'Ledger No is required');
      isValid = false;
    } else if (!/^[A-Za-z0-9]+$/.test(formData.ledgerNo)) {
      showFieldError('ledgerNo', 'Only alphanumeric characters allowed');
      isValid = false;
    }

    if (!formData.itemName) {
      showFieldError('itemName', 'Item Name is required');
      isValid = false;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      showFieldError('quantity', 'Valid quantity is required');
      isValid = false;
    }

    if (!formData.unit) {
      showFieldError('unit', 'Unit is required');
      isValid = false;
    }

    if (!formData.procurementDate) {
      showFieldError('procurementDate', 'Procurement Date is required');
      isValid = false;
    }

    return isValid;
  }

  function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
      errorElement.textContent = message;
      document.getElementById(fieldId).classList.add('error-field');
    }
  }

  function clearAddItemErrors() {
    document.querySelectorAll('#addItemForm .error').forEach(el => {
      el.textContent = '';
      el.previousElementSibling.classList.remove('error-field');
    });
  }

  // Edit item functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.edit-btn')) {
      const itemId = e.target.closest('.edit-btn').getAttribute('data-id');
      openEditItemModal(itemId);
    }
  });

  async function openEditItemModal(itemId) {
    try {
      const response = await fetch(`/inventory/get-item/${itemId}`);
      const item = await response.json();
      
      if (!item) throw new Error('Item not found');
      
      document.getElementById('editItemId').value = item._id;
      document.getElementById('editLedgerNo').value = item.ledgerNo;
      document.getElementById('editItemName').value = item.itemName;
      document.getElementById('editQuantity').value = item.quantity;
      document.getElementById('editUnit').value = item.unit;
      document.getElementById('editProcurementDate').value = new Date(item.procurementDate).toISOString().split('T')[0];
      document.getElementById('editCustodian').value = item.custodian?._id || '';
      
      editItemModal.style.display = 'flex';
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to load item details');
    }
  }

  // Close edit modal
  closeEditItemModal.addEventListener('click', closeEditModal);
  cancelEditItem.addEventListener('click', closeEditModal);

  function closeEditModal() {
    editItemModal.style.display = 'none';
    editItemForm.reset();
  }

  // Edit item form submission
  editItemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('editItemId').value;
    const formData = {
      ledgerNo: document.getElementById('editLedgerNo').value.trim(),
      itemName: document.getElementById('editItemName').value.trim(),
      quantity: document.getElementById('editQuantity').value,
      unit: document.getElementById('editUnit').value,
      procurementDate: document.getElementById('editProcurementDate').value,
      custodian: document.getElementById('editCustodian').value
    };

    if (!validateEditForm(formData)) return;

    const submitBtn = editItemForm.querySelector('.submit');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    fetch(`/inventory/update-item/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'same-origin'
    })
    .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
    .then(data => {
      if (data.success) {
        showSuccess('Item updated successfully!');
        closeEditModal();
        window.location.reload();
      } else {
        showError(data.message || 'Failed to update item');
      }
    })
    .catch(error => showError(error.message || 'An error occurred while updating item'))
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    });
  });

  function validateEditForm(formData) {
    let isValid = true;

    if (!formData.ledgerNo) {
      showFieldError('editLedgerNo', 'Ledger No is required');
      isValid = false;
    }

    if (!formData.itemName) {
      showFieldError('editItemName', 'Item Name is required');
      isValid = false;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      showFieldError('editQuantity', 'Valid quantity is required');
      isValid = false;
    }

    if (!formData.unit) {
      showFieldError('editUnit', 'Unit is required');
      isValid = false;
    }

    if (!formData.procurementDate) {
      showFieldError('editProcurementDate', 'Procurement Date is required');
      isValid = false;
    }

    return isValid;
  }

  // Assign custodian functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.issue-btn')) {
      currentItemToIssue = e.target.closest('.issue-btn').getAttribute('data-id');
      issueItemModal.style.display = 'flex';
    }
  });

  closeIssueModal.addEventListener('click', closeIssueModalHandler);
  cancelIssueItem.addEventListener('click', closeIssueModalHandler);

  function closeIssueModalHandler() {
    issueItemModal.style.display = 'none';
    issueItemForm.reset();
    currentItemToIssue = null;
  }

  // Assign custodian form submission - UPDATED TO KEEP ITEM VISIBLE
  issueItemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const issueTo = document.getElementById('issueTo').value;
    if (!issueTo) {
      document.getElementById('issueToError').textContent = 'Please select a user';
      return;
    }

    const submitBtn = issueItemForm.querySelector('.submit');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';

    fetch(`/inventory/assign-custodian/${currentItemToIssue}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custodian: issueTo }),
      credentials: 'same-origin'
    })
    .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
    .then(data => {
      if (data.success) {
        showSuccess('Item assigned successfully!');
        issueItemModal.style.display = 'none';
        issueItemForm.reset();
        
        // Update the row instead of reloading
        const row = document.querySelector(`tr[data-id="${currentItemToIssue}"]`);
        if (row) {
          const custodianName = document.getElementById('issueTo').selectedOptions[0].text.split(' (')[0];
          row.querySelector('td:nth-child(8)').textContent = custodianName;
          row.querySelector('.issue-btn').style.display = 'none';
          row.setAttribute('data-status', 'assigned');
          row.querySelector('td:nth-child(9)').textContent = 'assigned';
        }
      } else {
        showError(data.message || 'Failed to assign item');
      }
    })
    .catch(error => showError(error.message || 'An error occurred while assigning item'))
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      currentItemToIssue = null;
    });
  });

  // Delete item functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.delete-btn')) {
      const itemId = e.target.closest('.delete-btn').getAttribute('data-id');
      deleteItem(itemId);
    }
  });

  function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    fetch(`/inventory/delete-item/${itemId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
    .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
    .then(data => {
      if (data.success) {
        showSuccess('Item deleted successfully!');
        window.location.reload();
      } else {
        showError(data.message || 'Failed to delete item');
      }
    })
    .catch(error => showError(error.message || 'An error occurred while deleting item'));
  }

  // Condemn items functionality
  condemItemsBtn.addEventListener('click', function() {
    showCondemnCheckboxes = true;
    updateCondemnUI();
  });

  cancelCondemnBtn.addEventListener('click', function() {
    showCondemnCheckboxes = false;
    updateCondemnUI();
  });

  submitCondemnBtn.addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('.condemn-checkbox:checked');
    if (checkboxes.length === 0) {
      showError('Please select at least one item to condemn');
      return;
    }

    const itemIds = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));

    const originalBtnText = submitCondemnBtn.innerHTML;
    submitCondemnBtn.disabled = true;
    submitCondemnBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    fetch('/inventory/condemn-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds }),
      credentials: 'same-origin'
    })
    .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
    .then(data => {
      if (data.success) {
        showSuccess(`${itemIds.length} item(s) condemned successfully!`);
        showCondemnCheckboxes = false;
        updateCondemnUI();
        window.location.reload();
      } else {
        showError(data.message || 'Failed to condemn items');
      }
    })
    .catch(error => showError(error.message || 'An error occurred while condemning items'))
    .finally(() => {
      submitCondemnBtn.disabled = false;
      submitCondemnBtn.innerHTML = originalBtnText;
    });
  });

  function updateCondemnUI() {
    document.querySelectorAll('.condemn-checkbox').forEach(checkbox => {
      checkbox.style.display = showCondemnCheckboxes ? 'block' : 'none';
    });
    
    condemnActions.style.display = showCondemnCheckboxes ? 'flex' : 'none';
    condemItemsBtn.style.display = showCondemnCheckboxes ? 'none' : 'block';
    
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.disabled = showCondemnCheckboxes;
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === addItemModal) closeAddModal();
    if (event.target === issueItemModal) closeIssueModalHandler();
    if (event.target === editItemModal) closeEditModal();
  });

  // Search functionality
  searchBtn.addEventListener('click', filterTable);
  searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') filterTable();
  });

  function filterTable() {
    const searchTerm = searchInput.value.toLowerCase();
    document.querySelectorAll('#itemsTableBody tr').forEach(row => {
      const cells = row.querySelectorAll('td:not(:first-child):not(:last-child)');
      const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
      row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
  }

  // Search for deleted items
  searchDeleted.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') filterDeletedTable();
  });

  function filterDeletedTable() {
    const searchTerm = searchDeleted.value.toLowerCase();
    document.querySelectorAll('#deletedTableBody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
      row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
  }

  // Search for condemned items
  searchCondemned.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') filterCondemnedTable();
  });

  function filterCondemnedTable() {
    const searchTerm = searchCondemned.value.toLowerCase();
    document.querySelectorAll('#condemnedTableBody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
      row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
  }

  // Export to CSV functionality
  exportItemsBtn.addEventListener('click', () => exportToCSV('itemsSection', 'inventory_items'));
  exportDeletedBtn.addEventListener('click', () => exportToCSV('deletedSection', 'deleted_items'));
  exportCondemnedBtn.addEventListener('click', () => exportToCSV('condemnedSection', 'condemned_items'));

  function exportToCSV(sectionId, filename) {
    const table = document.querySelector(`#${sectionId} .items-table`);
    const rows = table.querySelectorAll('tr');
    const csvContent = [];
    
    // Header row
    const headerCells = rows[0].querySelectorAll('th');
    const headerRow = Array.from(headerCells)
      .map((cell, index) => (sectionId === 'itemsSection' && index === 0) ? '' : `"${cell.textContent.trim().replace(/"/g, '""')}"`)
      .filter(Boolean)
      .join(',');
    csvContent.push(headerRow);
    
    // Data rows
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].style.display === 'none') continue;
      
      const cells = rows[i].querySelectorAll('td');
      const row = Array.from(cells)
        .map((cell, index) => (sectionId === 'itemsSection' && index === 0) ? '' : `"${cell.textContent.trim().replace(/"/g, '""')}"`)
        .filter(Boolean)
        .join(',');
      csvContent.push(row);
    }
    
    // Create and download CSV
    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('CSV file downloaded successfully!');
  }

  // Navigation between sections
  sidebarMenuItems.forEach(item => {
    item.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      sidebarMenuItems.forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(`${section}Section`).classList.add('active');
      
      if (section !== 'items') {
        showCondemnCheckboxes = false;
        updateCondemnUI();
      }
    });
  });

  // Status filter functionality
  if (filterStatus) {
    filterStatus.addEventListener('change', function() {
      const status = this.value;
      document.querySelectorAll('#itemsTableBody tr').forEach(row => {
        const isAssigned = row.querySelector('.issue-btn').style.display === 'none';
        if (status === 'all') row.style.display = '';
        else if (status === 'assigned') row.style.display = isAssigned ? '' : 'none';
        else if (status === 'unassigned') row.style.display = isAssigned ? 'none' : '';
      });
    });
  }

  // Helper functions
  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon', theme === 'light');
    icon.classList.toggle('fa-sun', theme === 'dark');
  }

  function showError(message) {
    showAlert(message, 'error');
  }

  function showSuccess(message) {
    showAlert(message, 'success');
  }

  function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    
    const header = document.querySelector('.header') || document.body;
    header.insertAdjacentElement('afterend', alertDiv);
    
    setTimeout(() => alertDiv.remove(), 5000);
  }
});