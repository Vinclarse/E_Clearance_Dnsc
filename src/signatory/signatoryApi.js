import apiClient from "../services/api.js";
import { readPage, unwrapEnvelope } from "../admin/services/portalApi.js";

const textValue = (value) => (typeof value === "string" && value.trim() ? value.trim() : "");

function asText(value, fallback = "") {
  if (value == null || typeof value === "object") return fallback;
  const text = String(value).trim();
  return text || fallback;
}

async function enrichClearanceTerm(clearance, cache) {
  const nested = clearance?.clearance_type && typeof clearance.clearance_type === "object"
    ? clearance.clearance_type
    : {};
  let semester = textValue(clearance?.semester) || textValue(nested.semester);
  let academicYear = textValue(clearance?.academic_year) || textValue(nested.academic_year);
  let typeName = textValue(clearance?.clearance_type_name) || textValue(nested.name);
  const typeId = clearance?.clearance_type_id || nested.id;

  if ((!semester || !academicYear || !typeName) && typeId) {
    if (!cache.has(String(typeId))) {
      cache.set(String(typeId), apiClient.get(`clearance-types/${typeId}/`)
        .then((response) => unwrapEnvelope(response))
        .catch(() => null));
    }
    const type = await cache.get(String(typeId));
    semester = semester || textValue(type?.semester);
    academicYear = academicYear || textValue(type?.academic_year);
    typeName = typeName || textValue(type?.name);
  }

  return {
    ...clearance,
    semester,
    academic_year: academicYear,
    clearance_type_name: typeName,
  };
}

function isWorkspaceRecord(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value.student_name || value.student_number || value.requirement_name || value.overall_status || value.status),
  );
}

function collect(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload.filter(isWorkspaceRecord);
  const page = readPage(payload);
  if (page.items.length) return page.items;
  for (const key of ["queue", "students", "clearances", "items", "records", "results"]) {
    if (Array.isArray(payload[key]) && payload[key].some(isWorkspaceRecord)) return payload[key];
  }
  const nested = Object.values(payload).find(
    (value) => Array.isArray(value) && value.some(isWorkspaceRecord),
  );
  if (nested) return nested;
  return isWorkspaceRecord(payload) ? [payload] : [];
}

const STATUS_LABEL = {
  cleared: "Cleared",
  completed: "Cleared",
  has_issue: "Deficiency",
  deficiency: "Deficiency",
  pending: "Pending",
  in_progress: "Pending",
};

