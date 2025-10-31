/*
  MSECHO Security Services — app.js
  - Form validation and submission
  - Modal handling with focus trap
  - Admin panel with localStorage
  - Navigation and smooth scrolling
  - File upload handling
*/

// Demo admin password (change for production)
const DEMO_ADMIN_PASSWORD = "msechoAdmin123";

// DOM elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const modal = document.querySelector('#apply-modal');
const modalBackdrop = document.querySelector('[data-close-modal]');
const modalClose = document.querySelector('.modal-close');
const applicationForm = document.querySelector('#application-form');
const applicationFormModal = document.querySelector('#application-form-modal');
const contactForm = document.querySelector('#contact-form');
const adminLoginBtn = document.querySelector('[data-admin-login]');
const exportAllBtn = document.querySelector('[data-export-all]');
const clearAllBtn = document.querySelector('[data-clear-all]');
const submissionsContainer = document.querySelector('#submissions');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeNavigation();
  initializeModals();
  initializeForms();
  initializeAdmin();
  initializeScrollBehavior();
  updateCopyrightYear();
});

// Navigation
function initializeNavigation() {
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
      }
    });
  }
}

// Modal handling
function initializeModals() {
  // Open modal buttons
  document.querySelectorAll('[data-open-apply]').forEach(btn => {
    btn.addEventListener('click', function() {
      const position = this.getAttribute('data-position');
      openModal(position);
    });
  });

  // Close modal buttons
  [modalBackdrop, modalClose].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', closeModal);
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });

  // Focus trap in modal
  if (modal) {
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        trapFocus(e, modal);
      }
    });
  }
}

function openModal(position = '') {
  if (modal) {
    // Set position in modal form
    const positionSelect = modal.querySelector('#m-position');
    if (positionSelect && position) {
      positionSelect.value = position;
    }
    
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      firstInput.focus();
    }
  }
}

function closeModal() {
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Reset modal form
    if (applicationFormModal) {
      applicationFormModal.reset();
      clearErrors(applicationFormModal);
    }
  }
}

function trapFocus(e, container) {
  const focusableElements = container.querySelectorAll(
    'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
}

// Form handling
function initializeForms() {
  // Application forms (both standalone and modal)
  [applicationForm, applicationFormModal].forEach(form => {
    if (form) {
      form.addEventListener('submit', handleApplicationSubmit);
      form.addEventListener('reset', () => clearErrors(form));
      
      // File upload handling
      const fileInput = form.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
      }
    }
  });

  // Contact form
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  // New application buttons
  document.querySelectorAll('[data-new-application]').forEach(btn => {
    btn.addEventListener('click', function() {
      const successDiv = this.closest('.success');
      if (successDiv) {
        successDiv.hidden = true;
      }
      
      // Reset and show form
      const form = successDiv.previousElementSibling;
      if (form && form.tagName === 'FORM') {
        form.reset();
        clearErrors(form);
        form.hidden = false;
      }
    });
  });
}

function handleApplicationSubmit(e) {
  e.preventDefault();
  const form = e.target;
  
  if (validateApplicationForm(form)) {
    const formData = collectFormData(form);
    saveApplication(formData);
    showSuccess(form);
  }
}

function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  
  if (validateContactForm(form)) {
    const formData = collectContactData(form);
    saveContactMessage(formData);
    showContactSuccess(form);
  }
}

