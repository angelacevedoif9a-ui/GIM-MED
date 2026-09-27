/* Código de la interfaz de administrador, tarea inventario. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  GIMMEDCrud.init({
    active: "inventario", collection: "inventory", title: "Inventario farmacéutico",
    description: "Controle existencias, lotes, vencimientos, costos y responsables. Sincronizado con Farmacia.", singular: "producto", unique: ["code", "lot"],
    fields: [
      { key: "code", label: "Código del producto" }, { key: "medicine", label: "Medicamento / insumo" },
      { key: "presentation", label: "Presentación" }, { key: "lot", label: "Número de lote" },
      { key: "stock", label: "Existencia", type: "number" }, { key: "minimum", label: "Stock mínimo", type: "number" },
      { key: "cost", label: "Costo unitario (C$)", type: "number", step: "0.01" },
      { key: "expiration", label: "Fecha de vencimiento", type: "date" }, { key: "location", label: "Ubicación" }, { key: "supplier", label: "Proveedor" },
      { key: "responsible", label: "Responsable" }, { key: "status", label: "Estado", type: "select", options: ["Disponible", "Stock bajo", "Agotado", "Vencido"] }
    ],
    columns: [
      { key: "code", label: "Código" }, { key: "medicine", label: "Producto" }, { key: "lot", label: "Lote" },
      { key: "stock", label: "Existencia" }, { key: "expiration", label: "Vencimiento" },
      { key: "cost", label: "Costo", money: true }, { key: "status", label: "Estado" }
    ],
    save: (medication) => GIMMED.saveSharedMedication(medication),
    remove: (medication) => GIMMED.deleteSharedMedication(medication),
    sync: () => GIMMED.syncInventory(),
    syncEvent: "gimmed:inventory-synced",
  });
});
