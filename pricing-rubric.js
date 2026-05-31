// Pricing rubric for Engagement OS
//
// Format:
//   Each engagement type has three complexity levels: standard, complex, highly_complex
//   Each level is [min, max] fee in lakhs (₹)
//   The recommended fee shown in the intake modal = midpoint of the range
//
// To customise: change the values to match your own pricing.
// For Custom engagements both values are 0 — the fee is entered manually.

const PRICING_RUBRIC = {
  'Strategy Advisory':       { standard: [12, 18], complex: [18, 28], highly_complex: [28, 45] },
  'M&A Due Diligence':       { standard: [18, 28], complex: [28, 40], highly_complex: [40, 60] },
  'Market Entry':            { standard: [14, 22], complex: [22, 35], highly_complex: [35, 50] },
  'Operational Improvement': { standard: [10, 16], complex: [16, 25], highly_complex: [25, 40] },
  'Digital Transformation':  { standard: [16, 24], complex: [24, 38], highly_complex: [38, 55] },
  'Custom':                  { standard: [0,  0],  complex: [0,  0],  highly_complex: [0,  0]  },
}
