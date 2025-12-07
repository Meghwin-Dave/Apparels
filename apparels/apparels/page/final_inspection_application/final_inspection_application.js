frappe.pages['final-inspection-application'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Final Inspection Application',
		single_column: true
	});

	// Clear default content
	page.main.html('');
	
	// Add custom HTML
	$(frappe.render_template('final_inspection_application', {})).appendTo(page.main);
	
	// Initialize the application
	new FinalInspectionApp(page);
}

class FinalInspectionApp {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.main);
		this.currentInspectionId = null;
		this.sizeWiseData = [];
		this.defects = [];
		this.checklistData = {
			generalRequirements: {},
			fabricReadiness: {},
			compliance: {},
			workmanship: {},
			packaging: {},
			colorAppearance: {}
		};
		
		this.handleImageErrors();
		this.initializeChecklists();
		this.setup_form_handlers();
		this.setupAQLCalculations();
		this.load_data();
	}

	handleImageErrors() {
		// Handle broken images gracefully
		this.wrapper.find('img').on('error', function() {
			$(this).hide();
		});
	}

	initializeChecklists() {
		// General Requirements Checklist
		const generalRequirements = [
			'Workmanship area cleanliness',
			'Lighting availability',
			'Inspection table condition',
			'Measuring tape availability',
			'Size set availability',
			'Caliper for footwear availability',
			'Weight scale availability',
			'Equipment calibration status',
			'Sealed samples available',
			'Approved samples available',
			'Packaging samples available',
			'BOM available',
			'Techpack available'
		];

		// Fabric / Material Readiness
		const fabricReadiness = [
			'Fabric/model verification',
			'Correct material lot',
			'Color approval status',
			'Print verification',
			'Embroidery verification',
			'Heat-transfer verification'
		];

		// Compliance
		const compliance = [
			'Needle policy compliance',
			'Metal-free zone (footwear)',
			'Chemical compliance documents',
			'Child safety compliance'
		];

		// Workmanship Quality
		const workmanship = [
			'Stitch quality',
			'Seam alignment',
			'Labels & trims',
			'Handfeel & material defects',
			'Symmetry & shape evaluation',
			'Print durability rub test',
			'Adhesion test (footwear)',
			'Flexing test (footwear)'
		];

		// Packaging
		const packaging = [
			'Folding method',
			'Polybag quality & warnings',
			'Barcode verification',
			'Size strip',
			'Carton quality & GSM',
			'Packing assortment accuracy'
		];

		// Color / Appearance
		const colorAppearance = [
			'Shade matching',
			'Panel shade consistency',
			'Symmetry (left/right for footwear)',
			'Color fastness verification'
		];

		this.renderChecklist('generalRequirementsChecklist', generalRequirements);
		this.renderChecklist('fabricReadinessChecklist', fabricReadiness);
		this.renderChecklist('complianceChecklist', compliance);
		this.renderChecklist('workmanshipChecklist', workmanship);
		this.renderChecklist('packagingChecklist', packaging);
		this.renderChecklist('colorAppearanceChecklist', colorAppearance);
	}

	renderChecklist(containerId, items) {
		const container = this.wrapper.find(`#${containerId}`);
		container.empty();

		items.forEach(item => {
			const itemKey = item.toLowerCase().replace(/[^a-z0-9]/g, '_');
			const checklistItem = $(`
				<div class="checklist-item">
					<label>${item}</label>
					<select class="form-control checklist-status" data-item="${itemKey}">
						<option value="N/A">N/A</option>
						<option value="OK">OK</option>
						<option value="NOT OK">NOT OK</option>
					</select>
					<input type="text" class="form-control checklist-remarks" data-item="${itemKey}" placeholder="Add remarks...">
				</div>
			`);
			container.append(checklistItem);

			// Store initial state
			if (containerId.includes('generalRequirements')) {
				this.checklistData.generalRequirements[itemKey] = { status: 'N/A', remarks: '' };
			} else if (containerId.includes('fabricReadiness')) {
				this.checklistData.fabricReadiness[itemKey] = { status: 'N/A', remarks: '' };
			} else if (containerId.includes('compliance')) {
				this.checklistData.compliance[itemKey] = { status: 'N/A', remarks: '' };
			} else if (containerId.includes('workmanship')) {
				this.checklistData.workmanship[itemKey] = { status: 'N/A', remarks: '' };
			} else if (containerId.includes('packaging')) {
				this.checklistData.packaging[itemKey] = { status: 'N/A', remarks: '' };
			} else if (containerId.includes('colorAppearance')) {
				this.checklistData.colorAppearance[itemKey] = { status: 'N/A', remarks: '' };
			}

			// Add change handlers
			checklistItem.find('.checklist-status').on('change', (e) => {
				const status = $(e.target).val();
				const key = $(e.target).data('item');
				if (containerId.includes('generalRequirements')) {
					this.checklistData.generalRequirements[key].status = status;
				} else if (containerId.includes('fabricReadiness')) {
					this.checklistData.fabricReadiness[key].status = status;
				} else if (containerId.includes('compliance')) {
					this.checklistData.compliance[key].status = status;
				} else if (containerId.includes('workmanship')) {
					this.checklistData.workmanship[key].status = status;
				} else if (containerId.includes('packaging')) {
					this.checklistData.packaging[key].status = status;
				} else if (containerId.includes('colorAppearance')) {
					this.checklistData.colorAppearance[key].status = status;
				}
				this.updateChecklistSummary();
			});

			checklistItem.find('.checklist-remarks').on('input', (e) => {
				const remarks = $(e.target).val();
				const key = $(e.target).data('item');
				if (containerId.includes('generalRequirements')) {
					this.checklistData.generalRequirements[key].remarks = remarks;
				} else if (containerId.includes('fabricReadiness')) {
					this.checklistData.fabricReadiness[key].remarks = remarks;
				} else if (containerId.includes('compliance')) {
					this.checklistData.compliance[key].remarks = remarks;
				} else if (containerId.includes('workmanship')) {
					this.checklistData.workmanship[key].remarks = remarks;
				} else if (containerId.includes('packaging')) {
					this.checklistData.packaging[key].remarks = remarks;
				} else if (containerId.includes('colorAppearance')) {
					this.checklistData.colorAppearance[key].remarks = remarks;
				}
			});
		});
	}

	setup_form_handlers() {
		const self = this;
		
		// Set default date
		const today = frappe.datetime.get_today();
		this.wrapper.find('#inspectionDate').val(today);
		this.wrapper.find('#shipmentDate').val(today);

		// Set default inspector name
		this.wrapper.find('#inspectorName').val(frappe.session.user_fullname || frappe.session.user);

		// New Inspection / View List toggle
		this.wrapper.find('#newInspectionBtn').on('click', function() {
			self.wrapper.find('#inspectionFormContainer').show();
			self.wrapper.find('#inspectionListContainer').hide();
			self.resetForm();
		});

		this.wrapper.find('#viewListBtn').on('click', function() {
			self.wrapper.find('#inspectionFormContainer').hide();
			self.wrapper.find('#inspectionListContainer').show();
			self.load_data();
		});

		// Add Size
		this.wrapper.find('#addSizeBtn').on('click', function() {
			self.addSize();
		});

		this.wrapper.find('#sizeInput').on('keypress', function(e) {
			if (e.which === 13) {
				self.addSize();
			}
		});

		// Add Defect
		this.wrapper.find('#addDefectBtn').on('click', function() {
			self.addDefect();
		});

		// Camera/Upload buttons
		this.wrapper.find('#cameraBtn').on('click', function() {
			self.captureImage();
		});

		this.wrapper.find('#uploadBtn').on('click', function() {
			self.uploadImage();
		});

		// Save Inspection
		this.wrapper.find('#saveInspectionBtn').on('click', function() {
			self.saveInspection();
		});

		// Search and filter
		this.wrapper.find('#searchInput').on('input', function() {
			self.filter_table($(this).val());
		});

		this.wrapper.find('#statusFilter').on('change', function() {
			self.filter_by_status($(this).val());
		});

		// Export
		this.wrapper.find('#exportBtn').on('click', function() {
			self.export_data();
		});

		// Total Order Qty change - update AQL
		this.wrapper.find('#totalOrderQty').on('input', function() {
			self.updateAQLCalculations();
		});

		// AQL parameter changes
		this.wrapper.find('#inspectionLevel, #aqlMajor, #aqlMinor, #measurementLevel').on('change', function() {
			self.updateAQLCalculations();
		});
	}

	setupAQLCalculations() {
		this.updateAQLCalculations();
	}

	addSize() {
		const sizeInput = this.wrapper.find('#sizeInput');
		const size = sizeInput.val().trim();

		if (!size) {
			frappe.show_alert({
				message: 'Please enter a size',
				indicator: 'orange'
			});
			return;
		}

		// Check if size already exists
		if (this.sizeWiseData.find(s => s.size === size)) {
			frappe.show_alert({
				message: 'Size already exists',
				indicator: 'orange'
			});
			return;
		}

		// Add new size
		this.sizeWiseData.push({
			size: size,
			orderQty: 0,
			shipQty: 0,
			cartons: 0
		});

		this.renderSizeWiseTable();
		sizeInput.val('');
		sizeInput.focus();
	}

	removeSize(size) {
		this.sizeWiseData = this.sizeWiseData.filter(s => s.size !== size);
		this.renderSizeWiseTable();
		this.updateAQLCalculations();
	}

	renderSizeWiseTable() {
		const tbody = this.wrapper.find('#sizeWiseTableBody');
		tbody.empty();

		let totalOrderQty = 0;
		let totalShipQty = 0;
		let totalCartons = 0;

		this.sizeWiseData.forEach(item => {
			const fulfillment = item.orderQty > 0 ? ((item.shipQty / item.orderQty) * 100).toFixed(2) : 0;
			totalOrderQty += item.orderQty;
			totalShipQty += item.shipQty;
			totalCartons += item.cartons;

			const row = $(`
				<tr>
					<td><input type="text" class="form-control" value="${item.size}" readonly></td>
					<td><input type="number" class="form-control size-order-qty" data-size="${item.size}" value="${item.orderQty}" min="0"></td>
					<td><input type="number" class="form-control size-ship-qty" data-size="${item.size}" value="${item.shipQty}" min="0"></td>
					<td>${fulfillment}%</td>
					<td><input type="number" class="form-control size-cartons" data-size="${item.size}" value="${item.cartons}" min="0"></td>
					<td>
						<button class="btn btn-xs btn-default remove-size-btn" data-size="${item.size}">
							<i class="fa fa-trash"></i>
						</button>
					</td>
				</tr>
			`);

			// Add change handlers
			row.find('.size-order-qty').on('input', (e) => {
				const size = $(e.target).data('size');
				const value = parseInt($(e.target).val()) || 0;
				const item = this.sizeWiseData.find(s => s.size === size);
				if (item) {
					item.orderQty = value;
					this.updateSizeRow(row, item);
					this.updateSummary();
					this.updateAQLCalculations();
				}
			});

			row.find('.size-ship-qty').on('input', (e) => {
				const size = $(e.target).data('size');
				const value = parseInt($(e.target).val()) || 0;
				const item = this.sizeWiseData.find(s => s.size === size);
				if (item) {
					item.shipQty = value;
					this.updateSizeRow(row, item);
					this.updateSummary();
					this.updateAQLCalculations();
				}
			});

			row.find('.size-cartons').on('input', (e) => {
				const size = $(e.target).data('size');
				const value = parseInt($(e.target).val()) || 0;
				const item = this.sizeWiseData.find(s => s.size === size);
				if (item) {
					item.cartons = value;
					this.updateSizeRow(row, item);
					this.updateSummary();
					this.updateAQLCalculations();
				}
			});

			row.find('.remove-size-btn').on('click', () => {
				this.removeSize(item.size);
			});

			tbody.append(row);
		});

		// Add total row
		const totalFulfillment = totalOrderQty > 0 ? ((totalShipQty / totalOrderQty) * 100).toFixed(2) : 0;
		const totalRow = $(`
			<tr class="total-row">
				<td><strong>TOTAL</strong></td>
				<td><strong>${totalOrderQty.toLocaleString()}</strong></td>
				<td><strong>${totalShipQty.toLocaleString()}</strong></td>
				<td><strong>${totalFulfillment}%</strong></td>
				<td><strong>${totalCartons}</strong></td>
				<td></td>
			</tr>
		`);
		tbody.append(totalRow);

		this.updateSummary();
	}

	updateSizeRow(row, item) {
		const fulfillment = item.orderQty > 0 ? ((item.shipQty / item.orderQty) * 100).toFixed(2) : 0;
		row.find('td').eq(3).text(fulfillment + '%');
	}

	updateSummary() {
		let totalOrderQty = 0;
		let totalShipQty = 0;
		let totalCartons = 0;

		this.sizeWiseData.forEach(item => {
			totalOrderQty += item.orderQty;
			totalShipQty += item.shipQty;
			totalCartons += item.cartons;
		});

		const fulfillment = totalOrderQty > 0 ? ((totalShipQty / totalOrderQty) * 100).toFixed(2) : 0;

		this.wrapper.find('#summaryTotalOrder').text(totalOrderQty.toLocaleString());
		this.wrapper.find('#summaryTotalShip').text(totalShipQty.toLocaleString());
		this.wrapper.find('#summaryFulfillment').text(fulfillment + '%');
		this.wrapper.find('#summaryCartons').text(totalCartons);

		// Update total order qty field
		this.wrapper.find('#totalOrderQty').val(totalOrderQty);
	}

	updateAQLCalculations() {
		const totalShipQty = this.sizeWiseData.reduce((sum, item) => sum + item.shipQty, 0);
		const inspectionLevel = this.wrapper.find('#inspectionLevel').val();
		const aqlMajor = parseFloat(this.wrapper.find('#aqlMajor').val());
		const aqlMinor = parseFloat(this.wrapper.find('#aqlMinor').val());
		const measurementLevel = this.wrapper.find('#measurementLevel').val();

		// Calculate sample size based on AQL tables (simplified)
		const sampleSize = this.calculateSampleSize(totalShipQty, inspectionLevel);
		const acMajor = this.calculateAcceptanceNumber(sampleSize, aqlMajor);
		const reMajor = acMajor + 1;
		const acMinor = this.calculateAcceptanceNumber(sampleSize, aqlMinor);
		const reMinor = acMinor + 1;

		// Update UI
		this.wrapper.find('#totalShipmentQty').text(totalShipQty.toLocaleString());
		this.wrapper.find('#sampleSizeRequired').text(sampleSize);
		this.wrapper.find('#sampleSizePercent').text(sampleSize > 0 ? ((sampleSize / totalShipQty) * 100).toFixed(2) + '%' : '0%');
		
		this.wrapper.find('#sampleCode').text(sampleSize > 0 ? this.getSampleCode(sampleSize, inspectionLevel) : '-');
		this.wrapper.find('#acMajor').text(acMajor);
		this.wrapper.find('#reMajor').text(reMajor);
		this.wrapper.find('#acMinor').text(acMinor);
		this.wrapper.find('#reMinor').text(reMinor);

		// Update instructions
		this.updateInspectionInstructions(totalShipQty, sampleSize, acMajor, reMajor, acMinor, reMinor);

		// Update size-wise sample picking guide
		this.updateSizeWiseSampleGuide(totalShipQty, sampleSize, measurementLevel);
	}

	calculateSampleSize(lotSize, inspectionLevel) {
		// Simplified AQL sample size calculation based on ISO 2859-1
		// This is a simplified version - actual AQL tables are more complex
		if (lotSize <= 0) return 0;

		const levelMap = {
			'S-1': 0.5,
			'S-2': 0.7,
			'S-3': 1.0,
			'S-4': 1.5,
			'I': 1.0,
			'II': 1.5,
			'III': 2.0
		};

		const multiplier = levelMap[inspectionLevel] || 1.0;
		let sampleSize;

		if (lotSize <= 50) sampleSize = Math.ceil(8 * multiplier);
		else if (lotSize <= 90) sampleSize = Math.ceil(13 * multiplier);
		else if (lotSize <= 150) sampleSize = Math.ceil(20 * multiplier);
		else if (lotSize <= 280) sampleSize = Math.ceil(32 * multiplier);
		else if (lotSize <= 500) sampleSize = Math.ceil(50 * multiplier);
		else if (lotSize <= 1200) sampleSize = Math.ceil(80 * multiplier);
		else if (lotSize <= 3200) sampleSize = Math.ceil(125 * multiplier);
		else if (lotSize <= 10000) sampleSize = Math.ceil(200 * multiplier);
		else sampleSize = Math.ceil(315 * multiplier);

		return Math.min(sampleSize, lotSize);
	}

	calculateAcceptanceNumber(sampleSize, aql) {
		// Simplified acceptance number calculation
		if (sampleSize === 0 || aql === 0) return 0;
		return Math.floor((sampleSize * aql) / 100);
	}

	getSampleCode(sampleSize, inspectionLevel) {
		// Simplified sample code based on size and level
		return `${inspectionLevel}-${sampleSize}`;
	}

	updateInspectionInstructions(totalShipQty, sampleSize, acMajor, reMajor, acMinor, reMinor) {
		const instructions = [
			`This is a single lot inspection based on total shipment quantity of ${totalShipQty.toLocaleString()} pieces`,
			`Randomly select and inspect ${sampleSize} pieces from the entire shipment (all sizes)`,
			'Ensure representative sampling across all sizes in the shipment',
			'Record defects found against acceptance (AC) and rejection (RE) numbers',
			`If Major defects exceed ${acMajor} OR Minor defects exceed ${acMinor}, the lot fails`
		];

		const list = this.wrapper.find('#inspectionInstructionsList');
		list.empty();
		instructions.forEach(instruction => {
			list.append(`<li>${instruction}</li>`);
		});
	}

	updateSizeWiseSampleGuide(totalShipQty, sampleSize, measurementLevel) {
		const tbody = this.wrapper.find('#sizeWiseSampleTableBody');
		tbody.empty();

		let totalWorkmanship = 0;
		let totalMeasurement = 0;
		let totalCartons = 0;
		let totalCartonsPick = 0;

		this.sizeWiseData.forEach(item => {
			const percentOfTotal = totalShipQty > 0 ? ((item.shipQty / totalShipQty) * 100).toFixed(1) : 0;
			const workmanshipSample = Math.round((item.shipQty / totalShipQty) * sampleSize);
			const measurementSample = this.calculateSampleSize(item.shipQty, measurementLevel);
			const cartonsToPick = Math.ceil(Math.sqrt(totalCartons) * (item.cartons / Math.max(totalCartons, 1)));

			totalWorkmanship += workmanshipSample;
			totalMeasurement += measurementSample;
			totalCartons += item.cartons;
			totalCartonsPick += cartonsToPick;

			const row = $(`
				<tr>
					<td>${item.size}</td>
					<td>${item.shipQty.toLocaleString()}</td>
					<td>${percentOfTotal}%</td>
					<td>${workmanshipSample}</td>
					<td>${measurementSample}</td>
					<td>${item.cartons}</td>
					<td>${cartonsToPick}</td>
				</tr>
			`);
			tbody.append(row);
		});

		// Add total row
		const totalPercent = '100.0%';
		const totalRow = $(`
			<tr class="total-row">
				<td><strong>TOTAL</strong></td>
				<td><strong>${totalShipQty.toLocaleString()}</strong></td>
				<td><strong>${totalPercent}</strong></td>
				<td><strong>${totalWorkmanship}</strong></td>
				<td><strong>${totalMeasurement}</strong></td>
				<td><strong>${totalCartons}</strong></td>
				<td><strong>${totalCartonsPick}</strong></td>
			</tr>
		`);
		tbody.append(totalRow);
	}

	addDefect() {
		const category = this.wrapper.find('#defectCategory').val();
		const description = this.wrapper.find('#defectDescription').val();
		const severity = this.wrapper.find('#defectSeverity').val();
		const quantity = parseInt(this.wrapper.find('#defectQuantity').val()) || 1;
		const panelLocation = this.wrapper.find('#defectPanelLocation').val();
		const sampleNo = this.wrapper.find('#defectSampleNo').val();

		if (!description) {
			frappe.show_alert({
				message: 'Please select a defect description',
				indicator: 'orange'
			});
			return;
		}

		const defect = {
			category: category,
			description: description,
			severity: severity,
			quantity: quantity,
			panelLocation: panelLocation,
			sampleNo: sampleNo,
			attachment: null
		};

		this.defects.push(defect);
		this.renderDefectsTable();
		this.updateDefectSummary();
		this.updateFinalResult();

		// Reset form
		this.wrapper.find('#defectDescription').val('');
		this.wrapper.find('#defectQuantity').val(1);
		this.wrapper.find('#defectPanelLocation').val('');
		this.wrapper.find('#defectSampleNo').val('');
	}

	removeDefect(index) {
		this.defects.splice(index, 1);
		this.renderDefectsTable();
		this.updateDefectSummary();
		this.updateFinalResult();
	}

	renderDefectsTable() {
		const tbody = this.wrapper.find('#defectsTableBody');
		tbody.empty();

		if (this.defects.length === 0) {
			tbody.append('<tr class="empty-row"><td colspan="8" class="text-center text-muted">No defects recorded yet</td></tr>');
			return;
		}

		this.defects.forEach((defect, index) => {
			const severityClass = defect.severity.toLowerCase();
			const row = $(`
				<tr>
					<td>${defect.category}</td>
					<td>${defect.description}</td>
					<td><span class="badge badge-${severityClass}">${defect.severity}</span></td>
					<td>${defect.quantity}</td>
					<td>${defect.panelLocation || '-'}</td>
					<td>${defect.sampleNo || '-'}</td>
					<td>${defect.attachment ? '<i class="fa fa-paperclip"></i>' : '-'}</td>
					<td>
						<button class="btn btn-xs btn-default remove-defect-btn" data-index="${index}">
							<i class="fa fa-trash"></i>
						</button>
					</td>
				</tr>
			`);

			row.find('.remove-defect-btn').on('click', () => {
				this.removeDefect(index);
			});

			tbody.append(row);
		});
	}

	updateDefectSummary() {
		const critical = this.defects.filter(d => d.severity === 'Critical').reduce((sum, d) => sum + d.quantity, 0);
		const major = this.defects.filter(d => d.severity === 'Major').reduce((sum, d) => sum + d.quantity, 0);
		const minor = this.defects.filter(d => d.severity === 'Minor').reduce((sum, d) => sum + d.quantity, 0);

		this.wrapper.find('#criticalDefectsCount').text(critical);
		this.wrapper.find('#majorDefectsCount').text(major);
		this.wrapper.find('#minorDefectsCount').text(minor);

		this.wrapper.find('#criticalDefectsFound').text(critical);
		this.wrapper.find('#majorDefectsFound').text(major);
		this.wrapper.find('#minorDefectsFound').text(minor);
	}

	updateChecklistSummary() {
		// Workmanship
		const workmanshipItems = Object.values(this.checklistData.workmanship);
		const workmanshipPass = workmanshipItems.filter(item => item.status === 'OK').length;
		const workmanshipFail = workmanshipItems.filter(item => item.status === 'NOT OK').length;
		this.wrapper.find('#workmanshipPass').text(`Pass: ${workmanshipPass}`);
		this.wrapper.find('#workmanshipFail').text(`Fail: ${workmanshipFail}`);
		this.wrapper.find('#workmanshipStatus').text(workmanshipFail > 0 ? 'FAIL' : (workmanshipPass > 0 ? 'PASS' : 'N/A'));

		// Packaging
		const packagingItems = Object.values(this.checklistData.packaging);
		const packagingPass = packagingItems.filter(item => item.status === 'OK').length;
		const packagingFail = packagingItems.filter(item => item.status === 'NOT OK').length;
		this.wrapper.find('#packagingPass').text(`Pass: ${packagingPass}`);
		this.wrapper.find('#packagingFail').text(`Fail: ${packagingFail}`);
		this.wrapper.find('#packagingStatus').text(packagingFail > 0 ? 'FAIL' : (packagingPass > 0 ? 'PASS' : 'N/A'));

		// Color / Appearance
		const colorItems = Object.values(this.checklistData.colorAppearance);
		const colorPass = colorItems.filter(item => item.status === 'OK').length;
		const colorFail = colorItems.filter(item => item.status === 'NOT OK').length;
		this.wrapper.find('#colorPass').text(`Pass: ${colorPass}`);
		this.wrapper.find('#colorFail').text(`Fail: ${colorFail}`);
		this.wrapper.find('#colorStatus').text(colorFail > 0 ? 'FAIL' : (colorPass > 0 ? 'PASS' : 'N/A'));
	}

	updateFinalResult() {
		const critical = this.defects.filter(d => d.severity === 'Critical').reduce((sum, d) => sum + d.quantity, 0);
		const major = this.defects.filter(d => d.severity === 'Major').reduce((sum, d) => sum + d.quantity, 0);
		const minor = this.defects.filter(d => d.severity === 'Minor').reduce((sum, d) => sum + d.quantity, 0);

		const sampleSize = parseInt(this.wrapper.find('#sampleSizeRequired').text().replace(/,/g, '')) || 0;
		const acMajor = parseInt(this.wrapper.find('#acMajor').text()) || 0;
		const reMajor = parseInt(this.wrapper.find('#reMajor').text()) || 0;

		let result = 'PASS';
		let resultClass = 'result-pass';

		// Check rules
		if (critical > 0) {
			result = 'FAIL';
			resultClass = 'result-fail';
		} else if (major > acMajor) {
			result = 'FAIL';
			resultClass = 'result-fail';
		} else if (!this.wrapper.find('#packagingCompliance').is(':checked')) {
			result = 'FAIL';
			resultClass = 'result-fail';
		}

		this.wrapper.find('#finalResult').text(result).removeClass('result-pass result-fail').addClass(resultClass);

		// Update major findings and recommendations
		this.updateMajorFindings(critical, major, minor);
		this.updateRecommendations(critical, major, minor, result);
	}

	updateMajorFindings(critical, major, minor) {
		const findings = [];
		if (major > 0) {
			findings.push(`Major defects found: ${major}`);
		}
		if (minor > 0) {
			findings.push(`Minor defects found: ${minor}`);
		}
		if (critical > 0) {
			findings.push(`Critical defects found: ${critical}`);
		}

		const list = this.wrapper.find('#majorFindingsList');
		list.empty();
		findings.forEach(finding => {
			const li = $(`<li><img src="/assets/apparels/images/warning-icon.svg" alt="Warning" class="inline-icon"> ${finding}</li>`);
			li.find('img').on('error', function() { $(this).hide(); });
			list.append(li);
		});
	}

	updateRecommendations(critical, major, minor, result) {
		const recommendations = [];
		if (result === 'FAIL') {
			if (major > 0) {
				recommendations.push('Sort and rework major defects before shipment');
			}
			if (minor > 0) {
				recommendations.push('Review production process to reduce minor defects in future lots');
			}
			if (critical > 0) {
				recommendations.push('CRITICAL: Immediate action required. Do not ship until critical defects are resolved.');
			}
		} else {
			recommendations.push('Inspection passed. Proceed with shipment.');
		}

		const list = this.wrapper.find('#recommendationsList');
		list.empty();
		recommendations.forEach(rec => {
			const li = $(`<li><img src="/assets/apparels/images/info-icon.svg" alt="Info" class="inline-icon"> ${rec}</li>`);
			li.find('img').on('error', function() { $(this).hide(); });
			list.append(li);
		});
	}

	captureImage() {
		// Placeholder for camera functionality
		frappe.show_alert({
			message: 'Camera functionality will be implemented',
			indicator: 'blue'
		});
	}

	uploadImage() {
		// Placeholder for upload functionality
		const input = $('<input type="file" accept="image/*">');
		input.on('change', (e) => {
			const file = e.target.files[0];
			if (file) {
				frappe.show_alert({
					message: 'Image uploaded successfully',
					indicator: 'green'
				});
			}
		});
		input.click();
	}

	resetForm() {
		this.sizeWiseData = [];
		this.defects = [];
		this.currentInspectionId = null;
		
		// Reset all form fields
		this.wrapper.find('input[type="text"], input[type="number"], input[type="date"], textarea').val('');
		this.wrapper.find('select').each(function() {
			$(this).prop('selectedIndex', 0);
		});
		this.wrapper.find('input[type="checkbox"]').prop('checked', false);

		// Reset checklists
		this.initializeChecklists();

		// Reset tables
		this.renderSizeWiseTable();
		this.renderDefectsTable();
		this.updateDefectSummary();
		this.updateFinalResult();
		this.updateAQLCalculations();
	}

	saveInspection() {
		const self = this;
		
		// Validate required fields
		if (!this.wrapper.find('#inspectionDate').val()) {
			frappe.show_alert({
				message: 'Please enter inspection date',
				indicator: 'orange'
			});
			return;
		}

		if (!this.wrapper.find('#inspectionType').val()) {
			frappe.show_alert({
				message: 'Please select inspection type',
				indicator: 'orange'
			});
			return;
		}

		if (!this.wrapper.find('#inspectorName').val()) {
			frappe.show_alert({
				message: 'Please enter inspector name',
				indicator: 'orange'
			});
			return;
		}

		// Collect form data
		const formData = {
			inspection_date: this.wrapper.find('#inspectionDate').val(),
			inspection_type: this.wrapper.find('#inspectionType').val(),
			inspector_name: this.wrapper.find('#inspectorName').val(),
			factory_name: this.wrapper.find('#factoryName').val(),
			factory_address: this.wrapper.find('#factoryAddress').val(),
			production_line: this.wrapper.find('#productionLine').val(),
			factory_contact: this.wrapper.find('#factoryContact').val(),
			brand_buyer: this.wrapper.find('#brandBuyer').val(),
			department: this.wrapper.find('#department').val(),
			product_category: this.wrapper.find('#productCategory').val(),
			style_no: this.wrapper.find('#styleNo').val(),
			article_model_no: this.wrapper.find('#articleModelNo').val(),
			season: this.wrapper.find('#season').val(),
			size_range: this.wrapper.find('#sizeRange').val(),
			colorways: this.wrapper.find('#colorways').val(),
			po_number: this.wrapper.find('#poNumber').val(),
			total_order_qty: parseInt(this.wrapper.find('#totalOrderQty').val()) || 0,
			shipment_date: this.wrapper.find('#shipmentDate').val(),
			packaging_type: this.wrapper.find('#packagingType').val(),
			packaging_compliance: this.wrapper.find('#packagingCompliance').is(':checked'),
			inspection_level: this.wrapper.find('#inspectionLevel').val(),
			aql_major: parseFloat(this.wrapper.find('#aqlMajor').val()),
			aql_minor: parseFloat(this.wrapper.find('#aqlMinor').val()),
			measurement_level: this.wrapper.find('#measurementLevel').val(),
			size_wise_data: this.sizeWiseData,
			defects: this.defects,
			checklist_data: this.checklistData
		};

		// Calculate final result
		const critical = this.defects.filter(d => d.severity === 'Critical').reduce((sum, d) => sum + d.quantity, 0);
		const major = this.defects.filter(d => d.severity === 'Major').reduce((sum, d) => sum + d.quantity, 0);
		const sampleSize = parseInt(this.wrapper.find('#sampleSizeRequired').text().replace(/,/g, '')) || 0;
		const acMajor = parseInt(this.wrapper.find('#acMajor').text()) || 0;

		let status = 'Pass';
		if (critical > 0 || major > acMajor || !formData.packaging_compliance) {
			status = 'Fail';
		}

		formData.status = status;
		formData.critical_defects = critical;
		formData.major_defects = major;
		formData.minor_defects = this.defects.filter(d => d.severity === 'Minor').reduce((sum, d) => sum + d.quantity, 0);
		formData.sample_size = sampleSize;

		// Save to backend
		frappe.call({
			method: 'apparels.apparels.page.final_inspection_application.final_inspection_application.save_inspection',
			args: {
				data: formData,
				inspection_id: this.currentInspectionId
			},
			callback: function(r) {
				if (r.message) {
					frappe.show_alert({
						message: 'Inspection saved successfully',
						indicator: 'green'
					});
					self.currentInspectionId = r.message.name;
					self.load_data();
				}
			},
			error: function(r) {
				frappe.show_alert({
					message: 'Error saving inspection: ' + (r.message || 'Unknown error'),
					indicator: 'red'
				});
			}
		});
	}

	load_data() {
		const self = this;
		
		frappe.call({
			method: 'apparels.apparels.page.final_inspection_application.final_inspection_application.get_inspections',
			args: {},
			callback: function(r) {
				if (r.message) {
					self.render_inspection_table(r.message);
				}
			}
		});
	}

	render_inspection_table(data) {
		const tbody = this.wrapper.find('#inspectionTableBody');
		tbody.empty();

		if (!data || data.length === 0) {
			tbody.append('<tr><td colspan="12" class="text-center text-muted">No inspection records found</td></tr>');
			return;
		}

		data.forEach(record => {
			const statusClass = record.status === 'Pass' ? 'success' : 'danger';
			const row = $(`
				<tr>
					<td>${record.inspection_date || '-'}</td>
					<td>${record.po_number || '-'}</td>
					<td>${record.style_no || '-'}</td>
					<td>${record.brand_buyer || '-'}</td>
					<td>${(record.total_order_qty || 0).toLocaleString()}</td>
					<td>${(record.total_ship_qty || 0).toLocaleString()}</td>
					<td>${(record.sample_size || 0).toLocaleString()}</td>
					<td>${record.critical_defects || 0}</td>
					<td>${record.major_defects || 0}</td>
					<td>${record.minor_defects || 0}</td>
					<td><span class="badge badge-${statusClass}">${record.status || '-'}</span></td>
					<td>
						<button class="btn btn-xs btn-default view-inspection-btn" data-name="${record.name}">
							<i class="fa fa-eye"></i>
						</button>
						<button class="btn btn-xs btn-default edit-inspection-btn" data-name="${record.name}">
							<i class="fa fa-edit"></i>
						</button>
					</td>
				</tr>
			`);

			row.find('.view-inspection-btn').on('click', function() {
				self.view_inspection($(this).data('name'));
			});

			row.find('.edit-inspection-btn').on('click', function() {
				self.edit_inspection($(this).data('name'));
			});

			tbody.append(row);
		});
	}

	view_inspection(name) {
		this.load_inspection(name, true);
	}

	edit_inspection(name) {
		this.load_inspection(name, false);
	}

	load_inspection(name, readOnly) {
		const self = this;

		frappe.call({
			method: 'apparels.apparels.page.final_inspection_application.final_inspection_application.get_inspection',
			args: {
				name: name
			},
			callback: function(r) {
				if (r.message) {
					self.populateForm(r.message, readOnly);
					self.wrapper.find('#inspectionFormContainer').show();
					self.wrapper.find('#inspectionListContainer').hide();
				}
			}
		});
	}

	populateForm(data, readOnly) {
		this.currentInspectionId = data.name;

		// Populate basic fields
		this.wrapper.find('#inspectionDate').val(data.inspection_date);
		this.wrapper.find('#inspectionType').val(data.inspection_type);
		this.wrapper.find('#inspectorName').val(data.inspector_name);
		this.wrapper.find('#factoryName').val(data.factory_name);
		this.wrapper.find('#factoryAddress').val(data.factory_address);
		this.wrapper.find('#productionLine').val(data.production_line);
		this.wrapper.find('#factoryContact').val(data.factory_contact);
		this.wrapper.find('#brandBuyer').val(data.brand_buyer);
		this.wrapper.find('#department').val(data.department);
		this.wrapper.find('#productCategory').val(data.product_category);
		this.wrapper.find('#styleNo').val(data.style_no);
		this.wrapper.find('#articleModelNo').val(data.article_model_no);
		this.wrapper.find('#season').val(data.season);
		this.wrapper.find('#sizeRange').val(data.size_range);
		this.wrapper.find('#colorways').val(data.colorways);
		this.wrapper.find('#poNumber').val(data.po_number);
		this.wrapper.find('#totalOrderQty').val(data.total_order_qty);
		this.wrapper.find('#shipmentDate').val(data.shipment_date);
		this.wrapper.find('#packagingType').val(data.packaging_type);
		this.wrapper.find('#packagingCompliance').prop('checked', data.packaging_compliance);

		// Populate AQL
		this.wrapper.find('#inspectionLevel').val(data.inspection_level);
		this.wrapper.find('#aqlMajor').val(data.aql_major);
		this.wrapper.find('#aqlMinor').val(data.aql_minor);
		this.wrapper.find('#measurementLevel').val(data.measurement_level);

		// Populate size-wise data
		if (data.size_wise_data) {
			this.sizeWiseData = JSON.parse(data.size_wise_data || '[]');
			this.renderSizeWiseTable();
		}

		// Populate defects
		if (data.defects) {
			this.defects = JSON.parse(data.defects || '[]');
			this.renderDefectsTable();
			this.updateDefectSummary();
		}

		// Populate checklists
		if (data.checklist_data) {
			this.checklistData = JSON.parse(data.checklist_data || '{}');
			// Re-render checklists with data
			this.initializeChecklists();
		}

		// Update calculations
		this.updateAQLCalculations();
		this.updateFinalResult();

		// Disable fields if read-only
		if (readOnly) {
			this.wrapper.find('#inspectionFormContainer input, #inspectionFormContainer select, #inspectionFormContainer button').prop('disabled', true);
			this.wrapper.find('#saveInspectionBtn').hide();
		} else {
			this.wrapper.find('#inspectionFormContainer input, #inspectionFormContainer select, #inspectionFormContainer button').prop('disabled', false);
			this.wrapper.find('#saveInspectionBtn').show();
		}
	}

	filter_table(search_text) {
		const tbody = this.wrapper.find('#inspectionTableBody');
		const rows = tbody.find('tr');

		rows.each(function() {
			const row = $(this);
			const text = row.text().toLowerCase();
			if (text.includes(search_text.toLowerCase())) {
				row.show();
			} else {
				row.hide();
			}
		});
	}

	filter_by_status(status) {
		const tbody = this.wrapper.find('#inspectionTableBody');
		const rows = tbody.find('tr');

		if (status === 'all') {
			rows.show();
			return;
		}

		rows.each(function() {
			const row = $(this);
			const badge = row.find('.badge');
			if (badge.length && badge.text().toLowerCase() === status.toLowerCase()) {
				row.show();
			} else {
				row.hide();
			}
		});
	}

	export_data() {
		frappe.call({
			method: 'apparels.apparels.page.final_inspection_application.final_inspection_application.get_inspections',
			args: {},
			callback: function(r) {
				if (r.message) {
					// Convert to CSV
					const data = r.message;
					const headers = ['Inspection Date', 'PO Number', 'Style No', 'Buyer', 'Order Qty', 'Ship Qty', 'Sample Size', 'Critical', 'Major', 'Minor', 'Status'];
					const csvRows = [headers.join(',')];
					
					data.forEach(record => {
						const row = [
							record.inspection_date || '',
							record.po_number || '',
							record.style_no || '',
							record.brand_buyer || '',
							record.total_order_qty || 0,
							record.total_ship_qty || 0,
							record.sample_size || 0,
							record.critical_defects || 0,
							record.major_defects || 0,
							record.minor_defects || 0,
							record.status || ''
						];
						csvRows.push(row.join(','));
					});

					const csvContent = csvRows.join('\n');
					const blob = new Blob([csvContent], { type: 'text/csv' });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'final_inspection_export_' + frappe.datetime.now_datetime().replace(/[^0-9]/g, '') + '.csv';
					a.click();
					window.URL.revokeObjectURL(url);
				}
			}
		});
	}
}
