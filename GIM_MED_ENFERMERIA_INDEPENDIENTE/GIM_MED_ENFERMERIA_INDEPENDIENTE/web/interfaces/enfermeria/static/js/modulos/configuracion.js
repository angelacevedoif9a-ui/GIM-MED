/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("gimmed-theme") || "light";
  document.documentElement.dataset.theme = savedTheme;
  $$("[data-theme-choice]").forEach((button) => {
    button.classList.toggle(
      "selected",
      button.dataset.themeChoice === savedTheme,
    );
    button.addEventListener("click", () => {
      document.documentElement.dataset.theme = button.dataset.themeChoice;
      localStorage.setItem("gimmed-theme", button.dataset.themeChoice);
      $$("[data-theme-choice]").forEach((item) =>
        item.classList.toggle("selected", item === button),
      );
    });
  });
  setTimeout(() => {
    if (!currentProfile) return;
    const form = $("#profileForm");
    Object.entries(currentProfile).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
  }, 200);
});
$("#profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    currentProfile = await api("/api/perfil", {
      method: "PUT",
      body: JSON.stringify(
        Object.fromEntries(new FormData(event.currentTarget)),
      ),
    });
    renderChrome();
    toast("Perfil actualizado correctamente.");
  } catch (error) {
    toast(error.message);
  }
});
$("#photoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    toast("Usa una imagen JPG, PNG o WEBP.");
    return;
  }
  if (file.size > 1048576) {
    toast("La fotografía no debe superar 1 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      await api("/api/perfil/foto", {
        method: "PUT",
        body: JSON.stringify({ foto: reader.result }),
      });
      currentProfile.foto = reader.result;
      renderChrome();
      toast("Fotografía actualizada.");
    } catch (error) {
      toast(error.message);
    }
  };
  reader.readAsDataURL(file);
});
$("#passwordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const result = await api("/api/perfil/password", {
      method: "PUT",
      body: JSON.stringify(
        Object.fromEntries(new FormData(event.currentTarget)),
      ),
    });
    event.currentTarget.reset();
    toast(result.message);
  } catch (error) {
    toast(error.message);
  }
});
