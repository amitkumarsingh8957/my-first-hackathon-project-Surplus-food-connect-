// Main JavaScript for Surplus Food Connect

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus();
    
    // Initialize all functionality
    initDonorForm();
    initReceiverRequests();
    initFilterButtons();
    initModals();
    initLoginForm();
    initRegisterForm();
    
    // Load foods for receiver if on receiver page
    if (document.querySelector('.food-listings')) {
        loadFoodsForReceiver();
        startRealTimeUpdates();
    }
    
    // Load posted foods for donor if on donor page and authenticated
    if (document.querySelector('.posted-items') && isLoggedIn()) {
        loadPostedFoodsForDonor();
        startDonorRealTimeUpdates();
    }
    
    // Add sample data for testing (only if no data exists)
    addSampleDataIfEmpty();
    
    console.log('Surplus Food Connect - Frontend Prototype Loaded');
});

// Add sample data for testing
function addSampleDataIfEmpty() {
    const foods = getFoodsFromStorage();
    if (foods.length === 0) {
        const sampleFoods = [
            {
                id: Date.now() - 1000,
                foodName: "Vegetable Biryani",
                quantity: "25 servings",
                location: "Downtown Community Center, Main Street",
                expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
                foodType: "Cooked Meal",
                additionalInfo: "Freshly prepared with seasonal vegetables. Contains nuts.",
                status: 'available',
                postedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                donor: 'Sample Restaurant'
            },
            {
                id: Date.now() - 2000,
                foodName: "Fresh Fruit Platter",
                quantity: "50 pieces",
                location: "Green Market, Park Avenue",
                expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
                foodType: "Fresh Produce",
                additionalInfo: "Assorted seasonal fruits - apples, oranges, bananas",
                status: 'available',
                postedDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                donor: 'Local Grocery Store'
            },
            {
                id: Date.now() - 3000,
                foodName: "Sandwich Assortment",
                quantity: "30 pieces",
                location: "City Hall Cafeteria, Central Plaza",
                expiryTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
                foodType: "Packaged Food",
                additionalInfo: "Various sandwiches - turkey, ham, vegetarian options available",
                status: 'available',
                postedDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                donor: 'Office Catering Co.'
            }
        ];
        
        sampleFoods.forEach(food => saveFoodToStorage(food));
        console.log('Sample food data added for testing');
    }
}

// Donor Form Submission
function initDonorForm() {
    const donorForm = document.getElementById('foodDonationForm');
    
    if (donorForm) {
        donorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const foodName = document.getElementById('foodName').value;
            const quantity = document.getElementById('quantity').value;
            const quantityUnit = document.getElementById('quantityUnit').value;
            const location = document.getElementById('location').value;
            const expiryTime = document.getElementById('expiryTime').value;
            const foodType = document.getElementById('foodType').value;
            const additionalInfo = document.getElementById('additionalInfo').value;
            
            // Validate form
            if (!foodName || !quantity || !location || !expiryTime) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create food object
            const currentUser = getCurrentUser();
            const foodItem = {
                id: Date.now(), // unique ID
                foodName,
                quantity: quantity + ' ' + quantityUnit,
                location,
                expiryTime,
                foodType,
                additionalInfo,
                status: 'available',
                postedDate: new Date().toISOString(),
                donor: currentUser ? currentUser.username : 'Anonymous Donor' // Use current user
            };
            
            // Save to localStorage
            saveFoodToStorage(foodItem);
            
            // Show success modal
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.style.display = 'flex';
            } else {
                // Fallback alert if modal doesn't exist
                alert('Food posted successfully!');
            }
            
            // Reset form
            donorForm.reset();
            
            // Reload posted foods
            loadPostedFoodsForDonor();
        });
    }
}

