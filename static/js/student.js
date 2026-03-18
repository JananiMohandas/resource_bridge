// ============= Configuration =============
const API_BASE_URL = window.location.origin;

// ============= State =============
let allResources = [];
let activeTags = new Set();

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

// ============= Search & Filter =============
document.getElementById('searchBtn').addEventListener('click', searchResources);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchResources();
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    activeTags.clear();
    loadResources();
});

async function searchResources() {
    const query = document.getElementById('searchInput').value.trim();
    const tags = Array.from(activeTags);
    
    const loadingElement = document.getElementById('loadingResources');
    const containerElement = document.getElementById('resourcesContainer');
    
    try {
        loadingElement.classList.remove('hidden');
        containerElement.classList.add('hidden');
        
        let url = `${API_BASE_URL}/api/search?`;
        if (query) {
            url += `q=${encodeURIComponent(query)}&`;
        }
        if (tags.length > 0) {
            url += `tags=${encodeURIComponent(tags.join(','))}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            allResources = data.resources;
            displayResources(data.resources);
            updateFilterTags();
        } else {
            showAlert(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    } finally {
        loadingElement.classList.add('hidden');
        containerElement.classList.remove('hidden');
    }
}

function updateFilterTags() {
    // Extract all unique tags from resources
    const allTags = new Set();
    allResources.forEach(resource => {
        if (resource.tags && Array.isArray(resource.tags)) {
            resource.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    if (allTags.size === 0) {
        document.getElementById('filterTagsContainer').classList.add('hidden');
        return;
    }
    
    document.getElementById('filterTagsContainer').classList.remove('hidden');
    const filterTagsContainer = document.getElementById('filterTags');
    
    filterTagsContainer.innerHTML = Array.from(allTags).map(tag => `
        <button class="filter-tag ${activeTags.has(tag) ? 'active' : ''}" 
                data-tag="${escapeHtml(tag)}">
            ${escapeHtml(tag)}
        </button>
    `).join('');
    
    // Add click handlers
    filterTagsContainer.querySelectorAll('.filter-tag').forEach(button => {
        button.addEventListener('click', () => {
            const tag = button.dataset.tag;
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
            } else {
                activeTags.add(tag);
            }
            searchResources();
        });
    });
}

// ============= Load Resources =============
async function loadResources() {
    const loadingElement = document.getElementById('loadingResources');
    const containerElement = document.getElementById('resourcesContainer');
    
    try {
        loadingElement.classList.remove('hidden');
        containerElement.classList.add('hidden');
        
        const response = await fetch(`${API_BASE_URL}/api/resources`);
        const data = await response.json();
        
        if (response.ok) {
            allResources = data.resources;
            displayResources(data.resources);
            updateFilterTags();
        } else {
            showAlert(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    } finally {
        loadingElement.classList.add('hidden');
        containerElement.classList.remove('hidden');
    }
}

function displayResources(resources) {
    const container = document.getElementById('resourcesContainer');
    
    if (resources.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No resources found</h3>
                <p>Try adjusting your search or filters</p>
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
                        <a href="${resource.file_url}" target="_blank" download class="btn btn-primary btn-small" style="width: 100%;">
                            📥 Download PDF
                        </a>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============= Request Resource Form =============
document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        const requestData = {
            topic: document.getElementById('topic').value,
            created_by: document.getElementById('student_name').value || 'Anonymous'
        };
        
        const response = await fetch(`${API_BASE_URL}/api/create-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('✅ Request submitted successfully!', 'success');
            document.getElementById('requestForm').reset();
            loadRequests(); // Refresh the requests list
        } else {
            showAlert(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ============= Load Requests =============
async function loadRequests() {
    const loadingElement = document.getElementById('loadingRequests');
    const containerElement = document.getElementById('requestsContainer');
    
    try {
        loadingElement.classList.remove('hidden');
        containerElement.classList.add('hidden');
        
        const response = await fetch(`${API_BASE_URL}/api/requests`);
        const data = await response.json();
        
        if (response.ok) {
            displayRequests(data.requests);
        } else {
            showAlert(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    } finally {
        loadingElement.classList.add('hidden');
        containerElement.classList.remove('hidden');
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requestsContainer');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>No requests yet</h3>
                <p>Be the first to request a resource!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-content">
                <div class="request-topic">${escapeHtml(request.topic)}</div>
                <div class="request-meta">
                    Requested by ${escapeHtml(request.created_by)} • ${formatDate(request.created_at)}
                </div>
            </div>
            <div class="request-actions">
                <div class="vote-display">
                    <div class="vote-count">${request.votes}</div>
                    <div class="vote-label">votes</div>
                </div>
                <button class="btn btn-success btn-small" onclick="voteRequest('${request.id}')">
                    👍 Vote
                </button>
            </div>
        </div>
    `).join('');
}

// ============= Vote Request =============
async function voteRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vote-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ request_id: requestId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('✅ Vote recorded!', 'success');
            loadRequests(); // Refresh the requests list
        } else {
            showAlert(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert(`❌ Error: ${error.message}`, 'error');
    }
}

// Make voteRequest globally accessible
window.voteRequest = voteRequest;

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
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// ============= Initialize =============
document.addEventListener('DOMContentLoaded', () => {
    loadResources();
    loadRequests();
});