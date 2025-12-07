// Copyright (c) 2025, Meghwin Dave and contributors
// For license information, please see license.txt

frappe.ui.form.on("Packing Configuration", {
    // run when form is loaded
    refresh: function(frm) {
        update_name(frm);
    },
    brand: function(frm) {
        update_name(frm);
    },
    cartoon_type: function(frm) {
        update_name(frm);
    }
});
function update_name(frm) {
    let brand = frm.doc.brand || "";
    let carton = frm.doc.cartoon_type || "";
    let name = "";

    if (brand && carton)  name = brand + " – " + carton;
    else if (brand)       name = brand;
    else if (carton)      name = carton;

    frm.set_value("configuration_name", name);
}