// Simulate adding a new posted item (for demo only)
function simulateNewPostedItem(foodItem) {
    const postedItemsContainer = document.querySelector('.posted-items');
    
    if (postedItemsContainer) {
        // Create a new food card element
        const newFoodCard = document.createElement('div');
        newFoodCard.className = 'food-card';
        
        // Format the date for display
        const expiryDate = new Date(foodItem.expiryTime);
        const formattedTime = expiryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const formattedDate = expiryDate.toLocaleDateString();
        
        newFoodCard.innerHTML = `
            <div class="food-card-header">
                <h4>${foodItem.foodName}</h4>
                <span class="badge available">Available</span>
            </div>
            <div class="food-card-details">
                <p><i class="fas fa-weight"></i> <strong>Quantity:</strong> ${foodItem.quantity}</p>
                <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${foodItem.location}</p>
                <p><i class="fas fa-clock"></i> <strong>Pickup By:</strong> ${formattedDate}, ${formattedTime}</p>
                <p><i class="fas fa-tag"></i> <strong>Type:</strong> ${foodItem.foodType}</p>
            </div>
            <div class="food-card-footer">
                <p><i class="fas fa-calendar"></i> Posted: Just now</p>
            </div>
        `;
        
        // Add the new card at the beginning
        postedItemsContainer.insertBefore(newFoodCard, postedItemsContainer.firstChild);
        
        // Show a temporary notification
        showNotification('New food item added to your posted items!');
    }
}

// Save food to localStorage
function saveFoodToStorage(foodItem) {
    const foods = getFoodsFromStorage();
    foods.push(foodItem);
    localStorage.setItem('surplusFoods', JSON.stringify(foods));
}

// Get foods from localStorage
function getFoodsFromStorage() {
    const foods = localStorage.getItem('surplusFoods');
    return foods ? JSON.parse(foods) : [];
}

// Update food status in localStorage
function updateFoodStatus(foodId, newStatus) {
    const foods = getFoodsFromStorage();
    const food = foods.find(f => f.id == foodId);
    if (food) {
        food.status = newStatus;
        localStorage.setItem('surplusFoods', JSON.stringify(foods));
    }
}

// Load foods for receiver dashboard
function loadFoodsForReceiver() {
    const foodListings = document.querySelector('.food-listings');
    if (!foodListings) return;
    
    const foods = getFoodsFromStorage();
    
    // Clear existing listings
    foodListings.innerHTML = '';
    
    if (foods.length === 0) {
        foodListings.innerHTML = '<p>No food donations available at the moment.</p>';
        return;
    }
    
    // Add each food as a card
    foods.forEach(food => {
        const foodCard = createFoodCard(food);
        foodListings.appendChild(foodCard);
    });
}

// Load posted foods for donor dashboard
function loadPostedFoodsForDonor() {
    const postedItemsContainer = document.querySelector('.posted-items');
    if (!postedItemsContainer) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const allFoods = getFoodsFromStorage();
    const userFoods = allFoods.filter(food => food.donor === currentUser.username);
    
    // Clear existing items
    postedItemsContainer.innerHTML = '';
    
    if (userFoods.length === 0) {
        postedItemsContainer.innerHTML = '<p>You haven\'t posted any food yet.</p>';
        return;
    }
    
    // Add each food as a card
    userFoods.forEach(food => {
        const foodCard = createPostedFoodCard(food);
        postedItemsContainer.appendChild(foodCard);
    });
}

// Real-time updates for receiver dashboard
function startRealTimeUpdates() {
    if (document.querySelector('.food-listings')) {
        // Listen for localStorage changes (works across tabs)
        window.addEventListener('storage', function(e) {
            if (e.key === 'surplusFoods') {
                loadFoodsForReceiver();
                showNotification('Food donations updated!');
            }
        });
        
        // Also poll as backup (every 5 seconds)
        setInterval(() => {
            loadFoodsForReceiver();
        }, 5000);
    }
}

// Real-time updates for donor dashboard
function startDonorRealTimeUpdates() {
    if (document.querySelector('.posted-items')) {
        // Listen for localStorage changes
        window.addEventListener('storage', function(e) {
            if (e.key === 'surplusFoods') {
                loadPostedFoodsForDonor();
                showNotification('Your food status updated!');
            }
        });
        
        // Also poll as backup (every 5 seconds)
        setInterval(() => {
            loadPostedFoodsForDonor();
        }, 5000);
    }
}

