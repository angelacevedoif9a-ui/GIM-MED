/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("consulta-form");
    const list = document.getElementById("medication-list");
    let medicationNumber = 0;

    /** Coordina la operación addMedication de la interfaz de médico. */
    function addMedication() {
        medicationNumber += 1;
        const card = document.createElement("section");
        card.className = "medication-card";
        card.innerHTML = `<h4>Medicamento ${medicationNumber}</h4>${medicationNumber > 1 ? '<button type="button" class="remove-medication">×</button>' : ''}<div class="grid three"><label>Medicamento y presentación *<input name="medicamento_${medicationNumber}" required></label><label>Dosis de este medicamento *<input name="dosis_${medicationNumber}" required></label><label>Frecuencia *<input name="frecuencia_${medicationNumber}" required></label><label>Vía *<select name="via_${medicationNumber}" required><option value="">Seleccione</option><option>Oral</option><option>Intravenosa</option><option>Intramuscular</option><option>Inhalatoria</option><option>Tópica</option><option>Otra</option></select></label><label>Duración *<input name="duracion_${medicationNumber}" required></label><label>Indicación específica<input name="indicacion_${medicationNumber}"></label></div>`;
        card.querySelector(".remove-medication")?.addEventListener("click", () => card.remove());
        list.appendChild(card);
    }

    addMedication();
    document.getElementById("add-medication").addEventListener("click", addMedication);
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="consulta"] [data-patient-search]'), patient => GIMMED.activateForm(form, patient, "consulta"));
    form.addEventListener("submit", event => {
        event.preventDefault();
        GIMMED.postForm(form, "/api/consulta", data => {
            const medications = [];
            list.querySelectorAll(".medication-card").forEach(card => {
                const number = card.querySelector("input[name^='medicamento_']").name.split("_")[1];
                medications.push({ nombre: data[`medicamento_${number}`], dosis: data[`dosis_${number}`], frecuencia: data[`frecuencia_${number}`], via: data[`via_${number}`], duracion: data[`duracion_${number}`], indicacion: data[`indicacion_${number}`] });
            });
            data.medicamentos = medications;
            return data;
        });
    });
});
