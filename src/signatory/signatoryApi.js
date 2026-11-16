import apiClient from "../services/api.js";
import { readPage, unwrapEnvelope } from "../admin/services/portalApi.js";

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
  under_review: "Under Review",
  in_progress: "Under Review",
};

function labelStatus(value) {
  const key = String(value ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  return STATUS_LABEL[key] || "Pending";
}

function money(amount) {
  const number = Number(amount);
  if (amount == null || amount === "" || !Number.isFinite(number) || number <= 0) return "—";
  return `₱${number.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} balance`;
}

function stepsFrom(record) {
  const nested = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.requirements)
      ? record.requirements
      : [];
  return Array.from({ length: 6 }, (_, index) => {
    const match = nested.find((item) => Number(item.order_sequence) === index + 1);
    if (!match) return false;
    return String(match.status ?? "").toLowerCase() === "cleared";
  });
}

export function mapWorkspaceRecord(record) {
  const person = record.student && typeof record.student === "object" ? record.student : {};
  const proofUrl = record.proof_attachment_url || record.proof_attachment || person.proof_attachment;
  const status = labelStatus(record.status || record.overall_status);
  const isItem = Boolean(record.requirement_name || record.requirement_id || record.student_clearance_id);
  const proofStatus = status === "Cleared"
    ? (proofUrl ? "resolved" : null)
    : proofUrl || record.proof_uploaded_at
      ? "submitted"
      : status === "Deficiency"
        ? "pending"
        : null;
  const studentNumber = person.student_id || person.s_studentID || record.student_number || record.student_id;
  const personName = person.full_name
    || [person.s_fname, person.s_mname, person.s_lname].filter(Boolean).join(" ");

  return {
    id: String(isItem ? record.id : (studentNumber || record.id)),
    recordId: record.id,
    clearanceId: record.student_clearance_id || person.student_clearance_id || (isItem ? null : record.id),
    itemId: isItem ? record.id : null,
    name: record.student_name || personName || record.name || "Student",
    program: String(record.program || person.program_code || person.program_name || person.program || ""),
    yearLevel: Number(record.year_level ?? person.year_level ?? person.s_lvl) || 0,
    req: record.requirement_name || record.authorizing_role_name || "Signatory",
    status,
    fee: money(record.amount_due),
    proofDetails: record.proof_notes || record.remarks || "",
    proof: Boolean(proofUrl || record.proof_uploaded_at),
    note: record.remarks || "",
    proofStatus,
    steps: stepsFrom(record),
    validated: Boolean(record.is_enrolled ?? person.is_enrolled),
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

async function fetchAssignedItems() {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await apiClient.get("student-clearance-items/", {
      params: { per_page: 100, current_page: page },
    });
    const parsed = readPage(unwrapEnvelope(response), 100);
    items.push(...parsed.items);
    if (parsed.items.length === 0 || page >= (parsed.pages || 1)) break;
  }
  return items;
}

export async function fetchSignatoryRecords() {
  const [metricsResult, itemsResult, cohortResult] = await Promise.allSettled([
    apiClient.get("student-clearance-items/signatory-dashboard/"),
    fetchAssignedItems(),
    apiClient.get("student-clearances/program-chair-dashboard/"),
  ]);

  const metricsPayload = metricsResult.status === "fulfilled" ? unwrapEnvelope(metricsResult.value) : null;
  const metrics = isMetrics(metricsPayload) ? {
    totalAssigned: Number(metricsPayload.total_assigned ?? 0),
    pending: Number(metricsPayload.pending_count ?? 0),
    deficiency: Number(metricsPayload.deficiency_count ?? 0),
    underReview: Number(metricsPayload.under_review_count ?? 0),
    cleared: Number(metricsPayload.cleared_count ?? 0),
  } : null;
  const metricRecords = metrics ? [] : collect(metricsPayload).map(mapWorkspaceRecord);
  const itemRecords = itemsResult.status === "fulfilled"
    ? itemsResult.value.map(mapWorkspaceRecord)
    : null;
  const cohortRecords = cohortResult.status === "fulfilled"
    ? collect(unwrapEnvelope(cohortResult.value)).map(mapWorkspaceRecord)
    : null;
  const queue = itemRecords ?? (metricRecords.length ? metricRecords : (cohortRecords ?? []));
  const cohort = cohortRecords ?? queue;

  if (itemsResult.status === "rejected" && cohortResult.status === "rejected" && metricsResult.status === "rejected") {
    const reason = itemsResult.reason || cohortResult.reason || metricsResult.reason;
    const message = reason?.response?.data?.message;
    throw new Error(typeof message === "string" && message !== "Error"
      ? message
      : "The signatory dashboard could not be loaded.");
  }

  return {
    queue,
    cohort,
    metrics,
  };
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
  if (updates.validated === true && student.clearanceId) {
    await apiClient.post(`student-clearances/${student.clearanceId}/enroll/`, {});
    return;
  }

  if (!student.itemId) return;

  const body = {};
  if (updates.status === "Cleared") body.status = "cleared";
  if (updates.status === "Deficiency") body.status = "has_issue";
  if (updates.status === "Under Review" || updates.status === "Pending") body.status = "pending";
  if (typeof updates.note === "string" && updates.note) body.remarks = updates.note;
  if (typeof updates.proofDetails === "string" && updates.proofDetails) body.proof_notes = updates.proofDetails;
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

  return {
    firstName,
    lastName,
    title: "",
    role,
    displayName: [firstName, lastName].filter(Boolean).join(" "),
  };
}
