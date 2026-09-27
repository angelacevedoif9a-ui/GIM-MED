/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("backup-now")?.addEventListener("click", async () => {
        const result = await GIMMED.backup(false);
        if (result) document.getElementById("backup-title").textContent = `Último respaldo: ${GIMMED.formatDate(new Date().toISOString())}`;
    });
});
