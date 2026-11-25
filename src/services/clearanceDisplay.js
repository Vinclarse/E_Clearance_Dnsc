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

function plainAcademicYear(value) {
  return displayApiText(value).replace(/^ay\s+/i, "");
}

function shortSemester(value) {
  const text = displayApiText(value);
  if (!text) return "";
  if (/first|\b1st\b|^1\b/i.test(text)) return "1st Sem";
  if (/second|\b2nd\b|^2\b/i.test(text)) return "2nd Sem";
  if (/summer/i.test(text)) return "Summer";
  return text;
}

function formatClearanceTerm(clearance) {
  return [
    plainAcademicYear(clearance?.academic_year),
    shortSemester(clearance?.semester),
    displayApiText(clearance?.clearance_type_name) || displayApiText(clearance?.name),
  ].filter(Boolean).join(" · ");
}

function termFromRecords(records) {
  const source = (records || []).find((row) => row?.semester || row?.academicYear || row?.clearanceTypeName);
  if (!source) return "";
  return formatClearanceTerm({
    semester: source.semester,
    academic_year: source.academicYear,
    clearance_type_name: source.clearanceTypeName,
  });
}

export { displayApiText, formatAcademicYear, formatClearanceTerm, plainAcademicYear, shortSemester, termFromRecords };