function validateApplicationForm(form) {
  let isValid = true;
  clearErrors(form);

  // Required fields
  const requiredFields = [
    { id: 'fullName', message: 'Full name is required' },
    { id: 'email', message: 'Valid email is required' },
    { id: 'phone', message: 'Phone number is required' },
    { id: 'position', message: 'Please select a position' },
    { id: 'consent', message: 'Consent is required' }
  ];

  requiredFields.forEach(field => {
    const input = form.querySelector(`#${field.id}, #m-${field.id}`);
    if (input) {
      if (input.type === 'checkbox' && !input.checked) {
        showError(input, field.message);
        isValid = false;
      } else if (input.type !== 'checkbox' && !input.value.trim()) {
        showError(input, field.message);
        isValid = false;
      }
    }
  });

  // Email validation
  const emailInput = form.querySelector('#email, #m-email');
  if (emailInput && emailInput.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      showError(emailInput, 'Please enter a valid email address');
      isValid = false;
    }
  }

  // Phone validation
  const phoneInput = form.querySelector('#phone, #m-phone');
  if (phoneInput && phoneInput.value) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneInput.value)) {
      showError(phoneInput, 'Please enter a valid phone number');
      isValid = false;
    }
  }

  // File validation
  const fileInput = form.querySelector('input[type="file"]');
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (file.size > maxSize) {
      showError(fileInput, 'File size must be less than 5MB');
      isValid = false;
    } else if (!allowedTypes.includes(fileExtension)) {
      showError(fileInput, 'Please upload a PDF, DOC, or DOCX file');
      isValid = false;
    }
  }

  return isValid;
}

function validateContactForm(form) {
  let isValid = true;
  clearErrors(form);

  const nameInput = form.querySelector('#cName');
  const emailInput = form.querySelector('#cEmail');
  const messageInput = form.querySelector('#cMessage');

  if (nameInput && !nameInput.value.trim()) {
    showError(nameInput, 'Name is required');
    isValid = false;
  }

  if (emailInput && !emailInput.value.trim()) {
    showError(emailInput, 'Email is required');
    isValid = false;
  } else if (emailInput && emailInput.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      showError(emailInput, 'Please enter a valid email address');
      isValid = false;
    }
  }

  if (messageInput && !messageInput.value.trim()) {
    showError(messageInput, 'Message is required');
    isValid = false;
  }

  return isValid;
}

function showError(input, message) {
  const errorId = input.id.replace('m-', 'm-err-').replace(/([A-Z])/g, '-$1').toLowerCase();
  const errorElement = document.querySelector(`#err-${errorId}`);
  if (errorElement) {
    errorElement.textContent = message;
  }
  input.setAttribute('aria-invalid', 'true');
}

function clearErrors(form) {
  const errorElements = form.querySelectorAll('.error');
  errorElements.forEach(el => el.textContent = '');
  
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => input.removeAttribute('aria-invalid'));
}

function collectFormData(form) {
  const formData = new FormData(form);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  // Handle file upload
  const fileInput = form.querySelector('input[type="file"]');
  if (fileInput && fileInput.files.length > 0) {
    data.cvFile = fileInput.files[0].name;
    data.cvSize = fileInput.files[0].size;
    // In production, you'd upload the file to a server
    // For demo, we just store the filename
  }
  
  data.timestamp = new Date().toISOString();
  data.id = Date.now().toString();
  
  return data;
}

