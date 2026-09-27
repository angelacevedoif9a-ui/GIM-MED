/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
// Módulo Notificaciones: carga alertas y permite marcarlas como leídas.
/** Consulta y prepara datos de la interfaz de enfermería. */
async function loadNotifications() {
  try {
    const items = await api("/api/notificaciones");
    const unread = items.filter((item) => !item.leida).length;
    $("#badge").textContent = unread;
    $("#topBadge").textContent = unread;
    $("#notificationList").innerHTML =
      items
        .map(
          (item) =>
            `<article class="notification ${item.leida ? "read" : ""}"><div><b>${item.titulo}</b><p>${item.mensaje}</p></div><button data-read="${item.id}">${item.leida ? "Leída" : "Marcar como leída"}</button></article>`,
        )
        .join("") ||
      '<div class="record-result empty">No hay notificaciones pendientes.</div>';
    $$("[data-read]").forEach((button) =>
      button.addEventListener("click", async () => {
        await api(`/api/notificaciones/${button.dataset.read}/leer`, {
          method: "PUT",
          body: "{}",
        });
        loadNotifications();
      }),
    );
  } catch (error) {
    toast(error.message);
  }
}

document.addEventListener("DOMContentLoaded", loadNotifications);
