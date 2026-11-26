import apiClient from "../services/api.js";

export function createMockBackend() {
  const state = {
    currentUserKey: "student",
    users: {
      student: {
        id: 10,
        username: "Student202400633",
        email: "froyd.student@dnsc.edu.ph",
        first_name: "Froyd",
        last_name: "Carbajosa",
        groups: ["Students"],
        is_superuser: false,
        institute: { id: 1, institute_name: "Institute of Computing" },
        student: {
          s_studentID: "202400633",
          program_name: "Bachelor of Science in Information Technology",
        },
      },
      signatory: {
        id: 20,
        username: "librarian_ic",
        email: "librarian@dnsc.edu.ph",
        first_name: "Maria",
        last_name: "Librarian",
        groups: ["Librarians", "Program Chairs"],
        is_superuser: false,
        institute: { id: 1, institute_name: "Institute of Computing" },
      },
      admin: {
        id: 30,
        username: "dnsc_ic_admin",
        email: "admin.ic@dnsc.edu.ph",
        first_name: "Admin",
        last_name: "IC",
        groups: ["Institute Admins"],
        is_superuser: false,
        institute: { id: 1, institute_name: "Institute of Computing" },
      },
      staffCandidate: {
        id: 21,
        username: "staff_library",
        email: "staff.library@dnsc.edu.ph",
        first_name: "Elena",
        last_name: "Staff",
        groups: [],
        is_staff: true,
        is_superuser: false,
        institute: { id: 1, institute_name: "Institute of Computing" },
      },
      superadmin: {
        id: 40,
        username: "superadmin",
        email: "superadmin@dnsc.edu.ph",
        first_name: "Super",
        last_name: "Admin",
        groups: [],
        is_staff: true,
        is_superuser: true,
      },
    },
    roles: [
      { id: 1, name: "Librarians" },
      { id: 2, name: "Cashiers" },
      { id: 3, name: "Program Chairs" },
    ],
    clearanceTypes: [
      {
        id: 1,
        name: "1st Semester Clearance",
        academic_year: "2026-2027",
        semester: "1st Semester",
        target_year_levels: [1, 2, 3, 4],
        is_active: false,
        is_issued: true,
        issued_at: "2026-08-01T08:00:00Z",
        requirements: [
          { id: 101, clearance_type: 1, name: "Library Clearance", authorizing_role_id: 1, authorizing_role_ids: [1], authorizing_role_name: "Librarians", order_sequence: 1 },
          { id: 102, clearance_type: 1, name: "Cashier Clearance", authorizing_role_id: 2, authorizing_role_ids: [2], authorizing_role_name: "Cashiers", order_sequence: 2 },
        ],
      },
      {
        id: 2,
        name: "2nd Semester Clearance",
        academic_year: "2026-2027",
        semester: "2nd Semester",
        target_year_levels: [1, 2, 3, 4],
        is_active: true,
        is_issued: true,
        issued_at: "2026-11-01T08:00:00Z",
        requirements: [
          { id: 201, clearance_type: 2, name: "Library Clearance", authorizing_role_id: 1, authorizing_role_ids: [1], authorizing_role_name: "Librarians", order_sequence: 1 },
          { id: 202, clearance_type: 2, name: "Cashier Clearance", authorizing_role_id: 2, authorizing_role_ids: [2], authorizing_role_name: "Cashiers", order_sequence: 2 },
        ],
      },
    ],
    studentClearances: [
      {
        id: 1001,
        student_id: 10,
        student_name: "Froyd Carbajosa",
        student_number: "202400633",
        program: "BSIT",
        year_level: 3,
        s_set: "C",
        clearance_type_id: 1,
        clearance_type_name: "1st Semester Clearance",
        academic_year: "2026-2027",
        semester: "1st Semester",
        overall_status: "completed",
        verification_token: "11111111-2222-3333-4444-555555555555",
        is_enrolled: true,
        completed_at: "2026-10-15T10:00:00Z",
      },
      {
        id: 1002,
        student_id: 10,
        student_name: "Froyd Carbajosa",
        student_number: "202400633",
        program: "BSIT",
        year_level: 3,
        s_set: "C",
        clearance_type_id: 2,
        clearance_type_name: "2nd Semester Clearance",
        academic_year: "2026-2027",
        semester: "2nd Semester",
        overall_status: "in_progress",
        verification_token: null,
        is_enrolled: false,
        completed_at: null,
      },
    ],
    items: [
      {
        id: 5001,
        student_clearance_id: 1001,
        requirement_id: 101,
        requirement_name: "Library Clearance",
        authorizing_role_name: "Librarians",
        order_sequence: 1,
        status: "cleared",
        amount_due: "0.00",
        remarks: null,
        proof_attachment: null,
        proof_attachment_url: null,
        proof_notes: null,
        proof_uploaded_at: null,
        cleared_at: "2026-10-10T09:00:00Z",
      },
      {
        id: 5002,
        student_clearance_id: 1001,
        requirement_id: 102,
        requirement_name: "Cashier Clearance",
        authorizing_role_name: "Cashiers",
        order_sequence: 2,
        status: "cleared",
        amount_due: "0.00",
        remarks: null,
        proof_attachment: null,
        proof_attachment_url: null,
        proof_notes: null,
        proof_uploaded_at: null,
        cleared_at: "2026-10-15T10:00:00Z",
      },
      {
        id: 6001,
        student_clearance_id: 1002,
        requirement_id: 201,
        requirement_name: "Library Clearance",
        authorizing_role_name: "Librarians",
        order_sequence: 1,
        status: "has_issue",
        amount_due: "150.00",
        remarks: "Overdue book: Database Systems",
        proof_attachment: null,
        proof_attachment_url: null,
        proof_notes: null,
        proof_uploaded_at: null,
        cleared_at: null,
      },
      {
        id: 6002,
        student_clearance_id: 1002,
        requirement_id: 202,
        requirement_name: "Cashier Clearance",
        authorizing_role_name: "Cashiers",
        order_sequence: 2,
        status: "pending",
        amount_due: "0.00",
        remarks: null,
        proof_attachment: null,
        proof_attachment_url: null,
        proof_notes: null,
        proof_uploaded_at: null,
        cleared_at: null,
      },
    ],
    emailChange: null,
    notifications: [],
    requests: [],
    nextId: 7000,
  };

  function clearanceItemsFor(clearanceId) {
    return state.items
      .filter((item) => item.student_clearance_id === clearanceId)
      .sort((a, b) => a.order_sequence - b.order_sequence)
      .map((item) => ({
        ...item,
        is_actionable: !state.items.some(
          (prev) =>
            prev.student_clearance_id === clearanceId &&
            prev.order_sequence < item.order_sequence &&
            prev.status !== "cleared",
        ),
      }));
  }

  function hydrateClearance(clearance) {
    const type = state.clearanceTypes.find((entry) => entry.id === clearance.clearance_type_id);
    return {
      ...clearance,
      clearance_type: type || null,
      items: clearanceItemsFor(clearance.id),
    };
  }

  function refreshOverallStatus(clearanceId) {
    const clearance = state.studentClearances.find((entry) => entry.id === clearanceId);
    if (!clearance) return;
    const rows = clearanceItemsFor(clearanceId);
    if (rows.length > 0 && rows.every((row) => row.status === "cleared")) {
      clearance.overall_status = "completed";
      clearance.completed_at = clearance.completed_at || "2026-11-26T12:00:00Z";
      clearance.verification_token = clearance.verification_token || "99999999-aaaa-bbbb-cccc-dddddddddddd";
    } else if (rows.some((row) => row.status === "has_issue")) {
      clearance.overall_status = "has_issue";
    } else if (rows.some((row) => row.status === "under_review" || row.status === "cleared")) {
      clearance.overall_status = "in_progress";
    } else {
      clearance.overall_status = "pending";
    }
  }

  function makeResponse(config, status, data) {
    if (status >= 400) {
      const error = new Error(data?.detail || "Request failed");
      error.config = config;
      error.response = { status, statusText: "Error", data, headers: {} };
      return Promise.reject(error);
    }
    return Promise.resolve({ status, statusText: "OK", data, headers: {}, config, request: {} });
  }

  function parseBody(raw) {
    if (!raw) return {};
    if (typeof FormData !== "undefined" && raw instanceof FormData) {
      const out = {};
      for (const [k, v] of raw.entries()) out[k] = v;
      return out;
    }
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw;
  }

  const adapter = async (config) => {
    const method = String(config.method || "get").toLowerCase();
    const cleanUrl = String(config.url || "").replace(/^\/+/, "").split("?")[0];
    const body = parseBody(config.data);
    state.requests.push({ method, url: cleanUrl, body, params: config.params });

    if (method === "post" && cleanUrl === "login/") {
      return makeResponse(config, 200, {
        access: "mock-access-token",
        refresh: "mock-refresh-token",
      });
    }

    if (method === "get" && cleanUrl === "me/") {
      return makeResponse(config, 200, state.users[state.currentUserKey]);
    }

    if (method === "patch" && cleanUrl === "me/update/") {
      const user = state.users[state.currentUserKey];
      if (body.first_name) user.first_name = body.first_name;
      if (body.last_name) user.last_name = body.last_name;
      return makeResponse(config, 200, user);
    }

    // Email Change endpoints
    if (method === "get" && cleanUrl === "email-change/status/") {
      return makeResponse(config, 200, state.emailChange);
    }
    if (method === "delete" && cleanUrl === "email-change/status/") {
      state.emailChange = null;
      return makeResponse(config, 200, { detail: "Cancelled." });
    }
    if (method === "post" && cleanUrl === "email-change/request/") {
      const user = state.users[state.currentUserKey];
      state.emailChange = {
        id: 1,
        stage: "code_sent",
        current_email: user.email,
        new_email: "",
      };
      return makeResponse(config, 200, {
        detail: `Verification code sent to ${user.email}.`,
        sent_to: user.email,
        expires_in_minutes: 15,
      });
    }
    if (method === "post" && cleanUrl === "email-change/verify/") {
      if (body.code !== "123456") {
        return makeResponse(config, 400, { detail: "Invalid verification code." });
      }
      state.emailChange = { ...(state.emailChange || {}), stage: "code_verified" };
      return makeResponse(config, 200, { change_token: "chg-tok-777", expires_in_minutes: 15 });
    }
    if (method === "post" && cleanUrl === "email-change/set-new/") {
      state.emailChange = {
        ...(state.emailChange || {}),
        stage: "awaiting_confirmation",
        new_email: body.new_email,
      };
      return makeResponse(config, 200, {
        detail: `Confirmation link sent to ${body.new_email}.`,
        new_email: body.new_email,
        expires_in_minutes: 30,
      });
    }
    if (method === "post" && cleanUrl === "email-change/resend/") {
      return makeResponse(config, 200, {
        detail: `Resent confirmation link to ${state.emailChange?.new_email}.`,
        new_email: state.emailChange?.new_email,
        expires_in_minutes: 30,
      });
    }

    // Clearance Roles, Access Roles & Users
    if (method === "get" && cleanUrl === "access/roles/") {
      return makeResponse(config, 200, state.roles.map((r) => ({ ...r, group_id: r.id, member_count: 1, description: r.name })));
    }
    if (method === "get" && cleanUrl === "users/") {
      const allUsers = Object.values(state.users);
      let filtered = allUsers;
      if (config.params?.group_name) {
        const grp = String(config.params.group_name).toLowerCase();
        filtered = filtered.filter((u) => (u.groups || []).some((g) => String(g).toLowerCase() === grp));
      }
      if (config.params?.is_staff) {
        filtered = filtered.filter((u) => u.is_staff || (u.groups || []).some((g) => g !== "Students"));
      }
      if (config.params?.exclude_admins) {
        const adminSet = new Set(["school admins", "institute admins", "clearance management system admins", "institute staffs", "institute staff"]);
        filtered = filtered.filter(
          (u) => !u.is_superuser && !(u.groups || []).some((g) => adminSet.has(String(g).toLowerCase())),
        );
      }
      if (config.params?.search) {
        const q = String(config.params.search).toLowerCase();
        filtered = filtered.filter((u) => u.username.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q));
      }
      return makeResponse(config, 200, { results: filtered, total_items: filtered.length, total_pages: 1, current_page: 1 });
    }
    const userDetailMatch = cleanUrl.match(/^users\/(\d+)\/$/);
    if (method === "get" && userDetailMatch) {
      const found = Object.values(state.users).find((u) => u.id === Number(userDetailMatch[1]));
      return makeResponse(config, 200, found || null);
    }
    if (method === "post" && cleanUrl === "access/assign/") {
      const target = Object.values(state.users).find((u) => u.id === Number(body.user_id));
      if (target) target.groups = body.roles;
      return makeResponse(config, 200, { user_id: body.user_id, roles: body.roles });
    }
    if (method === "get" && cleanUrl === "clearance-roles/") {
      return makeResponse(config, 200, { results: state.roles, total_items: state.roles.length, total_pages: 1, current_page: 1 });
    }
    if (method === "get" && cleanUrl === "clearance-types/") {
      return makeResponse(config, 200, { results: state.clearanceTypes, total_items: state.clearanceTypes.length, total_pages: 1, current_page: 1 });
    }
    if (method === "post" && cleanUrl === "clearance-types/") {
      const created = {
        id: state.nextId++,
        name: body.name,
        academic_year: body.academic_year,
        semester: body.semester,
        description: body.description || null,
        target_year_levels: body.target_year_levels || [1, 2, 3, 4],
        is_active: body.is_active ?? true,
        is_issued: false,
        issued_at: null,
        requirements: [],
      };
      state.clearanceTypes.push(created);
      return makeResponse(config, 201, created);
    }
    if (method === "get" && cleanUrl === "clearance-types/admin-summary/") {
      return makeResponse(config, 200, {
        total_students: 120,
        clearance_types: { issued: state.clearanceTypes.filter((t) => t.is_issued).length },
        students_by_year_level: [
          { year_level: 1, count: 30 },
          { year_level: 2, count: 30 },
          { year_level: 3, count: 30 },
          { year_level: 4, count: 30 },
        ],
        student_clearances: {
          total: state.studentClearances.length,
          completed: state.studentClearances.filter((c) => c.overall_status === "completed").length,
          pending: 0,
          in_progress: state.studentClearances.filter((c) => c.overall_status === "in_progress").length,
          rejected: 0,
        },
      });
    }

    const typeDashboardMatch = cleanUrl.match(/^clearance-types\/(\d+)\/dashboard\/$/);
    if (method === "get" && typeDashboardMatch) {
      const type = state.clearanceTypes.find((t) => t.id === Number(typeDashboardMatch[1]));
      const matching = state.studentClearances.filter((c) => c.clearance_type_id === type?.id);
      return makeResponse(config, 200, {
        clearance_type: type,
        stats: {
          issued_students_count: matching.length,
          target_students_count: 120,
          completed_count: matching.filter((c) => c.overall_status === "completed").length,
          pending_count: matching.filter((c) => c.overall_status === "pending").length,
          in_progress_count: matching.filter((c) => c.overall_status !== "completed" && c.overall_status !== "pending").length,
          rejected_count: 0,
        },
      });
    }

    const typeDetailMatch = cleanUrl.match(/^clearance-types\/(\d+)\/$/);
    if (method === "get" && typeDetailMatch) {
      const type = state.clearanceTypes.find((t) => t.id === Number(typeDetailMatch[1]));
      return makeResponse(config, 200, type || null);
    }

    const typeIssueMatch = cleanUrl.match(/^clearance-types\/(\d+)\/issue\/$/);
    if (method === "post" && typeIssueMatch) {
      const type = state.clearanceTypes.find((t) => t.id === Number(typeIssueMatch[1]));
      if (type) {
        type.is_issued = true;
        type.issued_at = "2026-11-26T12:00:00Z";
        const newClearanceId = state.nextId++;
        state.studentClearances.push({
          id: newClearanceId,
          student_id: 10,
          student_name: "Froyd Carbajosa",
          student_number: "202400633",
          program: "BSIT",
          year_level: 3,
          s_set: "C",
          clearance_type_id: type.id,
          clearance_type_name: type.name,
          academic_year: type.academic_year,
          semester: type.semester,
          overall_status: "pending",
          verification_token: null,
          is_enrolled: false,
          completed_at: null,
        });
        for (const req of type.requirements) {
          state.items.push({
            id: state.nextId++,
            student_clearance_id: newClearanceId,
            requirement_id: req.id,
            requirement_name: req.name,
            authorizing_role_name: req.authorizing_role_name,
            order_sequence: req.order_sequence,
            status: "pending",
            amount_due: "0.00",
            remarks: null,
            proof_attachment: null,
            proof_attachment_url: null,
            proof_notes: null,
            proof_uploaded_at: null,
            cleared_at: null,
          });
        }
      }
      return makeResponse(config, 200, { detail: "Issued." });
    }

    if (method === "post" && cleanUrl === "clearance-requirements/") {
      const type = state.clearanceTypes.find((t) => t.id === Number(body.clearance_type));
      const role = state.roles.find((r) => r.id === Number(body.authorizing_role));
      const req = {
        id: state.nextId++,
        clearance_type: Number(body.clearance_type),
        name: body.name,
        authorizing_role_id: role?.id ?? null,
        authorizing_role_ids: role ? [role.id] : [],
        authorizing_role_name: role?.name ?? "Office",
        order_sequence: Number(body.order_sequence),
      };
      type?.requirements.push(req);
      return makeResponse(config, 201, req);
    }

    // Student Clearances
    if (method === "get" && cleanUrl === "student-clearances/my-clearances/") {
      return makeResponse(config, 200, state.studentClearances.map(hydrateClearance));
    }
    if (method === "get" && cleanUrl === "student-clearances/") {
      return makeResponse(config, 200, {
        results: state.studentClearances.map(hydrateClearance),
        total_items: state.studentClearances.length,
        total_pages: 1,
        current_page: 1,
      });
    }
    if (method === "get" && cleanUrl === "student-clearances/program-chair-dashboard/") {
      return makeResponse(config, 200, state.studentClearances.map(hydrateClearance));
    }
    const clearanceDetailMatch = cleanUrl.match(/^student-clearances\/(\d+)\/$/);
    if (method === "get" && clearanceDetailMatch) {
      const found = state.studentClearances.find((c) => c.id === Number(clearanceDetailMatch[1]));
      return makeResponse(config, 200, found ? hydrateClearance(found) : null);
    }
    const enrollMatch = cleanUrl.match(/^student-clearances\/(\d+)\/enroll\/$/);
    if (method === "post" && enrollMatch) {
      const found = state.studentClearances.find((c) => c.id === Number(enrollMatch[1]));
      if (found) found.is_enrolled = true;
      return makeResponse(config, 200, { is_enrolled: true });
    }

    // Student Clearance Items
    if (method === "get" && cleanUrl === "student-clearance-items/signatory-dashboard/") {
      return makeResponse(config, 200, {
        total_assigned: state.items.length,
        pending_count: state.items.filter((i) => i.status === "pending").length,
        deficiency_count: state.items.filter((i) => i.status === "has_issue").length,
        under_review_count: state.items.filter((i) => i.status === "under_review").length,
        cleared_count: state.items.filter((i) => i.status === "cleared").length,
      });
    }
    if (method === "get" && cleanUrl === "student-clearance-items/") {
      let rows = state.items.map((item) => {
        const allForClearance = clearanceItemsFor(item.student_clearance_id);
        return allForClearance.find((r) => r.id === item.id) || item;
      });
      if (config.params?.status) {
        rows = rows.filter((r) => r.status === config.params.status);
      }
      if (config.params?.student_clearance) {
        rows = rows.filter((r) => r.student_clearance_id === Number(config.params.student_clearance));
      }
      return makeResponse(config, 200, { results: rows, total_items: rows.length, total_pages: 1, current_page: 1 });
    }
    const itemDetailMatch = cleanUrl.match(/^student-clearance-items\/(\d+)\/$/);
    if (method === "get" && itemDetailMatch) {
      const found = state.items.find((i) => i.id === Number(itemDetailMatch[1]));
      return makeResponse(config, 200, found || null);
    }
    if (method === "patch" && itemDetailMatch) {
      const item = state.items.find((i) => i.id === Number(itemDetailMatch[1]));
      if (!item) return makeResponse(config, 404, { detail: "Not found" });
      const requestedStatus = body.status === "deficiency" ? "has_issue" : body.status;
      if (requestedStatus === "cleared") {
        const blocker = state.items.find(
          (prev) =>
            prev.student_clearance_id === item.student_clearance_id &&
            prev.order_sequence < item.order_sequence &&
            prev.status !== "cleared",
        );
        if (blocker) {
          return makeResponse(config, 400, {
            detail: `Sequential clearance locked: '${blocker.requirement_name}' (Step ${blocker.order_sequence}) must be cleared first.`,
            blocked_by: blocker.requirement_name,
            blocking_step: blocker.order_sequence,
            blocking_item_id: blocker.id,
          });
        }
        item.cleared_at = "2026-11-26T12:00:00Z";
      }
      if (requestedStatus) item.status = requestedStatus;
      if ("remarks" in body) item.remarks = body.remarks;
      if ("amount_due" in body) item.amount_due = body.amount_due == null ? "0.00" : String(body.amount_due);
      refreshOverallStatus(item.student_clearance_id);
      return makeResponse(config, 200, item);
    }

    const uploadProofMatch = cleanUrl.match(/^student-clearance-items\/(\d+)\/upload-proof\/$/);
    if (method === "post" && uploadProofMatch) {
      const item = state.items.find((i) => i.id === Number(uploadProofMatch[1]));
      if (!item) return makeResponse(config, 404, { detail: "Not found" });
      item.status = "under_review";
      item.proof_attachment = "https://res.cloudinary.com/ubxjjws9/image/upload/v1/receipt.jpg";
      item.proof_attachment_url = item.proof_attachment;
      item.proof_notes = body.proof_notes || "GCash Ref 90123456";
      item.proof_uploaded_at = "2026-11-26T12:05:00Z";
      refreshOverallStatus(item.student_clearance_id);
      return makeResponse(config, 200, item);
    }

    const removeProofMatch = cleanUrl.match(/^student-clearance-items\/(\d+)\/remove-proof\/$/);
    if (method === "delete" && removeProofMatch) {
      const item = state.items.find((i) => i.id === Number(removeProofMatch[1]));
      if (!item) return makeResponse(config, 404, { detail: "Not found" });
      item.proof_attachment = null;
      item.proof_attachment_url = null;
      item.proof_notes = null;
      item.proof_uploaded_at = null;
      item.status = item.remarks ? "has_issue" : "pending";
      refreshOverallStatus(item.student_clearance_id);
      return makeResponse(config, 204, null);
    }

    // Notifications
    if (method === "get" && cleanUrl === "notifications/") {
      return makeResponse(config, 200, state.notifications);
    }
    if (method === "get" && cleanUrl === "notifications/unread-count/") {
      return makeResponse(config, 200, { unread_count: 0 });
    }
    if (method === "post" && cleanUrl === "notifications/mark-all-read/") {
      return makeResponse(config, 200, { detail: "Marked all read" });
    }

    return makeResponse(config, 404, { detail: `Unhandled mock route: ${method.toUpperCase()} ${cleanUrl}` });
  };

  apiClient.defaults.adapter = adapter;
  return state;
}