function collectContactData(form) {
  const formData = new FormData(form);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  data.timestamp = new Date().toISOString();
  data.id = Date.now().toString();
  
  return data;
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  const preview = e.target.parentElement.querySelector('.file-preview');
  
  if (file) {
    preview.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
        <span>📄 ${file.name}</span>
        <button type="button" onclick="this.parentElement.parentElement.previousElementSibling.value=''; this.parentElement.innerHTML='';" 
                style="background: none; border: none; color: #ffb4b4; cursor: pointer;">✕</button>
      </div>
    `;
  } else {
    preview.innerHTML = '';
  }
}

function saveApplication(data) {
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  applications.push(data);
  localStorage.setItem('applications', JSON.stringify(applications));
}

function saveContactMessage(data) {
  const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
  messages.push(data);
  localStorage.setItem('contactMessages', JSON.stringify(messages));
}

function showSuccess(form) {
  const successDiv = form.parentElement.querySelector('.success, #application-success, #application-success-modal');
  if (successDiv) {
    form.hidden = true;
    successDiv.hidden = false;
  }
}

function showContactSuccess(form) {
  alert('Message sent! (Demo: stored locally)');
  form.reset();
  clearErrors(form);
}

// Admin panel
function initializeAdmin() {
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', handleAdminLogin);
  }
  
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', exportAllData);
  }
  
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllData);
  }
}

function handleAdminLogin() {
  const password = prompt('Enter admin password:');
  if (password === DEMO_ADMIN_PASSWORD) {
    showAdminPanel();
  } else if (password !== null) {
    alert('Incorrect password. Demo password: ' + DEMO_ADMIN_PASSWORD);
  }
}

function showAdminPanel() {
  adminLoginBtn.textContent = 'Logged in';
  adminLoginBtn.disabled = true;
  exportAllBtn.disabled = false;
  clearAllBtn.disabled = false;
  
  loadSubmissions();
}

function loadSubmissions() {
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
  
  let html = '<h3>Job Applications (' + applications.length + ')</h3>';
  
  if (applications.length === 0) {
    html += '<p>No applications found.</p>';
  } else {
    applications.forEach(app => {
      html += `
        <div class="submission-card">
          <h4>${app.fullName} - ${app.position}</h4>
          <p><strong>Email:</strong> ${app.email}</p>
          <p><strong>Phone:</strong> ${app.phone}</p>
          <p><strong>Experience:</strong> ${app.experience || 'Not specified'} years</p>
          <p><strong>Location:</strong> ${app.location || 'Not specified'}</p>
          ${app.cvFile ? `<p><strong>CV:</strong> ${app.cvFile}</p>` : ''}
          <p class="submission-meta">Applied: ${new Date(app.timestamp).toLocaleString()}</p>
          <div class="submission-actions">
            <button class="btn btn-small btn-outline" onclick="downloadSubmission('${app.id}')">Download</button>
            <button class="btn btn-small btn-ghost" onclick="deleteSubmission('${app.id}')">Delete</button>
          </div>
        </div>
      `;
    });
  }
  
  html += '<h3>Contact Messages (' + messages.length + ')</h3>';
  
  if (messages.length === 0) {
    html += '<p>No messages found.</p>';
  } else {
    messages.forEach(msg => {
      html += `
        <div class="submission-card">
          <h4>${msg.cName}</h4>
          <p><strong>Email:</strong> ${msg.cEmail}</p>
          <p><strong>Message:</strong> ${msg.cMessage}</p>
          <p class="submission-meta">Sent: ${new Date(msg.timestamp).toLocaleString()}</p>
          <div class="submission-actions">
            <button class="btn btn-small btn-outline" onclick="downloadSubmission('${msg.id}')">Download</button>
            <button class="btn btn-small btn-ghost" onclick="deleteSubmission('${msg.id}')">Delete</button>
          </div>
        </div>
      `;
    });
  }
  
  submissionsContainer.innerHTML = html;
}

function downloadSubmission(id) {
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
  
  const submission = [...applications, ...messages].find(item => item.id === id);
  if (submission) {
    const dataStr = JSON.stringify(submission, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function deleteSubmission(id) {
  if (confirm('Are you sure you want to delete this submission?')) {
    let applications = JSON.parse(localStorage.getItem('applications') || '[]');
    let messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    
    applications = applications.filter(app => app.id !== id);
    messages = messages.filter(msg => msg.id !== id);
    
    localStorage.setItem('applications', JSON.stringify(applications));
    localStorage.setItem('contactMessages', JSON.stringify(messages));
    
    loadSubmissions();
  }
}

function exportAllData() {
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
  
  const allData = {
    applications,
    messages,
    exported: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `msecho-submissions-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (confirm('Are you sure you want to delete ALL submissions? This cannot be undone.')) {
    localStorage.removeItem('applications');
    localStorage.removeItem('contactMessages');
    loadSubmissions();
  }
}

// Smooth scrolling
function initializeScrollBehavior() {
  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains('open')) {
          navToggle.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('open');
        }
      }
    });
  });
}

function updateCopyrightYear() {
  const yearElement = document.querySelector('#year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Make functions globally available for onclick handlers
window.downloadSubmission = downloadSubmission;
window.deleteSubmission = deleteSubmission;
