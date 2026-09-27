/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
const vitalsForm = $("#vitalsForm");
/** Calcula los valores de la interfaz de enfermería. */
function calculateBmi() {
  const weight = Number($("#weightInput").value);
  const height = Number($("#heightInput").value) / 100;
  $("#bmiInput").value =
    weight > 0 && height > 0 ? (weight / (height * height)).toFixed(1) : "";
}
$("#weightInput").addEventListener("input", calculateBmi);
$("#heightInput").addEventListener("input", calculateBmi);
$("#painInput").addEventListener(
  "input",
  (event) => ($("#painValue").textContent = event.target.value),
);
$("#oxygenToggle").addEventListener("change", (event) => {
  $("#oxygenFlow").hidden = !event.target.checked;
  $("#oxygenFlow input").required = event.target.checked;
  if (!event.target.checked) $("#oxygenFlow input").value = "";
});
vitalsForm.addEventListener("reset", () =>
  setTimeout(() => {
    $("#bmiInput").value = "";
    $("#painValue").textContent = "0";
    $("#oxygenFlow").hidden = true;
    $("#oxygenFlow input").required = false;
  }, 0),
);
vitalsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSimpleClinicalForm(event.currentTarget);
});
