// API Configuration
const API_BASE = '/api';

// State Management
let currentUser = null;
let currentPage = 1;
let currentCategory = 'all';
let currentConsumerCategory = 'all';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    showView('homeView');
    loadPhotos();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                currentUser = data.user;
                updateUI();
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
        });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('homeView');
        loadPhotos();
    });
    
    document.getElementById('searchLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('searchView');
    });
    
    document.getElementById('loginLink').addEventListener('click', (e) => {
        e.preventDefault();
            const modal = document.getElementById('loginModal');
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
    });
    
    document.getElementById('registerLink').addEventListener('click', (e) => {
        e.preventDefault();
            const modal = document.getElementById('registerModal');
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
    });
    
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    document.getElementById('creatorDashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('creatorDashboardView');
        loadMyPhotos();
    });
    
    const consumerDashboardLink = document.getElementById('consumerDashboardLink');
    if (consumerDashboardLink) {
        consumerDashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('consumerDashboardView');
            // Small delay to ensure view is shown before loading
            setTimeout(() => {
                loadConsumerPhotos(1, currentConsumerCategory);
            }, 100);
        });
    }
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        currentPage++;
        loadPhotos(currentPage, currentCategory);
    });
    
    // Category filter buttons for home view
    document.querySelectorAll('.category-filters .category-btn[data-view="home"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            currentCategory = category;
            currentPage = 1;
            
            // Update active state
            document.querySelectorAll('.category-filters .category-btn[data-view="home"]').forEach(b => {
                b.classList.remove('active');
            });
            e.target.classList.add('active');
            
            loadPhotos(1, category);
        });
    });
    
    // Category filter buttons for consumer dashboard
    document.querySelectorAll('.category-filters .category-btn[data-view="consumer"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            currentConsumerCategory = category;
            
            // Update active state
            document.querySelectorAll('.category-filters .category-btn[data-view="consumer"]').forEach(b => {
                b.classList.remove('active');
            });
            e.target.classList.add('active');
            
            loadConsumerPhotos(1, category);
        });
    });
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            setTimeout(() => {
                e.target.style.display = 'none';
            }, 300);
        }
    });
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });
    const targetView = document.getElementById(viewId);
    if (!targetView) {
        console.error(`View element not found: ${viewId}`);
        return;
    }
    // Force display
    targetView.style.display = 'block';
    targetView.style.visibility = 'visible';
    targetView.style.opacity = '1';
    setTimeout(() => {
        targetView.classList.add('active');
    }, 10);
}

