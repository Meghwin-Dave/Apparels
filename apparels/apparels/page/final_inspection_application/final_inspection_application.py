import frappe
import json
from frappe import _

@frappe.whitelist()
def save_inspection(data, inspection_id=None):
	"""Save or update a final inspection record"""
	try:
		data = json.loads(data) if isinstance(data, str) else data
		
		if inspection_id:
			# Update existing record
			doc = frappe.get_doc('Final Inspection', inspection_id)
		else:
			# Create new record
			doc = frappe.get_doc({
				'doctype': 'Final Inspection',
				'inspection_date': data.get('inspection_date'),
				'inspection_type': data.get('inspection_type'),
				'inspector_name': data.get('inspector_name'),
				'factory_name': data.get('factory_name'),
				'factory_address': data.get('factory_address'),
				'production_line': data.get('production_line'),
				'factory_contact': data.get('factory_contact'),
				'brand_buyer': data.get('brand_buyer'),
				'department': data.get('department'),
				'product_category': data.get('product_category'),
				'style_no': data.get('style_no'),
				'article_model_no': data.get('article_model_no'),
				'season': data.get('season'),
				'size_range': data.get('size_range'),
				'colorways': data.get('colorways'),
				'po_number': data.get('po_number'),
				'total_order_qty': data.get('total_order_qty', 0),
				'shipment_date': data.get('shipment_date'),
				'packaging_type': data.get('packaging_type'),
				'packaging_compliance': data.get('packaging_compliance', False),
				'inspection_level': data.get('inspection_level'),
				'aql_major': data.get('aql_major'),
				'aql_minor': data.get('aql_minor'),
				'measurement_level': data.get('measurement_level'),
				'status': data.get('status', 'Pass'),
				'critical_defects': data.get('critical_defects', 0),
				'major_defects': data.get('major_defects', 0),
				'minor_defects': data.get('minor_defects', 0),
				'sample_size': data.get('sample_size', 0)
			})

		# Update fields
		doc.inspection_date = data.get('inspection_date')
		doc.inspection_type = data.get('inspection_type')
		doc.inspector_name = data.get('inspector_name')
		doc.factory_name = data.get('factory_name')
		doc.factory_address = data.get('factory_address')
		doc.production_line = data.get('production_line')
		doc.factory_contact = data.get('factory_contact')
		doc.brand_buyer = data.get('brand_buyer')
		doc.department = data.get('department')
		doc.product_category = data.get('product_category')
		doc.style_no = data.get('style_no')
		doc.article_model_no = data.get('article_model_no')
		doc.season = data.get('season')
		doc.size_range = data.get('size_range')
		doc.colorways = data.get('colorways')
		doc.po_number = data.get('po_number')
		doc.total_order_qty = data.get('total_order_qty', 0)
		doc.shipment_date = data.get('shipment_date')
		doc.packaging_type = data.get('packaging_type')
		doc.packaging_compliance = data.get('packaging_compliance', False)
		doc.inspection_level = data.get('inspection_level')
		doc.aql_major = data.get('aql_major')
		doc.aql_minor = data.get('aql_minor')
		doc.measurement_level = data.get('measurement_level')
		doc.status = data.get('status', 'Pass')
		doc.critical_defects = data.get('critical_defects', 0)
		doc.major_defects = data.get('major_defects', 0)
		doc.minor_defects = data.get('minor_defects', 0)
		doc.sample_size = data.get('sample_size', 0)

		# Calculate total ship qty from size-wise data
		size_wise_data = data.get('size_wise_data', [])
		if size_wise_data:
			doc.total_ship_qty = sum(item.get('shipQty', 0) for item in size_wise_data)
			doc.size_wise_data = json.dumps(size_wise_data)
		else:
			doc.total_ship_qty = 0
			doc.size_wise_data = '[]'

		# Store defects
		defects = data.get('defects', [])
		doc.defects = json.dumps(defects)

		# Store checklist data
		checklist_data = data.get('checklist_data', {})
		doc.checklist_data = json.dumps(checklist_data)

		# Save size-wise quantities as child table
		if size_wise_data:
			doc.size_wise_quantities = []
			for item in size_wise_data:
				doc.append('size_wise_quantities', {
					'size': item.get('size'),
					'order_qty': item.get('orderQty', 0),
					'ship_qty': item.get('shipQty', 0),
					'cartons': item.get('cartons', 0)
				})

		# Save defects as child table
		if defects:
			doc.defects_detail = []
			for defect in defects:
				doc.append('defects_detail', {
					'category': defect.get('category'),
					'defect_description': defect.get('description'),
					'severity': defect.get('severity'),
					'quantity': defect.get('quantity', 1),
					'panel_location': defect.get('panelLocation'),
					'sample_no': defect.get('sampleNo')
				})

		doc.save()
		frappe.db.commit()

		return doc

	except Exception as e:
		frappe.log_error(f"Error saving inspection: {str(e)}", "Final Inspection Save Error")
		frappe.throw(_("Error saving inspection: {0}").format(str(e)))

