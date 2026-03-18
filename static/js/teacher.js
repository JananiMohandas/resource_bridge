// ============= Configuration =============
const API_BASE_URL = window.location.origin;

// ============= Alert Functions =============
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<span>${message}</span>`;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// ============= Upload Form Handler =============
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const uploadBtn = document.getElementById('uploadBtn');
    const originalText = uploadBtn.textContent;

    try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('file', document.getElementById('file').files[0]);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('tags', document.getElementById('tags').value);
        formData.append('uploaded_by', document.getElementById('uploaded_by').value || 'Anonymous');

        const response = await fetch(`${API_BASE_URL}/api/upload-resource`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('✅ Resource uploaded successfully!', 'success');
            document.getElementById('uploadForm').reset();
            loadResources();
        } else {
            showAlert(`❌ Error: ${data.error}`, 'error');
        }

    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = originalText;
    }
});

// ============= Load Resources =============
async function loadResources() {
    const loadingElement = document.getElementById('loadingResources');
    const containerElement = document.getElementById('resourcesContainer');

    try {
        if (loadingElement) loadingElement.classList.remove('hidden');
        if (containerElement) containerElement.classList.add('hidden');

        const response = await fetch(`${API_BASE_URL}/api/resources`);
        const data = await response.json();

        if (response.ok) {
            displayResources(data.resources);
        } else {
            showAlert(`❌ Error loading resources: ${data.error}`, 'error');
        }

    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    } finally {
        if (loadingElement) loadingElement.classList.add('hidden');
        if (containerElement) containerElement.classList.remove('hidden');
    }
}

function displayResources(resources) {
    const container = document.getElementById('resourcesContainer');

    if (!resources || resources.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No resources uploaded yet</h3>
                <p>Upload your first resource using the form above!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="resources-grid">
            ${resources.map(resource => `
                <div class="resource-item">
                    <div class="resource-header">
                        <div class="pdf-icon">📄</div>
                        <div class="resource-info">
                            <div class="resource-title">${escapeHtml(resource.title)}</div>
                        </div>
                    </div>

                    ${resource.description ? `
                        <div class="resource-description">
                            ${escapeHtml(resource.description)}
                        </div>
                    ` : ''}

                    ${resource.tags && resource.tags.length > 0 ? `
                        <div class="resource-tags">
                            ${resource.tags.map(tag => `
                                <span class="tag">${escapeHtml(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="resource-meta">
                        <span>By ${escapeHtml(resource.uploaded_by || 'Anonymous')}</span>
                        <span>${formatDate(resource.created_at)}</span>
                    </div>

                    <div style="margin-top: 15px;">
                        <a href="${resource.file_url}" target="_blank"
                           class="btn btn-primary btn-small"
                           style="width: 100%;">
                            View PDF
                        </a>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============= Load Student Requests =============
async function loadRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/requests`);
        const data = await response.json();

        if (response.ok) {
            displayRequests(data.requests);
        } else {
            showAlert(`❌ Error loading requests: ${data.error}`, 'error');
        }

    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requestsContainer');
    if (!container) return;

    if (!requests || requests.length === 0) {
        container.innerHTML = `<p>No student requests yet.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="requests-grid">
            ${requests.map(req => `
                <div class="request-item">
                    <h4>${escapeHtml(req.topic)}</h4>
                    <p>Votes: ${req.votes}</p>
                    <small>Requested by: ${escapeHtml(req.created_by)}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// ============= Utility Functions =============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

// ============= Initialize =============
document.addEventListener('DOMContentLoaded', () => {
    loadResources();
    loadRequests();   // 👈 THIS FIXES YOUR ISSUE
});