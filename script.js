// WallMatch - Clean & Modular
console.log('WallMatch loaded');

// Use 127.0.0.1 to match Live Server's hostname
const API_URL = 'http://127.0.0.1:5000/api';

// Prevent form submission
document.addEventListener('submit', (e) => {
    e.preventDefault();
    return false;
}, true);

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
    initializeApp();
});

function initializeApp() {
    // Image upload preview
    document.getElementById('wallImage').addEventListener('change', handleImageUpload);

    // Category selection
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => selectCategory(card));
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => selectColor(btn));
    });

    // Submit button
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', handleReset);
}

// Handle image upload preview
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('wallPreview').src = event.target.result;
            document.getElementById('wallPreview').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Handle category selection
function selectCategory(card) {
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    document.getElementById('categoryInput').value = card.dataset.category;
}

// Handle color selection
function selectColor(btn) {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('colorInput').value = btn.dataset.color;
}

// Validate form data
function validateForm(wallImage, category, color) {
    if (!wallImage) {
        alert('Please upload a wall image');
        return false;
    }
    if (!category) {
        alert('Please select a category');
        return false;
    }
    if (!color) {
        alert('Please select a color');
        return false;
    }
    return true;
}

// Convert image file to base64
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Call the API
async function callMatchAPI(imageBase64, category, color) {
    const requestData = {
        wall_image: imageBase64,
        category: category,
        budget: 5000,  // Default budget value
        color: color
    };

    console.log('Calling API with:', {
        category,
        color,
        imageSize: (imageBase64.length / 1024 / 1024).toFixed(2) + ' MB'
    });

    console.log('Fetch starting...');

    try {
        const response = await fetch(`${API_URL}/match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData),
            mode: 'cors'
        });

        console.log('Fetch completed!');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        console.log('Parsing JSON response...');
        const data = await response.json();
        console.log('Response JSON parsed successfully');
        console.log('Response data keys:', Object.keys(data));
        console.log('Response has success:', data.success);
        console.log('Response has artworks:', !!data.artworks);
        console.log('Response has composite_image:', !!data.composite_image);
        return data;

    } catch (fetchError) {
        console.error('Fetch error caught:', fetchError);
        console.error('Error name:', fetchError.name);
        console.error('Error message:', fetchError.message);
        throw fetchError;
    }
}

// Loading message rotation
let loadingMessageInterval = null;
const loadingMessages = [
    'Finding best Wall art',
    'AI is attaching best artwork to your wall'
];
let currentMessageIndex = 0;

// Show UI loading state with rotating messages
function showLoading() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    document.getElementById('artMatchForm').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    // Set initial message
    const loadingText = document.querySelector('#loading p');
    currentMessageIndex = 0;
    loadingText.textContent = loadingMessages[currentMessageIndex] + '...';

    // Start rotating messages every 3 seconds
    loadingMessageInterval = setInterval(() => {
        currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
        loadingText.textContent = loadingMessages[currentMessageIndex] + '...';
    }, 3000);
}

// Hide UI loading state
function hideLoading() {
    // Clear the message rotation interval
    if (loadingMessageInterval) {
        clearInterval(loadingMessageInterval);
        loadingMessageInterval = null;
    }

    document.getElementById('loading').style.display = 'none';

    // Update button to show completion
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Process Done';
}

// Reset UI to form state
function resetToForm() {
    const submitBtn = document.getElementById('submitBtn');

    // Clear the message rotation interval if it exists
    if (loadingMessageInterval) {
        clearInterval(loadingMessageInterval);
        loadingMessageInterval = null;
    }

    hideLoading();
    document.getElementById('artMatchForm').style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Find Perfect Art';
}

// Main submit handler
async function handleSubmit() {
    console.log('Submit clicked');

    // Get form values
    const wallImage = document.getElementById('wallImage').files[0];
    const category = document.getElementById('categoryInput').value;
    const color = document.getElementById('colorInput').value;

    // Validate
    if (!validateForm(wallImage, category, color)) {
        return;
    }

    // Show loading
    showLoading();

    try {
        // Convert image to base64
        console.log('Converting image to base64...');
        const base64Image = await convertImageToBase64(wallImage);
        console.log('Image converted successfully');

        // Check image size
        if (base64Image.length > 10 * 1024 * 1024) {
            throw new Error('Image is too large. Please use an image smaller than 5MB.');
        }

        // Call API
        console.log('Calling API...');
        const data = await callMatchAPI(base64Image, category, color);
        console.log('API response received:', data);

        // Hide loading
        hideLoading();

        // Display results
        displayResults(data);

    } catch (error) {
        console.error('Error:', error);
        handleError(error);
        resetToForm();
    }
}

// Handle errors
function handleError(error) {
    let errorMessage = 'Failed to load artworks. ';

    if (error.name === 'AbortError') {
        errorMessage = 'Request timeout. Please try with a smaller image.';
    } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Is the backend running?';
    } else if (error.message.includes('too large')) {
        errorMessage = error.message;
    } else {
        errorMessage += error.message;
    }

    alert(errorMessage);
}

// Display results
function displayResults(data) {
    console.log('Displaying results');

    // Hide form sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');

    // Show results section
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';

    // Clear previous results
    resultsSection.innerHTML = '';

    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Your Matched Artworks';
    resultsSection.appendChild(title);

    // Display artworks first
    displayArtworks(data.artworks, resultsSection);

    // Display composite image below artworks
    displayCompositeImage(data.composite_image, resultsSection);

    // Add reset button at the end
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.id = 'resetBtn';
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = 'Try Another Wall';
    resetBtn.addEventListener('click', handleReset);
    resultsSection.appendChild(resetBtn);

    console.log('Results displayed');
}

// Display composite image with download button
function displayCompositeImage(compositeImage, container) {
    const compositeContainer = document.createElement('div');
    compositeContainer.className = 'composite-container';

    if (compositeImage) {
        const imageData = compositeImage.startsWith('data:image')
            ? compositeImage
            : `data:image/png;base64,${compositeImage}`;

        compositeContainer.innerHTML = `
            <h3>🎨 AI-Generated Preview: Your Wall with Selected Artwork</h3>
            <div class="composite-wrapper">
                <img src="${imageData}"
                     alt="Wall preview"
                     class="composite-image"
                     id="generatedImage">
                <button class="download-btn" onclick="downloadImage()">
                    📥 Download Image
                </button>
            </div>
        `;
    } else {
        compositeContainer.innerHTML = '<p style="color:#666;">Preview not available</p>';
    }

    container.appendChild(compositeContainer);
}

// Download generated image
function downloadImage() {
    const img = document.getElementById('generatedImage');
    if (!img || !img.src) {
        alert('No image to download');
        return;
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `wallmatch-preview-${Date.now()}.jpg`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Image download initiated');
}

// Display artworks list
function displayArtworks(artworks, container) {
    const artworksList = document.createElement('div');
    artworksList.className = 'artworks-list';
    artworksList.id = 'artworksList';

    if (artworks && artworks.length > 0) {
        artworksList.innerHTML = artworks.map(artwork => `
            <div class="artwork-card">
                <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-image">
                <div class="artwork-info">
                    <h3>${artwork.title}</h3>
                    <p><strong>Artist:</strong> ${artwork.artist || 'Unknown'}</p>
                    <p><strong>Year:</strong> ${artwork.year || 'N/A'}</p>
                    <p><strong>Medium:</strong> ${artwork.medium || 'N/A'}</p>
                    <p class="artwork-price">$${parseFloat(artwork.price || 0).toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    } else {
        artworksList.innerHTML = '<p>No artworks found</p>';
    }

    container.appendChild(artworksList);
}

// Reset form
function handleReset() {
    console.log('Resetting form');

    // Reset form
    document.getElementById('artMatchForm').reset();
    document.getElementById('categoryInput').value = '';
    document.getElementById('colorInput').value = '';

    // Reset image
    document.getElementById('wallPreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';

    // Clear selections
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));

    // Show form, hide results
    document.querySelectorAll('.section').forEach(s => s.style.display = 'block');
    document.getElementById('artMatchForm').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    // Reset button
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').textContent = 'Find Perfect Art';

    console.log('Reset complete');
}

console.log('Script ready');