// Create food card for receiver dashboard
function createFoodCard(food) {
    const card = document.createElement('div');
    card.className = 'food-card';
    
    const expiryDate = new Date(food.expiryTime);
    const formattedTime = expiryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const formattedDate = expiryDate.toLocaleDateString();
    
    card.innerHTML = `
        <div class="food-card-header">
            <h4>${food.foodName}</h4>
            <span class="badge ${food.status === 'available' ? 'available' : 'requested'}">${food.status === 'available' ? 'Available' : 'Requested'}</span>
        </div>
        <div class="food-card-details">
            <p><i class="fas fa-weight"></i> <strong>Quantity:</strong> ${food.quantity}</p>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${food.location}</p>
            <p><i class="fas fa-clock"></i> <strong>Pickup By:</strong> ${formattedDate}, ${formattedTime}</p>
            <p><i class="fas fa-tag"></i> <strong>Type:</strong> ${food.foodType}</p>
            ${food.additionalInfo ? `<p><i class="fas fa-info-circle"></i> <strong>Notes:</strong> ${food.additionalInfo}</p>` : ''}
        </div>
        <div class="food-card-actions">
            ${food.status === 'available' ? 
                `<button class="btn btn-request" data-food-id="${food.id}">
                    <i class="fas fa-hand-paper"></i> Request Food
                </button>` :
                `<button class="btn btn-requested" disabled>
                    <i class="fas fa-check"></i> Already Requested
                </button>`
            }
        </div>
    `;
    
    return card;
}

// Create posted food card for donor
function createPostedFoodCard(food) {
    const card = document.createElement('div');
    card.className = 'food-card';
    
    const expiryDate = new Date(food.expiryTime);
    const formattedTime = expiryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const formattedDate = expiryDate.toLocaleDateString();
    
    card.innerHTML = `
        <div class="food-card-header">
            <h4>${food.foodName}</h4>
            <span class="badge ${food.status === 'available' ? 'available' : 'requested'}">${food.status === 'available' ? 'Available' : 'Requested'}</span>
        </div>
        <div class="food-card-details">
            <p><i class="fas fa-weight"></i> <strong>Quantity:</strong> ${food.quantity}</p>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${food.location}</p>
            <p><i class="fas fa-clock"></i> <strong>Pickup By:</strong> ${formattedDate}, ${formattedTime}</p>
            <p><i class="fas fa-tag"></i> <strong>Type:</strong> ${food.foodType}</p>
        </div>
        <div class="food-card-footer">
            <p><i class="fas fa-calendar"></i> Posted: ${new Date(food.postedDate).toLocaleDateString()}</p>
        </div>
    `;
    
    return card;
}

// Initialize receiver food request buttons
function initReceiverRequests() {
    // For dynamic content, use event delegation
    document.addEventListener('click', function(e) {
        if (e.target.closest('button[data-food-id]')) {
            const button = e.target.closest('button[data-food-id]');
            if (button.disabled) return; // Don't process if already requested
            
            const foodCard = button.closest('.food-card');
            const foodName = foodCard.querySelector('h4').textContent;
            const badge = foodCard.querySelector('.badge');
            const foodId = button.getAttribute('data-food-id');
            
            // Change button state
            button.innerHTML = '<i class="fas fa-check"></i> Requested';
            button.classList.remove('btn-request');
            button.classList.add('btn-requested');
            button.disabled = true;
            
            // Update badge
            badge.textContent = 'Requested';
            badge.classList.remove('available');
            badge.classList.add('requested');
            
            // Update data-status attribute for filtering
            foodCard.setAttribute('data-status', 'requested');
            
            // Update localStorage
            updateFoodStatus(foodId, 'requested');
            
            // Show confirmation modal
            const requestModal = document.getElementById('requestModal');
            const modalFoodName = document.getElementById('modalFoodName');
            
            if (requestModal && modalFoodName) {
                modalFoodName.textContent = `You have requested: ${foodName}`;
                requestModal.style.display = 'flex';
            } else {
                // Fallback alert
                alert(`You have requested: ${foodName}. The donor will contact you to coordinate pickup.`);
            }
            
            // Show notification
            showNotification(`Request sent for ${foodName}`);
        }
    });
}

// Initialize filter buttons on receiver dashboard
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Filter food cards - re-query since content is dynamic
            const foodCards = document.querySelectorAll('.food-card');
            foodCards.forEach(card => {
                const status = card.getAttribute('data-status');
                
                if (filter === 'all' || 
                    (filter === 'available' && status === 'available') ||
                    (filter === 'requested' && status === 'requested') ||
                    (filter === 'nearby' && status === 'available')) { // Simplified nearby filter
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Show notification
            if (filter === 'nearby') {
                showNotification('Showing food donations within 5 miles');
            }
        });
    });
}

