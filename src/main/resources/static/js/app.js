let currentUsers = [];
let isEditMode = false;
let editingUserId = null;

// DOM elements
const usersTableBody = document.getElementById('usersTableBody');
const userForm = document.getElementById('userForm');
const userModal = new bootstrap.Modal(document.getElementById('userModal'));
const searchInput = document.getElementById('searchInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const noUsersMessage = document.getElementById('noUsersMessage');

// Toast elements
const successToast = new bootstrap.Toast(document.getElementById('successToast'));
const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    userForm.addEventListener('submit', handleFormSubmit);
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    document.getElementById('clearSearch').addEventListener('click', clearSearch);
    
    // Modal events
    document.getElementById('userModal').addEventListener('hidden.bs.modal', resetForm);
}

// Load all users
async function loadUsers() {
    showLoading(true);
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            currentUsers = await response.json();
            displayUsers(currentUsers);
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display users in table
function displayUsers(users) {
    if (users.length === 0) {
        usersTableBody.innerHTML = '';
        noUsersMessage.style.display = 'block';
        return;
    }
    
    noUsersMessage.style.display = 'none';
    usersTableBody.innerHTML = users.map(user => `
        <tr data-user-id="${user.id}">
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar me-3">
                        <i class="fas fa-user-circle fa-2x text-primary"></i>
                    </div>
                    <div>
                        <strong>${escapeHtml(user.fullName)}</strong>
                    </div>
                </div>
            </td>
            <td>
                <i class="fas fa-envelope text-muted me-2"></i>
                ${escapeHtml(user.email)}
            </td>
            <td>
                <i class="fas fa-phone text-muted me-2"></i>
                ${escapeHtml(user.phoneNumber)}
            </td>
            <td>
                <i class="fas fa-map-marker-alt text-muted me-2"></i>
                ${user.city && user.country ? 
                    `${escapeHtml(user.city)}, ${escapeHtml(user.country)}` : 
                    (user.city || user.country || 'Not specified')}
            </td>
            <td class="text-center">
                <button class="btn btn-outline-primary btn-sm btn-action" 
                        onclick="editUser('${user.id}')" 
                        title="Edit User">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-info btn-sm btn-action" 
                        onclick="viewUser('${user.id}')" 
                        title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm btn-action" 
                        onclick="deleteUser('${user.id}')" 
                        title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(userForm);
    const userData = Object.fromEntries(formData.entries());
    
    // Clear previous validation errors
    clearValidationErrors();
    
    try {
        showLoading(true);
        
        const url = isEditMode ? `/api/users/${editingUserId}` : '/api/users';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(isEditMode ? 'User updated successfully!' : 'User created successfully!');
            userModal.hide();
            await loadUsers();
        } else if (response.status === 400) {
            const errors = await response.json();
            displayValidationErrors(errors);
        } else {
            throw new Error('Failed to save user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showError('Failed to save user. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
            const user = await response.json();
            populateForm(user);
            isEditMode = true;
            editingUserId = userId;
            document.getElementById('userModalLabel').innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update User';
            userModal.show();
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showError('Failed to load user details.');
    }
}

// View user details
async function viewUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
            const user = await response.json();
            showUserDetails(user);
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showError('Failed to load user details.');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('User deleted successfully!');
            await loadUsers();
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayUsers(currentUsers);
        return;
    }
    
    const filteredUsers = currentUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.phoneNumber.includes(searchTerm) ||
        (user.city && user.city.toLowerCase().includes(searchTerm)) ||
        (user.country && user.country.toLowerCase().includes(searchTerm))
    );
    
    displayUsers(filteredUsers);
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    displayUsers(currentUsers);
}

// Populate form with user data
function populateForm(user) {
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phoneNumber').value = user.phoneNumber || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('city').value = user.city || '';
    document.getElementById('country').value = user.country || '';
}

// Reset form
function resetForm() {
    userForm.reset();
    clearValidationErrors();
    isEditMode = false;
    editingUserId = null;
    document.getElementById('userModalLabel').innerHTML = '<i class="fas fa-user-plus"></i> Add New User';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Save User';
}

// Display validation errors
function displayValidationErrors(errors) {
    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`${field}Error`);
        const inputElement = document.getElementById(field);
        
        if (errorElement && inputElement) {
            errorElement.textContent = errors[field];
            inputElement.classList.add('is-invalid');
        }
    });
}

// Clear validation errors
function clearValidationErrors() {
    const errorElements = document.querySelectorAll('.invalid-feedback');
    const inputElements = document.querySelectorAll('.form-control');
    
    errorElements.forEach(element => element.textContent = '');
    inputElements.forEach(element => element.classList.remove('is-invalid'));
}

// Show user details modal
function showUserDetails(user) {
    const detailsHtml = `
        <div class="modal fade" id="userDetailsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user"></i> User Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-12 text-center mb-3">
                                <i class="fas fa-user-circle fa-4x text-primary"></i>
                                <h4 class="mt-2">${escapeHtml(user.fullName)}</h4>
                            </div>
                            <div class="col-md-6">
                                <strong>Email:</strong><br>
                                <i class="fas fa-envelope text-muted me-2"></i>${escapeHtml(user.email)}
                            </div>
                            <div class="col-md-6">
                                <strong>Phone:</strong><br>
                                <i class="fas fa-phone text-muted me-2"></i>${escapeHtml(user.phoneNumber)}
                            </div>
                            <div class="col-md-6">
                                <strong>City:</strong><br>
                                <i class="fas fa-city text-muted me-2"></i>${user.city || 'Not specified'}
                            </div>
                            <div class="col-md-6">
                                <strong>Country:</strong><br>
                                <i class="fas fa-flag text-muted me-2"></i>${user.country || 'Not specified'}
                            </div>
                            <div class="col-12">
                                <strong>Address:</strong><br>
                                <i class="fas fa-map-marker-alt text-muted me-2"></i>${user.address || 'Not specified'}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="editUser('${user.id}')" data-bs-dismiss="modal">
                            <i class="fas fa-edit"></i> Edit User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('userDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to DOM
    document.body.insertAdjacentHTML('beforeend', detailsHtml);
    
    // Show modal
    const detailsModal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    detailsModal.show();
    
    // Clean up modal after hiding
    document.getElementById('userDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Utility functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    successToast.show();
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorToast.show();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

// Export functions for global access
window.loadUsers = loadUsers;
window.editUser = editUser;
window.viewUser = viewUser;
window.deleteUser = deleteUser;