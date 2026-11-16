function displayApiText(value) {
  if (value == null || typeof value === "object") return "";
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "string") return "";
  return text;
}

function formatAcademicYear(value) {
  const text = displayApiText(value);
  if (!text) return "";
  return /^ay\b/i.test(text) ? text : `AY ${text}`;
}

function formatClearanceTerm(clearance) {
  return [
    displayApiText(clearance?.semester),
    formatAcademicYear(clearance?.academic_year),
    displayApiText(clearance?.clearance_type_name),
  ].filter(Boolean).join(" · ");
}

export { displayApiText, formatAcademicYear, formatClearanceTerm };
