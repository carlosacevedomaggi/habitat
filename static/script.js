// Wait for DOM to be fully loaded before executing scripts
document.addEventListener('DOMContentLoaded', function () {
    // Initialize alert close functionality
    document.querySelectorAll('.close-alert').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });

    /**
     * Initialize and manage all map functionality
     * Handles both property detail maps and properties list maps
     */
    const initMaps = () => {
        // Clean up any existing map instances to prevent memory leaks
        if (window.propertyMap) {
            window.propertyMap.remove();
        }

        // Initialize single property detail map
        const detailMap = document.getElementById('map');
        if (detailMap && !document.querySelector('.properties-grid')) {
            try {
                // Get property coordinates from data attributes
                const propertyLat = detailMap.dataset.latitude;
                const propertyLng = detailMap.dataset.longitude;

                if (propertyLat && propertyLng) {
                    // Create new map instance
                    const map = L.map('map', {
                        zoomControl: true,
                        scrollWheelZoom: true
                    });
                    window.propertyMap = map;

                    // Set map view to property location
                    map.setView([parseFloat(propertyLat), parseFloat(propertyLng)], 15);
                    
                    // Add marker for property location
                    L.marker([parseFloat(propertyLat), parseFloat(propertyLng)]).addTo(map);

                    // Add OpenStreetMap tile layer
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);

                    // Force map to recalculate its container size
                    setTimeout(() => map.invalidateSize(), 200);
                }
            } catch (error) {
                // Handle map initialization errors gracefully
                console.error('Error initializing detail map:', error);
                detailMap.innerHTML = '<p class="map-error">Error loading map. Please refresh the page.</p>';
            }
        }

        // Initialize properties list map with multiple markers
        const propertiesMap = document.getElementById('map');
        if (propertiesMap && document.querySelector('.properties-grid')) {
            try {
                // Create new map instance centered on Caracas
                const map = L.map('map', {
                    center: [10.4806, -66.9036],
                    zoom: 12
                });
                window.propertyMap = map;

                // Add OpenStreetMap tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                // Get all property cards and prepare for marker creation
                const propertyCards = document.querySelectorAll('.property-card');
                const markers = [];
                let hasValidCoordinates = false;

                // Create markers for each property
                propertyCards.forEach(card => {
                    const lat = parseFloat(card.dataset.latitude);
                    const lng = parseFloat(card.dataset.longitude);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        hasValidCoordinates = true;
                        const marker = L.marker([lat, lng]);

                        // Get property details for popup
                        const titleEl = card.querySelector('h3');
                        const priceEl = card.querySelector('.badge-price');
                        const imageEl = card.querySelector('.property-image img');
                        const linkEl = card.querySelector('.btn-primary');

                        // Create popup only if all required elements exist
                        if (titleEl && priceEl && imageEl && linkEl) {
                            const title = titleEl.textContent;
                            const price = priceEl.textContent;
                            const image = imageEl.src;
                            const link = linkEl.href;

                            // Create custom popup HTML
                            const popupContent = `
                                <div class="map-popup">
                                    <img src="${image}" alt="${title}" style="width:100%;height:150px;object-fit:cover;">
                                    <h4>${title}</h4>
                                    <div class="price">${price}</div>
                                    <a href="${link}" class="map-popup-link">Ver Detalles</a>
                                </div>
                            `;
                            
                            // Bind popup to marker and add to map
                            marker.bindPopup(popupContent);
                            marker.addTo(map);
                            markers.push(marker);

                            // Add hover interactions between cards and markers
                            card.addEventListener('mouseenter', () => marker.openPopup());
                            card.addEventListener('mouseleave', () => marker.closePopup());
                        }
                    }
                });

                // Fit map bounds to show all markers if we have valid coordinates
                if (hasValidCoordinates && markers.length > 0) {
                    const group = L.featureGroup(markers);
                    map.fitBounds(group.getBounds(), { padding: [50, 50] });
                }

                // Force map to recalculate its container size
                setTimeout(() => map.invalidateSize(), 200);
            } catch (error) {
                // Handle map initialization errors gracefully
                console.error('Error initializing properties map:', error);
                propertiesMap.innerHTML = '<p class="map-error">Error loading map. Please refresh the page.</p>';
            }
        }
    };

    // Initialize maps with a slight delay to ensure container sizes are calculated correctly
    setTimeout(initMaps, 200);

    // Initialize property image slideshow if it exists
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (slideshowContainer) {
        let slideIndex = 0;
        const slides = document.querySelectorAll('.slide');
        
        // Function to cycle through slides
        function showSlides() {
            if (slides.length === 0) return;
            
            // Hide all slides
            slides.forEach(slide => (slide.style.display = 'none'));
            
            // Move to next slide
            slideIndex++;
            if (slideIndex > slides.length) slideIndex = 1;
            
            // Show current slide
            slides[slideIndex - 1].style.display = 'block';
            
            // Set timer for next slide
            setTimeout(showSlides, 3000);
        }
        
        // Start the slideshow
        showSlides();
    }
});
