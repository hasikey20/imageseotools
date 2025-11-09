document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const imageUpload = document.getElementById('image-upload');
    const previewContainer = document.getElementById('preview-container');
    const generateBtn = document.getElementById('generate-btn');
    const platformPreset = document.getElementById('platform-preset');
    const customPrompt = document.getElementById('custom-prompt');
    
    const resultsContainer = document.getElementById('results-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultContent = document.getElementById('result-content');
    
    const resultTitle = document.getElementById('result-title');
    const resultKeywords = document.getElementById('result-keywords');
    const resultDescription = document.getElementById('result-description');

    let uploadedFiles = [];

    // Event Listeners for Drag and Drop
    uploadArea.addEventListener('click', () => imageUpload.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-blue-500');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-blue-500');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-blue-500');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
    imageUpload.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // File handling and preview function
    function handleFiles(files) {
        // For this version, we'll focus on a single image first
        // to keep it simple. Batch processing can be an upgrade.
        if (files.length > 0) {
            uploadedFiles = [files[0]]; // Take only the first file
            displayPreviews();
        }
    }

    function displayPreviews() {
        previewContainer.innerHTML = ''; // Clear existing previews
        uploadedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewElement = document.createElement('div');
                previewElement.classList.add('relative', 'w-full', 'h-24', 'overflow-hidden', 'rounded-lg');
                previewElement.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
                previewContainer.appendChild(previewElement);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Generate button click handler
    generateBtn.addEventListener('click', async () => {
        if (uploadedFiles.length === 0) {
            alert('Please upload an image first.');
            return;
        }

        // Show loading state
        resultsContainer.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        resultContent.classList.add('hidden');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            const file = uploadedFiles[0];
            const base64Image = await toBase64(file);
            
            const response = await fetch('/api/generate-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64Image,
                    platform: platformPreset.value,
                    prompt: customPrompt.value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong');
            }
            
            const data = await response.json();

            // Display results
            resultTitle.value = data.title || '';
            resultKeywords.value = data.keywords || '';
            resultDescription.value = data.description || '';

        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            // Hide loading state and show results
            loadingSpinner.classList.add('hidden');
            resultContent.classList.remove('hidden');
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Metadata';
        }
    });

    // Helper function to convert file to Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
});

// Global copy function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    // Optional: Show a "Copied!" notification
    alert('Copied to clipboard!');
}