function labelStatus(value) {
  const key = String(value ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  return STATUS_LABEL[key] || "Pending";
}

function httpProofUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return "";
  if (/^http:\/\/res\.cloudinary\.com\//i.test(trimmed)) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

function proofUrlFrom(record) {
  return httpProofUrl(record?.proof_attachment_url) || httpProofUrl(record?.proof_attachment);
}

export function isImageProof(url) {
  if (/\.pdf(\?|#|$)/i.test(url)) return false;
  return /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(url) || /\/image\/upload\//i.test(url);
}

function money(amount) {
  const number = Number(amount);
  if (amount == null || amount === "" || !Number.isFinite(number) || number <= 0) return "—";
  return `₱${number.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} balance`;
}

function orderedItems(record) {
  const nested = Array.isArray(record?.items) ? record.items : [];
  return [...nested].sort((left, right) => Number(left.order_sequence) - Number(right.order_sequence));
}

function stepsFrom(record) {
  const nested = orderedItems(record);
  return Array.from({ length: 6 }, (_, index) => {
    const match = nested.find((item) => Number(item.order_sequence) === index + 1);
    if (!match) return false;
    return String(match.status ?? "").toLowerCase() === "cleared";
  });
}

function proofState(record, status) {
  const proofUrl = proofUrlFrom(record);
  const proof = Boolean(proofUrl || record?.proof_uploaded_at);
  const proofStatus = status === "Cleared"
    ? (proof ? "resolved" : null)
    : proof
      ? "submitted"
      : status === "Deficiency"
        ? "pending"
        : null;
  return { proofUrl, proof, proofStatus };
}

function mapQueueItem(item, clearance) {
  const status = labelStatus(item.status);
  const proof = proofState(item, status);
  return {
    id: String(item.id),
    itemId: item.id,
    clearanceId: item.student_clearance_id ?? clearance?.id ?? null,
    name: asText(clearance?.student_name || item.student_name, "Student"),
    studentNumber: asText(clearance?.student_number || item.student_number),
    program: asText(clearance?.program || item.program),
    yearLevel: Number(clearance?.year_level || item.year_level) || 0,
    section: String(clearance?.s_set || item.s_set || ""),
    semester: textValue(clearance?.semester),
    academicYear: textValue(clearance?.academic_year),
    clearanceTypeName: textValue(clearance?.clearance_type_name),
    orderSequence: Number(item.order_sequence) || 0,
    req: asText(item.requirement_name || item.authorizing_role_name, "Signatory"),
    isActionable: item.is_actionable !== false,
    status,
    fee: money(item.amount_due),
    proofDetails: asText(item.proof_notes || item.remarks),
    proof: proof.proof,
    proofUrl: proof.proofUrl,
    note: asText(item.remarks),
    proofStatus: proof.proofStatus,
    steps: stepsFrom(clearance),
    validated: Boolean(clearance?.is_enrolled),
  };
}

function mapCohort(clearance) {
  const items = orderedItems(clearance);
  const hasIssue = items.some((entry) => String(entry.status ?? "").toLowerCase() === "has_issue");
  const allCleared = items.length > 0 && items.every((entry) => String(entry.status ?? "").toLowerCase() === "cleared");
  return {
    id: String(clearance.id),
    itemId: null,
    clearanceId: clearance.id,
    name: asText(clearance?.student_name, "Student"),
    studentNumber: asText(clearance?.student_number),
    program: asText(clearance?.program),
    yearLevel: Number(clearance.year_level) || 0,
    section: String(clearance.s_set || ""),
    semester: textValue(clearance.semester),
    academicYear: textValue(clearance.academic_year),
    clearanceTypeName: textValue(clearance.clearance_type_name),
    orderSequence: 0,
    req: "",
    isActionable: false,
    status: allCleared ? "Cleared" : hasIssue ? "Deficiency" : labelStatus(clearance.status),
    fee: "—",
    proofDetails: "",
    proof: false,
    proofUrl: "",
    note: "",
    proofStatus: null,
    steps: stepsFrom(clearance),
    hasIssue,
    allCleared,
    validated: Boolean(clearance.is_enrolled),
  };
}

function isMetrics(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("pending_count" in value || "total_assigned" in value || "deficiency_count" in value || "cleared_count" in value),
  );
}

function metricsFromQueue(queue) {
  return {
    totalAssigned: queue.length,
    pending: queue.filter((row) => row.status === "Pending").length,
    deficiency: queue.filter((row) => row.status === "Deficiency").length,
    underReview: queue.filter((row) => row.proof && row.status === "Pending").length,
    cleared: queue.filter((row) => row.status === "Cleared").length,
  };
}

async function fetchPages(path) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await apiClient.get(path, {
      params: { per_page: 100, current_page: page },
    });
    const parsed = readPage(unwrapEnvelope(response), 100);
    items.push(...parsed.items);
    if (parsed.items.length === 0 || page >= (parsed.pages || 1)) break;
  }
  return items;
}

async function fetchClearanceById(id) {
  const response = await apiClient.get(`student-clearances/${id}/`);
  return unwrapEnvelope(response);
}

async function loadClearances(items) {
  try {
    const listed = await fetchPages("student-clearances/");
    if (listed.length > 0) return listed;
  } catch {
    // A signatory office may be allowed to read items but not the clearance list.
  }

  const ids = [...new Set(items.map((item) => item.student_clearance_id).filter(Boolean))];
  const clearances = [];
  for (let index = 0; index < ids.length; index += 5) {
    const batch = ids.slice(index, index + 5);
    const results = await Promise.allSettled(batch.map((id) => fetchClearanceById(id)));
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) clearances.push(result.value);
    }
  }
  return clearances;
}

async function loadChairAccess() {
  try {
    const response = await apiClient.get("student-clearances/program-chair-dashboard/");
    return { allowed: true, records: collect(unwrapEnvelope(response)) };
  } catch {
    return { allowed: false, records: [] };
  }
}

export async function fetchClearanceItem(id) {
  const response = await apiClient.get(`student-clearance-items/${id}/`);
  const item = unwrapEnvelope(response);
  let clearance = null;
  if (item?.student_clearance_id) {
    try {
      clearance = await fetchClearanceById(item.student_clearance_id);
    } catch {
      clearance = null;
    }
  }
  return mapQueueItem(item, clearance);
}