function updateUI() {
    if (currentUser) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userSection').style.display = 'block';
        
        if (currentUser.role === 'creator') {
            document.getElementById('creatorDashboardLink').style.display = 'inline';
            document.getElementById('consumerDashboardLink').style.display = 'none';
        } else {
            document.getElementById('creatorDashboardLink').style.display = 'none';
            document.getElementById('consumerDashboardLink').style.display = 'inline';
        }
    } else {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('userSection').style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            const modal = document.getElementById('loginModal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            document.getElementById('loginForm').reset();
            errorDiv.style.display = 'none';
            errorDiv.classList.remove('show');
            showView('homeView');
            loadPhotos(1, currentCategory);
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const errorDiv = document.getElementById('registerError');
    
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            const modal = document.getElementById('registerModal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            document.getElementById('registerForm').reset();
            errorDiv.style.display = 'none';
            errorDiv.classList.remove('show');
            showView('homeView');
            loadPhotos(1, currentCategory);
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
            errorDiv.style.display = 'block';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUI();
    showView('homeView');
    currentPage = 1;
    loadPhotos(1, currentCategory);
}

async function loadPhotos(page = 1, category = 'all') {
    const grid = document.getElementById('photosGrid');
    const loading = document.getElementById('loadingIndicator');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (page === 1) {
        grid.innerHTML = '';
        loading.style.display = 'block';
    }
    
    try {
        const categoryParam = category ? `&category=${category}` : '';
        const res = await fetch(`${API_BASE}/photos?page=${page}&limit=12${categoryParam}`);
        const data = await res.json();
        
        if (res.ok) {
            loading.style.display = 'none';
            
            if (data.photos.length === 0 && page === 1) {
                grid.innerHTML = '<div class="empty-state"><h3>No media available</h3><p>Be the first to upload!</p></div>';
                return;
            }
            
            data.photos.forEach(photo => {
                grid.appendChild(createPhotoCard(photo));
            });
            
            if (data.pagination.page < data.pagination.totalPages) {
                loadMoreBtn.style.display = 'block';
                currentPage = page;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (error) {
        loading.textContent = 'Error loading media';
        console.error(error);
    }
}

async function loadConsumerPhotos(page = 1, category = 'all') {
    const grid = document.getElementById('consumerPhotosGrid');
    const loading = document.getElementById('consumerLoadingIndicator');
    
    if (page === 1) {
        grid.innerHTML = '';
        loading.style.display = 'block';
    }
    
    try {
        const categoryParam = category ? `&category=${category}` : '';
        const res = await fetch(`${API_BASE}/photos?page=${page}&limit=12${categoryParam}`);
        const data = await res.json();
        
        if (res.ok) {
            loading.style.display = 'none';
            
            if (data.photos.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>No media available yet</h3><p>Check back soon for amazing media from creators!</p></div>';
                return;
            }
            
            data.photos.forEach((photo) => {
                const card = createPhotoCard(photo);
                grid.appendChild(card);
            });
        }
    } catch (error) {
        loading.style.display = 'none';
        grid.innerHTML = '<div class="error-message show">Error loading media. Please try again.</div>';
        console.error(error);
    }
}

function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    
    const locationHtml = photo.location ? `<div class="photo-card-meta">📍 ${escapeHtml(photo.location)}</div>` : '';
    const avgRating = photo.avg_rating ? parseFloat(photo.avg_rating).toFixed(1) : 'N/A';
    const mediaType = photo.media_type || 'photo';
    const typeIcon = mediaType === 'video' ? '🎥' : '📷';
    
    let mediaHtml = '';
    if (mediaType === 'video') {
        const mimeType = photo.mime_type || 'video/mp4';
        mediaHtml = `
            <div class="media-container">
                <video class="media-preview" preload="metadata" muted>
                    <source src="${photo.file_path}" type="${mimeType}">
                    Your browser does not support the video tag.
                </video>
                <div class="play-overlay">▶</div>
            </div>
        `;
    } else {
        mediaHtml = `<img src="${photo.file_path}" alt="${escapeHtml(photo.title)}" class="media-preview" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">`;
    }
    
    card.innerHTML = `
        ${mediaHtml}
        <div class="photo-card-content">
            <div class="photo-card-title">${typeIcon} ${escapeHtml(photo.title)}</div>
            <div class="photo-card-meta">by ${escapeHtml(photo.creator_username)}</div>
            ${locationHtml}
            <div class="photo-card-stats">
                <span>⭐ ${avgRating}</span>
                <span>💬 ${photo.comment_count || 0}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showPhotoDetail(photo.id));
    
    return card;
}

async function showPhotoDetail(photoId) {
    const modal = document.getElementById('photoDetailModal');
    const content = document.getElementById('photoDetailContent');
    content.innerHTML = '<div class="loading">Loading...</div>';
    modal.style.display = 'block';
    modal.classList.add('show');
    
    try {
        const [photoRes, commentsRes, ratingsRes] = await Promise.all([
            fetch(`${API_BASE}/photos/${photoId}`),
            fetch(`${API_BASE}/comments/photo/${photoId}`),
            fetch(`${API_BASE}/ratings/photo/${photoId}`)
        ]);
        
        const photoData = await photoRes.json();
        const commentsData = await commentsRes.json();
        const ratingsData = await ratingsRes.json();
        
        if (photoRes.ok) {
            const photo = photoData.photo;
            const comments = commentsData.comments || [];
            const stats = ratingsData.stats || { average: 0, count: 0 };
            
            let userRating = null;
            if (currentUser) {
                try {
                    const userRatingRes = await fetch(`${API_BASE}/ratings/photo/${photoId}/user`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (userRatingRes.ok) {
                        const userRatingData = await userRatingRes.json();
                        userRating = userRatingData.rating;
                    }
                } catch (e) {}
            }
            
            const mediaType = photo.media_type || 'photo';
            const captionHtml = photo.caption ? `<p><strong>Caption:</strong> ${escapeHtml(photo.caption)}</p>` : '';
            const locationHtml = photo.location ? `<p><strong>Location:</strong> ${escapeHtml(photo.location)}</p>` : '';
            const peopleHtml = photo.people ? `<p><strong>People:</strong> ${escapeHtml(photo.people)}</p>` : '';
            
            let mediaElement = '';
            if (mediaType === 'video') {
                mediaElement = `<video src="${photo.file_path}" controls class="photo-detail-image"></video>`;
            } else {
                mediaElement = `<img src="${photo.file_path}" alt="${escapeHtml(photo.title)}" class="photo-detail-image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">`;
            }
            
            let ratingSection = '';
            let commentSection = '';
            
            if (currentUser && currentUser.role === 'consumer') {
                const stars = [1,2,3,4,5].map(i => {
                    const active = userRating && userRating.rating >= i ? 'active' : '';
                    return `<span class="star ${active}" data-rating="${i}">⭐</span>`;
                }).join('');
                
                const deleteRatingBtn = userRating ? `<button class="btn btn-danger" onclick="deleteRating('${photoId}')">Remove Rating</button>` : '';
                
                ratingSection = `
                    <div class="rating-section">
                        <h4>Rate this ${mediaType}:</h4>
                        <div class="rating-stars" id="ratingStars">${stars}</div>
                        <div class="rating-display">
                            <span>Average: ${stats.average.toFixed(1)} ⭐ (${stats.count} ratings)</span>
                            ${deleteRatingBtn}
                        </div>
                    </div>
                `;
                
                const commentsHtml = comments.map(c => `
                    <div class="comment">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHtml(c.username)}</span>
                            <span class="comment-date">${new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <div class="comment-content">${escapeHtml(c.content)}</div>
                    </div>
                `).join('');
                
                commentSection = `
                    <div class="comments-section">
                        <h4>Comments (${comments.length}):</h4>
                        <div id="commentsList">${commentsHtml}</div>
                        <form class="comment-form" onsubmit="addComment(event, '${photoId}')">
                            <textarea id="commentText" placeholder="Add a comment..." required></textarea>
                            <button type="submit" class="btn btn-primary">Post Comment</button>
                        </form>
                    </div>
                `;
            } else {
                ratingSection = `
                    <div class="rating-section">
                        <div class="rating-display">
                            <span>Average: ${stats.average.toFixed(1)} ⭐ (${stats.count} ratings)</span>
                        </div>
                    </div>
                `;
                
                const commentsHtml = comments.map(c => `
                    <div class="comment">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHtml(c.username)}</span>
                            <span class="comment-date">${new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <div class="comment-content">${escapeHtml(c.content)}</div>
                    </div>
                `).join('');
                
                commentSection = `
                    <div class="comments-section">
                        <h4>Comments (${comments.length}):</h4>
                        <div id="commentsList">${commentsHtml}</div>
                    </div>
                `;
            }
            
            content.innerHTML = `
                <div class="photo-detail">
                    <div>
                        ${mediaElement}
                    </div>
                    <div class="photo-detail-info">
                        <h3>${escapeHtml(photo.title)}</h3>
                        <div class="photo-detail-meta">
                            <p><strong>Creator:</strong> ${escapeHtml(photo.creator_username)}</p>
                            <p><strong>Type:</strong> ${mediaType === 'video' ? 'Video' : 'Photo'}</p>
                            ${captionHtml}
                            ${locationHtml}
                            ${peopleHtml}
                            <p><strong>Uploaded:</strong> ${new Date(photo.created_at).toLocaleDateString()}</p>
                        </div>
                        ${ratingSection}
                        ${commentSection}
                    </div>
                </div>
            `;
            
            if (currentUser && currentUser.role === 'consumer') {
                document.querySelectorAll('#ratingStars .star').forEach(star => {
                    star.addEventListener('click', () => {
                        const rating = parseInt(star.dataset.rating);
                        submitRating(photoId, rating);
                    });
                });
            }
        }
    } catch (error) {
        content.innerHTML = '<div class="error-message">Error loading photo details</div>';
        console.error(error);
    }
}

async function submitRating(photoId, rating) {
    if (!currentUser) return;
    
    try {
        const res = await fetch(`${API_BASE}/ratings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ photo_id: photoId, rating })
        });
        
        if (res.ok) {
            showPhotoDetail(photoId);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
    }
}

