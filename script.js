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

// Global state to store multiple selections
const selectedCategories = new Set();
const selectedColors = new Set();

function initializeApp() {
    // Image upload preview
    document.getElementById('wallImage').addEventListener('change', handleImageUpload);

    // Make upload area clickable
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('wallImage').click();
    });

    // Category selection - multiple
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => toggleCategory(card));
    });

    // Color selection - multiple
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleColor(btn));
    });

    // Submit button
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
}

// Handle image upload preview
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('wallPreview');
            const placeholder = document.getElementById('uploadPlaceholder');

            preview.src = event.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// Handle category selection - multiple selection
function toggleCategory(card) {
    const category = card.dataset.category;

    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
        card.classList.remove('selected');
    } else {
        selectedCategories.add(category);
        card.classList.add('selected');
    }

    // Update hidden input with comma-separated values
    document.getElementById('categoryInput').value = Array.from(selectedCategories).join(',');
    console.log('Selected categories:', Array.from(selectedCategories));
}

// Handle color selection - multiple selection
function toggleColor(btn) {
    const color = btn.dataset.color;

    if (selectedColors.has(color)) {
        selectedColors.delete(color);
        btn.classList.remove('selected');
    } else {
        selectedColors.add(color);
        btn.classList.add('selected');
    }

    // Update hidden input with comma-separated values
    document.getElementById('colorInput').value = Array.from(selectedColors).join(',');
    console.log('Selected colors:', Array.from(selectedColors));
}

// Validate form data
function validateForm(wallImage, categories, colors) {
    if (!wallImage) {
        alert('Please upload a wall image');
        return false;
    }
    if (!categories || categories.length === 0) {
        alert('Please select at least one category');
        return false;
    }
    if (!colors || colors.length === 0) {
        alert('Please select at least one color');
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
async function callMatchAPI(imageBase64, categories, colors) {
    const requestData = {
        wall_image: imageBase64,
        categories: categories,  // Array of categories
        budget: 5000,  // Default budget value
        colors: colors  // Array of colors
    };

    console.log('Calling API with:', {
        categories,
        colors,
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
    const categories = Array.from(selectedCategories);
    const colors = Array.from(selectedColors);

    // Validate
    if (!validateForm(wallImage, categories, colors)) {
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
        const data = await callMatchAPI(base64Image, categories, colors);
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
    resetBtn.onclick = handleReset;  // Use onclick for dynamically created button
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
    console.log('Resetting form - returning to home page');

    // Clear selected sets
    selectedCategories.clear();
    selectedColors.clear();

    // Reset form
    const form = document.getElementById('artMatchForm');
    form.reset();
    document.getElementById('categoryInput').value = '';
    document.getElementById('colorInput').value = '';

    // Reset file input
    document.getElementById('wallImage').value = '';

    // Reset image preview
    const preview = document.getElementById('wallPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    preview.src = '';
    preview.classList.add('hidden');
    placeholder.classList.remove('hidden');

    // Clear selections visually
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));

    // Show the form
    form.style.display = 'block';

    // Show all form sections
    document.querySelectorAll('.section').forEach(s => {
        s.style.display = 'block';
        s.classList.remove('hidden');
    });

    // Hide results section completely
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'none';
    resultsSection.classList.add('hidden');
    resultsSection.innerHTML = ''; // Clear results content

    // Reset and show submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Find Perfect Artworks';
    submitBtn.style.display = 'block';

    // Hide loading if visible
    document.getElementById('loading').style.display = 'none';

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('Reset complete - returned to home page');
}

console.log('Script ready');
