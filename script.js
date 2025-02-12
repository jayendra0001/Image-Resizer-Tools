document.addEventListener("DOMContentLoaded", () => {
    // Initialize elements
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const resizeBtn = document.getElementById("resizeBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const originalImage = document.getElementById("originalImage");
    const resizedImage = document.getElementById("resizedImage");
    const widthInput = document.getElementById("width");
    const heightInput = document.getElementById("height");
    const maintainAspectRatio = document.getElementById("maintainAspectRatio");
    const header = document.querySelector("header");
    const sections = document.querySelectorAll("section");

    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 0;
    let isProcessing = false;

    // Mobile Menu
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const nav = document.querySelector("nav ul");
    const navLinks = document.querySelectorAll("nav ul li a");
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        nav.classList.toggle("active");
        mobileMenuBtn.textContent = isMenuOpen ? "✕" : "☰";
        document.body.style.overflow = isMenuOpen ? "hidden" : "";
    }

    mobileMenuBtn.addEventListener("click", toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (isMenuOpen) toggleMenu();
        });
    });

    document.addEventListener("click", (e) => {
        if (isMenuOpen && !e.target.closest("nav") && !e.target.closest(".mobile-menu-btn")) {
            toggleMenu();
        }
    });

    // Scroll Animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.classList.add("hidden");
        sectionObserver.observe(section);
    });

    // Header Scroll Effect
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    // Smooth Scroll Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Parallax Effect
    function initParallax(element) {
        const speed = element.dataset.parallax || 0.5;
        let ticking = false;

        window.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const yPos = -(window.pageYOffset * speed);
                    element.style.transform = `translate3d(0, ${yPos}px, 0)`;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    sections.forEach(section => {
        if (section.hasAttribute("data-parallax")) {
            initParallax(section);
        }
    });

    // Image Upload Handling
    function showLoading() {
        if (!dropZone.querySelector(".loading")) {
            const loading = document.createElement("div");
            loading.className = "loading";
            dropZone.appendChild(loading);
        }
        isProcessing = true;
        resizeBtn.disabled = true;
    }

    function hideLoading() {
        const loading = dropZone.querySelector(".loading");
        if (loading) loading.remove();
        isProcessing = false;
        resizeBtn.disabled = false;
    }

    function updateImageInfo(file) {
        const imageInfo = document.querySelector(".image-info");
        if (imageInfo) {
            const size = (file.size / 1024).toFixed(2);
            imageInfo.textContent = `${file.name} - ${size}KB`;
        }
    }

    function handleFileUpload(files) {
        if (isProcessing) return;

        const file = files[0];
        if (!file || !file.type.startsWith("image/")) {
            showNotification("Please upload an image file", "error");
            return;
        }

        showLoading();
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalWidth = img.width;
                originalHeight = img.height;
                aspectRatio = originalWidth / originalHeight;

                // Update inputs with original dimensions
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;

                // Display original image
                originalImage.src = e.target.result;
                originalImage.classList.remove("hidden");
                originalImage.classList.add("visible");

                updateImageInfo(file);
                hideLoading();
                showNotification("Image uploaded successfully!", "success");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Dimension Input Handling
    function updateDimensions(source, value) {
        if (!maintainAspectRatio.checked) return;

        if (source === 'width') {
            const newWidth = parseInt(value);
            if (!isNaN(newWidth)) {
                heightInput.value = Math.round(newWidth / aspectRatio);
            }
        } else {
            const newHeight = parseInt(value);
            if (!isNaN(newHeight)) {
                widthInput.value = Math.round(newHeight * aspectRatio);
            }
        }
    }

    widthInput.addEventListener("input", (e) => updateDimensions('width', e.target.value));
    heightInput.addEventListener("input", (e) => updateDimensions('height', e.target.value));

    // Drag and Drop Handling
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
    });

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add("dragover");
    }

    function unhighlight() {
        dropZone.classList.remove("dragover");
    }

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("drop", (e) => handleFileUpload(e.dataTransfer.files));
    fileInput.addEventListener("change", (e) => handleFileUpload(e.target.files));

    // Image Resizing
    resizeBtn.addEventListener("click", () => {
        if (isProcessing || !originalImage.src) return;

        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);

        if (!width || !height) {
            showNotification("Please enter valid dimensions", "error");
            return;
        }

        showLoading();

        setTimeout(() => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                canvas.width = width;
                canvas.height = height;

                // Use better image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                ctx.drawImage(originalImage, 0, 0, width, height);

                resizedImage.src = canvas.toDataURL("image/png");
                resizedImage.classList.remove("hidden");
                resizedImage.classList.add("visible");

                downloadBtn.href = canvas.toDataURL("image/png");
                downloadBtn.download = "resized-image.png";
                downloadBtn.classList.remove("hidden");

                const originalSize = (originalImage.src.length * 3/4) / 1024;
                const newSize = (resizedImage.src.length * 3/4) / 1024;
                showNotification(`Image resized successfully! Size reduced from ${originalSize.toFixed(2)}KB to ${newSize.toFixed(2)}KB`, "success");
            } catch (error) {
                showNotification("Error resizing image. Please try again.", "error");
            } finally {
                hideLoading();
            }
        }, 500);
    });

    // Notification System
    function showNotification(message, type = "success") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add("show"), 100);

        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Button Hover Effects
    document.querySelectorAll(".cta").forEach(button => {
        button.addEventListener("mouseover", function() {
            this.style.transform = "translateY(-3px)";
        });

        button.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
        });
    });
});
