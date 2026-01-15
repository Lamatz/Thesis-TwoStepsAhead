
document.addEventListener("DOMContentLoaded", function () {
    const mainNavbar = document.querySelector('#mainNavbar');
    const body = document.querySelector('body');

    // --- 1. Dynamic Padding Function ---
    // This ensures the body's top padding always matches the navbar's height.
    const setBodyPadding = () => {
        const navbarHeight = mainNavbar.offsetHeight;
        body.style.paddingTop = `${navbarHeight}px`;
    };

    // Set padding on initial load
    setBodyPadding();

    // Recalculate padding if the window is resized
    window.addEventListener('resize', setBodyPadding);


    // --- 2. Hide Navbar on Scroll Function ---
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
        // Always show navbar if at the very top of the page
        if (window.scrollY <= 0) {
            mainNavbar.classList.remove("navbar--hidden");
            return;
        }

        // Hide when scrolling down, show when scrolling up
        if (lastScrollY < window.scrollY) {
            mainNavbar.classList.add("navbar--hidden");
        } else {
            mainNavbar.classList.remove("navbar--hidden");
        }

        lastScrollY = window.scrollY;
    });
});