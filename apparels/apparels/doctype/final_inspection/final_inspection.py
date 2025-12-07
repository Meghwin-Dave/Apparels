import frappe
from frappe.model.document import Document

class FinalInspection(Document):
	def validate(self):
		# Calculate total ship qty from size-wise quantities
		if self.size_wise_quantities:
			self.total_ship_qty = sum(row.ship_qty for row in self.size_wise_quantities)
		
		# Calculate defect counts
		if self.defects_detail:
			self.critical_defects = sum(row.quantity for row in self.defects_detail if row.severity == 'Critical')
			self.major_defects = sum(row.quantity for row in self.defects_detail if row.severity == 'Major')
			self.minor_defects = sum(row.quantity for row in self.defects_detail if row.severity == 'Minor')
		
		# Determine status based on defects
		if not self.status:
			if self.critical_defects > 0:
				self.status = 'Fail'
			elif self.major_defects > 0 and self.sample_size > 0:
				# Check against AQL acceptance criteria (simplified)
				ac_major = int((self.sample_size * self.aql_major) / 100) if self.aql_major else 0
				if self.major_defects > ac_major:
					self.status = 'Fail'
				else:
					self.status = 'Pass'
			elif not self.packaging_compliance:
				self.status = 'Fail'
			else:
				self.status = 'Pass'