// Initialize modal functionality
function initModals() {
    // Success modal (donor page)
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModal');
    
    if (successModal && closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            successModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
    }
    
    // Request modal (receiver page)
    const requestModal = document.getElementById('requestModal');
    const closeRequestModalBtn = document.getElementById('closeRequestModal');
    
    if (requestModal && closeRequestModalBtn) {
        closeRequestModalBtn.addEventListener('click', function() {
            requestModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === requestModal) {
                requestModal.style.display = 'none';
            }
        });
    }
}

// Show temporary notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--primary-green);
        color: white;
        padding: 15px 25px;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        z-index: 1001;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Utility function to format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Simulate loading animation (optional)
function simulateLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 1500);
}

// Authentication Functions
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const userType = document.getElementById('userType').value;
            
            if (!username || !password || !userType) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simple authentication (in real app, this would be server-side)
            loginUser(username, userType);
            
            // Redirect is handled in loginUser function
        });
    }
    
    // Register link
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            const registerModal = document.getElementById('registerModal');
            if (registerModal) {
                registerModal.style.display = 'flex';
            }
        });
    }
}

function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    const cancelBtn = document.getElementById('cancelRegister');
    const registerModal = document.getElementById('registerModal');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const userType = document.getElementById('regUserType').value;
            
            if (!username || !password || !userType) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simple registration (store in localStorage)
            registerUser(username, password, userType);
            
            // Auto login
            loginUser(username, userType);
            
            // Close modal and redirect (redirect handled in loginUser)
            registerModal.style.display = 'none';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            registerModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    if (registerModal) {
        window.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
            }
        });
    }
}

function loginUser(username, userType) {
    const user = {
        username: username,
        userType: userType,
        loggedIn: true,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Check if there's an intended page
    const intendedPage = localStorage.getItem('intendedPage');
    if (intendedPage) {
        localStorage.removeItem('intendedPage');
        window.location.href = intendedPage;
    } else {
        // Default redirect based on user type
        if (userType === 'donor') {
            window.location.href = 'donor.html';
        } else {
            window.location.href = 'receiver.html';
        }
    }
}

function registerUser(username, password, userType) {
    // In a real app, this would be sent to server
    // For demo, just store locally
    const users = getUsersFromStorage();
    users.push({ username, password, userType });
    localStorage.setItem('registeredUsers', JSON.stringify(users));
}

function getUsersFromStorage() {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function isLoggedIn() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).loggedIn : false;
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function checkAuthStatus() {
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['donor.html', 'receiver.html'];
    
    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        // Store the intended page
        localStorage.setItem('intendedPage', currentPage);
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Update navigation based on auth status
    updateNavigation();
}

function updateNavigation() {
    const user = getCurrentUser();
    const navLinks = document.querySelector('.nav-links');

    if (user && navLinks) {
        // Add logout button
        const logoutLi = document.createElement('li');
        logoutLi.innerHTML = `<a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout (${user.username})</a>`;
        navLinks.appendChild(logoutLi);

        // Add logout event listener
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update active link
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// Contact Form Handling
function initContactForm() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const formObject = {};

            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            // Simulate form submission (in a real app, this would send to a server)
            console.log('Contact form submitted:', formObject);

            // Show success message
            showContactSuccess();

            // Reset form
            this.reset();
        });
    }
}

function showContactSuccess() {
    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'contact-success';
    successMessage.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
            animation: slideIn 0.3s ease;
        ">
            <i class="fas fa-check-circle"></i> Thank you! Your message has been sent successfully.
        </div>
    `;

    document.body.appendChild(successMessage);

    // Remove message after 5 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 5000);
}

// Initialize new functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization code...
    checkAuthStatus();
    initDonorForm();
    initReceiverRequests();
    initFilterButtons();
    initModals();
    initLoginForm();
    initRegisterForm();

    // Load foods for receiver if on receiver page and authenticated
    if (document.querySelector('.food-listings') && isLoggedIn()) {
        loadFoodsForReceiver();
        startRealTimeUpdates();
    }

    // Load posted foods for donor if on donor page and authenticated
    if (document.querySelector('.posted-items') && isLoggedIn()) {
        loadPostedFoodsForDonor();
        startDonorRealTimeUpdates();
    }

    // New functionality for home page
    initSmoothScrolling();
    initContactForm();

    console.log('Surplus Food Connect - Frontend Prototype Loaded');
});

// Add CSS animation for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);