async function deleteRating(photoId) {
    if (!currentUser) return;
    
    try {
        const res = await fetch(`${API_BASE}/ratings/photo/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (res.ok) {
            showPhotoDetail(photoId);
        }
    } catch (error) {
        console.error('Error deleting rating:', error);
    }
}

async function addComment(e, photoId) {
    e.preventDefault();
    const content = document.getElementById('commentText').value;
    
    if (!content.trim()) return;
    
    try {
        const res = await fetch(`${API_BASE}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ photo_id: photoId, content })
        });
        
        if (res.ok) {
            document.getElementById('commentText').value = '';
            showPhotoDetail(photoId);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

async function handleUpload(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('uploadError');
    const successDiv = document.getElementById('uploadSuccess');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    const formData = new FormData();
    formData.append('photo', document.getElementById('photoFile').files[0]);
    formData.append('title', document.getElementById('photoTitle').value);
    formData.append('caption', document.getElementById('photoCaption').value);
    formData.append('location', document.getElementById('photoLocation').value);
    formData.append('people', document.getElementById('photoPeople').value);
    
    try {
        const res = await fetch(`${API_BASE}/photos/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await res.json();
        
        if (res.ok) {
            const fileInput = document.getElementById('photoFile');
            const file = fileInput.files[0];
            const isVideo = file && file.type.startsWith('video/');
            successDiv.textContent = isVideo ? 'Video uploaded successfully!' : 'Photo uploaded successfully!';
            successDiv.style.display = 'block';
            successDiv.classList.add('show');
            errorDiv.classList.remove('show');
            document.getElementById('uploadForm').reset();
            setTimeout(() => {
                loadMyPhotos();
            }, 500);
        } else {
            errorDiv.textContent = data.error || 'Upload failed';
            errorDiv.style.display = 'block';
            errorDiv.classList.add('show');
            successDiv.classList.remove('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function loadMyPhotos() {
    if (!currentUser || currentUser.role !== 'creator') return;
    
    const grid = document.getElementById('myPhotosGrid');
    grid.innerHTML = '<div class="loading">Loading your photos...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/photos/creator/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await res.json();
        
        if (res.ok) {
            grid.innerHTML = '';
            if (data.photos.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>No photos yet</h3><p>Upload your first photo!</p></div>';
            } else {
                data.photos.forEach(photo => {
                    const card = createPhotoCard(photo);
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-danger';
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.style.marginTop = '0.5rem';
                    deleteBtn.onclick = () => deletePhoto(photo.id);
                    card.querySelector('.photo-card-content').appendChild(deleteBtn);
                    grid.appendChild(card);
                });
            }
        }
    } catch (error) {
        grid.innerHTML = '<div class="error-message">Error loading photos</div>';
    }
}

async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/photos/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (res.ok) {
            loadMyPhotos();
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
    }
}

async function handleSearch() {
    const query = document.getElementById('searchQuery').value;
    const location = document.getElementById('searchLocation').value;
    const creator = document.getElementById('searchCreator').value;
    const results = document.getElementById('searchResults');
    const loading = document.getElementById('searchLoading');
    
    results.innerHTML = '';
    loading.style.display = 'block';
    
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    if (creator) params.append('creator', creator);
    
    try {
        const res = await fetch(`${API_BASE}/search?${params.toString()}`);
        const data = await res.json();
        
        loading.style.display = 'none';
        
        if (res.ok) {
            if (data.photos.length === 0) {
                results.innerHTML = '<div class="empty-state"><h3>No results found</h3><p>Try different search terms</p></div>';
            } else {
                data.photos.forEach(photo => {
                    results.appendChild(createPhotoCard(photo));
                });
            }
        }
    } catch (error) {
        loading.textContent = 'Error searching';
        console.error(error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