@frappe.whitelist()
def get_inspections():
	"""Get all final inspection records"""
	try:
		inspections = frappe.get_all(
			'Final Inspection',
			fields=[
				'name', 'inspection_date', 'po_number', 'style_no', 'brand_buyer',
				'total_order_qty', 'total_ship_qty', 'sample_size',
				'critical_defects', 'major_defects', 'minor_defects', 'status'
			],
			order_by='inspection_date desc',
			limit=100
		)
		return inspections
	except Exception as e:
		frappe.log_error(f"Error getting inspections: {str(e)}", "Final Inspection Get Error")
		return []

@frappe.whitelist()
def get_inspection(name):
	"""Get a single final inspection record"""
	try:
		doc = frappe.get_doc('Final Inspection', name)
		
		# Get size-wise data
		size_wise_data = []
		if doc.size_wise_quantities:
			for row in doc.size_wise_quantities:
				size_wise_data.append({
					'size': row.size,
					'orderQty': row.order_qty,
					'shipQty': row.ship_qty,
					'cartons': row.cartons
				})

		# Get defects
		defects = []
		if doc.defects_detail:
			for row in doc.defects_detail:
				defects.append({
					'category': row.category,
					'description': row.defect_description,
					'severity': row.severity,
					'quantity': row.quantity,
					'panelLocation': row.panel_location,
					'sampleNo': row.sample_no
				})

		return {
			'name': doc.name,
			'inspection_date': doc.inspection_date,
			'inspection_type': doc.inspection_type,
			'inspector_name': doc.inspector_name,
			'factory_name': doc.factory_name,
			'factory_address': doc.factory_address,
			'production_line': doc.production_line,
			'factory_contact': doc.factory_contact,
			'brand_buyer': doc.brand_buyer,
			'department': doc.department,
			'product_category': doc.product_category,
			'style_no': doc.style_no,
			'article_model_no': doc.article_model_no,
			'season': doc.season,
			'size_range': doc.size_range,
			'colorways': doc.colorways,
			'po_number': doc.po_number,
			'total_order_qty': doc.total_order_qty,
			'total_ship_qty': doc.total_ship_qty,
			'shipment_date': doc.shipment_date,
			'packaging_type': doc.packaging_type,
			'packaging_compliance': doc.packaging_compliance,
			'inspection_level': doc.inspection_level,
			'aql_major': doc.aql_major,
			'aql_minor': doc.aql_minor,
			'measurement_level': doc.measurement_level,
			'status': doc.status,
			'critical_defects': doc.critical_defects,
			'major_defects': doc.major_defects,
			'minor_defects': doc.minor_defects,
			'sample_size': doc.sample_size,
			'size_wise_data': json.dumps(size_wise_data),
			'defects': json.dumps(defects),
			'checklist_data': doc.checklist_data or '{}'
		}
	except Exception as e:
		frappe.log_error(f"Error getting inspection: {str(e)}", "Final Inspection Get Error")
		frappe.throw(_("Error getting inspection: {0}").format(str(e)))

