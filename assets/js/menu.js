document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const closeMenu = document.getElementById("close-menu");

    // 🔹 Verificar si los elementos existen antes de continuar
    if (!menuToggle || !sidebar || !closeMenu) {
        console.warn("⚠️ No se encontraron elementos del menú en esta página. Verifica si existen en el HTML.");
        return;
    }

    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = "block";
            closeMenu.style.display = "none"; // 🔹 Se oculta el botón de cerrar al inicio
            sidebar.classList.add("mobile-mode");
        } else {
            menuToggle.style.display = "none";
            closeMenu.style.display = "none";
            sidebar.classList.remove("mobile-mode");
            sidebar.classList.remove("show");
        }
    }

    menuToggle.addEventListener("click", function () {
        sidebar.classList.add("show");
        menuToggle.style.display = "none"; // 🔹 Oculta el botón ☰ cuando el menú se abre
        closeMenu.style.display = "block"; // 🔹 Muestra el botón ✖
    });

    closeMenu.addEventListener("click", function () {
        sidebar.classList.remove("show");
        closeMenu.style.display = "none"; // 🔹 Oculta el botón ✖ cuando el menú se cierra
        menuToggle.style.display = "block"; // 🔹 Vuelve a mostrar el botón ☰
    });

    document.addEventListener("click", function (event) {
        if (window.innerWidth <= 768 && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove("show");
            closeMenu.style.display = "none"; // 🔹 Oculta el botón ✖
            menuToggle.style.display = "block"; // 🔹 Muestra el botón ☰ nuevamente
        }
    });

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
});