export async function fetchSignatoryRecords() {
  const [metricsResult, itemsResult, chairResult] = await Promise.allSettled([
    apiClient.get("student-clearance-items/signatory-dashboard/"),
    fetchPages("student-clearance-items/"),
    loadChairAccess(),
  ]);

  if (itemsResult.status === "rejected" && metricsResult.status === "rejected") {
    const reason = itemsResult.reason || metricsResult.reason;
    const message = reason?.response?.data?.message;
    throw new Error(typeof message === "string" && message !== "Error"
      ? message
      : "The signatory dashboard could not be loaded.");
  }

  const items = itemsResult.status === "fulfilled" ? itemsResult.value : [];
  const loadedClearances = await loadClearances(items);
  const termCache = new Map();
  const clearances = await Promise.all(loadedClearances.map((clearance) => enrichClearanceTerm(clearance, termCache)));
  const clearanceById = new Map(clearances.map((clearance) => [String(clearance.id), clearance]));
  const queue = items.map((item) => mapQueueItem(item, clearanceById.get(String(item.student_clearance_id))));

  const metricsPayload = metricsResult.status === "fulfilled" ? unwrapEnvelope(metricsResult.value) : null;
  const metrics = isMetrics(metricsPayload) ? {
    totalAssigned: Number(metricsPayload.total_assigned ?? queue.length),
    pending: Number(metricsPayload.pending_count ?? 0),
    deficiency: Number(metricsPayload.deficiency_count ?? 0),
    underReview: Number(metricsPayload.under_review_count ?? 0),
    cleared: Number(metricsPayload.cleared_count ?? 0),
  } : metricsFromQueue(queue);

  const chair = chairResult.status === "fulfilled" ? chairResult.value : { allowed: false, records: [] };
  const cohortById = new Map();
  for (const clearance of clearances) {
    if (clearance?.id == null) continue;
    cohortById.set(String(clearance.id), clearance);
  }
  if (chair.allowed) {
    for (const record of chair.records) {
      if (record?.id == null || cohortById.has(String(record.id))) continue;
      cohortById.set(String(record.id), record);
    }
  }
  const cohort = [...cohortById.values()].map(mapCohort);

  return { queue, cohort, metrics };
}

export async function fetchSignatoryNotifications() {
  const response = await apiClient.get("notifications/", {
    params: { per_page: 30, current_page: 1, source: "clearance" },
  });
  return collect(unwrapEnvelope(response)).map((notice) => {
    const created = notice.created_at ? new Date(notice.created_at) : null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      id: notice.id,
      title: notice.title || "Notification",
      desc: notice.message_preview || "",
      time: created
        ? created.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : "",
      group: created && created >= startOfToday ? "TODAY" : "EARLIER",
      unread: notice.is_read === false,
    };
  });
}

export async function markNotificationRead(id) {
  await apiClient.get(`notifications/${id}/`);
}

export async function markAllNotificationsRead() {
  await apiClient.post("notifications/mark-all-read/", {});
}

export async function applySignatoryUpdate(student, updates) {
  if (updates.validated === true) {
    const complete = Array.isArray(student.steps) && student.steps.length > 0 && student.steps.every(Boolean);
    if (!student.clearanceId || student.validated || !complete) return;
    await apiClient.post(`student-clearances/${student.clearanceId}/enroll/`, {});
    return;
  }

  if (!student.itemId) return;

  const body = {};
  if (updates.status === "Cleared") body.status = "cleared";
  if (updates.status === "Deficiency") body.status = "has_issue";
  if (updates.status === "Pending") body.status = "pending";
  if (typeof updates.note === "string" && updates.note) body.remarks = updates.note;
  if (typeof updates.proofDetails === "string" && updates.proofDetails) body.proof_notes = updates.proofDetails;
  if (updates.amountDue != null && updates.amountDue !== "") body.amount_due = updates.amountDue;
  if (Object.keys(body).length === 0) return;
  await apiClient.patch(`student-clearance-items/${student.itemId}/`, body);
}

export function profileFromAccount(profile) {
  const groups = (Array.isArray(profile?.groups) ? profile.groups : [])
    .map((group) => String(group?.name ?? group).trim())
    .filter(Boolean);
  const firstName = profile?.first_name?.trim() || "Signatory";
  const lastName = profile?.last_name?.trim() || "";
  const role = profile?.is_superuser
    ? "SUPERADMIN"
    : (groups[0] || "Signatory").toUpperCase();

  const avatar = profile?.profile_url || profile?.profile;
  return {
    firstName,
    lastName,
    title: "",
    role,
    email: profile?.email || "",
    avatarUrl: typeof avatar === "string" ? avatar : "",
    displayName: [firstName, lastName].filter(Boolean).join(" "),
  };
}
