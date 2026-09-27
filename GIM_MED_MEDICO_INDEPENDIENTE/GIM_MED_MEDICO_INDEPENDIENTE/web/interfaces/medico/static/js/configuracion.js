/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const profileForm = document.getElementById("profile-form");
    const passwordForm = document.getElementById("password-form");
    const avatarInput = document.getElementById("avatar-input");
    const preview = document.getElementById("profile-preview");

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.classList.toggle("active", button.dataset.themeChoice === document.documentElement.dataset.theme);
        button.addEventListener("click", () => {
            document.documentElement.dataset.theme = button.dataset.themeChoice;
            localStorage.setItem("gimmed-theme", button.dataset.themeChoice);
            document.querySelectorAll("[data-theme-choice]").forEach(item => item.classList.toggle("active", item === button));
        });
    });

    avatarInput.addEventListener("change", () => {
        const file = avatarInput.files[0];
        if (!file) return;
        if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) || file.size > 1024 * 1024) {
            GIMMED.toast("La fotografía debe ser JPG, PNG o WEBP y no superar 1 MB.", "error"); avatarInput.value = ""; return;
        }
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Vista previa">`;
    });

    profileForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!GIMMED.validate(profileForm)) return;
        try {
            const data = await GIMMED.fetchJSON("/api/configuracion/perfil", { method: "POST", body: new FormData(profileForm) });
            GIMMED.toast(data.message);
        } catch (error) { GIMMED.toast(error.message, "error"); }
    });

    passwordForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!GIMMED.validate(passwordForm)) return;
        try {
            const data = await GIMMED.fetchJSON("/api/configuracion/contrasena", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(GIMMED.formObject(passwordForm)) });
            passwordForm.reset(); GIMMED.toast(data.message);
        } catch (error) { GIMMED.toast(error.message, "error"); }
    });
});
