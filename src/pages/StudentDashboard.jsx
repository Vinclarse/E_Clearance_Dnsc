import { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import MobileNavigation from "../components/MobileNavigation";
import HeroBanner from "../components/HeroBanner";
import OverviewCards from "../components/OverviewCards";
import MainContent from "../components/MainContent";
import ProfileSection from "../components/ProfileSection";
import ClearanceRequest from "../components/ClearanceRequest";
import ClearanceTracker from "../components/ClearanceTracker";
import ClearanceHistory from "../components/ClearanceHistory";
import DownloadClearance from "../components/DownloadClearance";
import apiClient from "../services/api";
import PortalLoading from "../components/PortalLoading.jsx";
import { subscribeAccount, subscribePortalRefresh } from "../services/portalRefresh.js";
import "../styles/theme.css";
import "../styles/dashboard.css";

const responsePayload = (data) => (
  data && typeof data === "object" && !Array.isArray(data) && "data" in data
    ? data.data
    : data
);

const textValue = (value) => (typeof value === "string" && value.trim() ? value.trim() : "");

async function withClearanceTerm(clearance) {
  const nested = clearance?.clearance_type && typeof clearance.clearance_type === "object"
    ? clearance.clearance_type
    : {};
  let semester = textValue(clearance?.semester) || textValue(nested.semester);
  let academicYear = textValue(clearance?.academic_year) || textValue(nested.academic_year);
  let typeName = textValue(clearance?.clearance_type_name) || textValue(nested.name) || textValue(nested.clearance_type_name);
  const typeId = clearance?.clearance_type_id || nested.id;

  if ((!semester || !academicYear || !typeName) && typeId) {
    try {
      const response = await apiClient.get(`clearance-types/${typeId}/`);
      const type = responsePayload(response.data);
      semester = semester || textValue(type?.semester);
      academicYear = academicYear || textValue(type?.academic_year);
      typeName = typeName || textValue(type?.name);
    } catch (error) {
      console.error("Failed to load the clearance term:", error);
    }
  }

  return {
    ...clearance,
    semester,
    academic_year: academicYear,
    clearance_type_name: typeName,
    clearance_type_is_active: nested.is_active ?? clearance?.clearance_type_is_active ?? null,
  };
}

const extractCollection = (data) => {
  const payload = responsePayload(data);
  if (Array.isArray(payload)) {
    return { items: payload, next: null, currentPage: 1, totalPages: 1 };
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.results)) {
      return { items: payload.results, next: payload.next ?? null, currentPage: null, totalPages: null };
    }
    if (Array.isArray(payload.items)) {
      return { items: payload.items, next: payload.next ?? null, currentPage: null, totalPages: null };
    }
    if (Array.isArray(payload.data)) {
      const currentPage = Number(payload.current_page ?? 1);
      const totalPages = Number(payload.total_pages ?? (Number.isInteger(currentPage) ? currentPage : 1));
      return {
        items: payload.data,
        next: null,
        currentPage: Number.isInteger(currentPage) ? currentPage : 1,
        totalPages: Number.isInteger(totalPages) ? totalPages : 1,
      };
    }
    if (payload.id != null) {
      return { items: [payload], next: null, currentPage: 1, totalPages: 1 };
    }
  }

  if (payload == null) return { items: [], next: null, currentPage: 1, totalPages: 1 };
  throw new Error("The API returned an unexpected clearance response.");
};

const isClearanceRecord = (value) => (
  value != null &&
  typeof value === "object" &&
  value.id != null &&
  Number.isInteger(Number(value.id))
);

const selectClearance = (clearances) => {
  const ranked = clearances
    .filter(isClearanceRecord)
    .map((clearance, index) => {
      const status = String(clearance.overall_status ?? clearance.status ?? "").toLowerCase();
      const hasItems = Array.isArray(clearance.items) && clearance.items.length > 0;
      const rank = status === "in_progress"
        ? 0
        : hasItems && status !== "completed" && status !== "rejected"
          ? 1
          : status === "pending"
            ? 2
            : hasItems
              ? 3
              : 4;
      return { clearance, index, rank };
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index);

  return ranked[0]?.clearance ?? null;
};

const normalizeRequirement = (item) => {
  if (!item || typeof item.status !== "string") {
    throw new Error("The API returned a clearance requirement without a status.");
  }

  const status = item.status.toLowerCase().replace(/[\s-]+/g, "_");
  return {
    ...item,
    status: status === "has_issue" ? "deficiency" : status,
  };
};

const fetchClearanceItems = async (clearanceId) => {
  const items = [];
  let currentPage = 1;

  while (true) {
    const response = await apiClient.get("student-clearance-items/", {
      params: {
        student_clearance: clearanceId,
        current_page: currentPage,
        per_page: 100,
      },
    });
    const page = extractCollection(response.data);
    items.push(...page.items);

    if (page.totalPages != null) {
      if (currentPage >= page.totalPages) return items;
      currentPage += 1;
      continue;
    }

    if (!page.next) return items;

    const nextPage = new URL(page.next, window.location.origin)
      .searchParams.get("current_page");
    const nextPageNumber = Number(nextPage);
    if (!Number.isInteger(nextPageNumber) || nextPageNumber <= currentPage) {
      throw new Error("The API returned an invalid clearance pagination link.");
    }
    currentPage = nextPageNumber;
  }
};

const previewRequirements = [
  { id: "preview-1", order_sequence: 1, requirement_name: "Student Affairs", authorizing_role_name: "Student Affairs Office", status: "cleared", cleared_at: "2026-11-03" },
  { id: "preview-2", order_sequence: 2, requirement_name: "Library", authorizing_role_name: "Library Office", status: "cleared", cleared_at: "2026-11-04" },
  { id: "preview-3", order_sequence: 3, requirement_name: "Finance Office", authorizing_role_name: "Accounting Office", status: "deficiency", remarks: "Please upload proof of payment for the outstanding balance.", amount_due: 250 },
  { id: "preview-4", order_sequence: 4, requirement_name: "Guidance Office", authorizing_role_name: "Guidance Office", status: "pending" },
  { id: "preview-5", order_sequence: 5, requirement_name: "Laboratory", authorizing_role_name: "Laboratory Office", status: "pending" },
  { id: "preview-6", order_sequence: 6, requirement_name: "Registrar", authorizing_role_name: "Registrar’s Office", status: "pending" },
];

const previewClearance = {
  overall_status: "deficiency",
  semester: "First Semester",
  academic_year: "2026-2027",
  clearance_type_name: "Student Clearance",
};

function initialStudentTab() {
  const path = window.location.pathname.replace(/\/+$/, "").toLowerCase();
  if (path === "/student/request") return "request";
  if (path === "/student/tracker" || path === "/student/track") return "track";
  if (path === "/student/history") return "history";
  if (path === "/student/download" || path === "/student/certificate") return "download";
  if (path === "/student/profile") return "profile";
  return "dashboard";
}

function isPastStudentClearance(clearance) {
  const status = String(clearance?.overall_status ?? clearance?.status ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  return status === "completed" || status === "cleared" || status === "rejected" || clearance?.clearance_type_is_active === false;
}

function formatClearanceOptionLabel(clearance) {
  const title = clearance?.clearance_type_name || "Semestral Clearance";
  const term = [clearance?.academic_year, clearance?.semester].filter(Boolean).join(" · ");
  const tag = isPastStudentClearance(clearance) ? "Past" : "Active";
  return term ? `${title} (${term}) — ${tag}` : `${title} — ${tag}`;
}

function StudentDashboard() {
  const isDesignPreview = new URLSearchParams(window.location.search).get("preview") === "true";
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTab, setCurrentTab] = useState(initialStudentTab);
  const [clearanceScope, setClearanceScope] = useState("all");
  const [profile, setProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [customNotification, setCustomNotification] = useState(null);
  const [requirements, setRequirements] = useState(() => isDesignPreview ? previewRequirements : []);
  const [allClearances, setAllClearances] = useState(() => isDesignPreview ? [{ id: "preview-clearance", ...previewClearance }] : []);
  const [clearanceRecord, setClearanceRecord] = useState(() => isDesignPreview ? { id: "preview-clearance", ...previewClearance } : null);
  const [selectedClearanceId, setSelectedClearanceId] = useState(null);
  const [clearanceError, setClearanceError] = useState("");
  const [loadingClearance, setLoadingClearance] = useState(!isDesignPreview);
  const [reloadKey, setReloadKey] = useState(0);
  const [requestItemId, setRequestItemId] = useState(null);
  const [removingProofItem, setRemovingProofItem] = useState(null);
  const [isRemovingProof, setIsRemovingProof] = useState(false);
  const [removeProofError, setRemoveProofError] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    if (isDesignPreview) {
      return () => window.removeEventListener("resize", handleResize);
    }

    apiClient.get("me/")
      .then((res) => {
        const data = responsePayload(res.data);
        const currentProfile = Array.isArray(data) ? data[0] ?? null : data;
        setProfile(currentProfile);
        setAvatarPreview(currentProfile?.profile_url ?? currentProfile?.profile ?? null);
      })
      .catch((err) => console.error("Failed to load the current user profile:", err));

    return () => window.removeEventListener("resize", handleResize);
  }, [isDesignPreview, reloadKey]);

  useEffect(() => {
    if (isDesignPreview) return undefined;
    return subscribePortalRefresh(() => {
      setLoadingClearance(true);
      setReloadKey((key) => key + 1);
    });
  }, [isDesignPreview]);

  useEffect(() => subscribeAccount((account) => {
    if (!account) return;
    setProfile(account);
    setAvatarPreview(account.profile_url ?? account.profile ?? null);
  }), []);

  useEffect(() => {
    if (isDesignPreview) return undefined;

    let isMounted = true;

    apiClient.get("student-clearances/my-clearances/")
      .then(async (res) => {
        if (!isMounted) return;
        const rawClearances = extractCollection(res.data).items.filter(isClearanceRecord);
        const termedClearances = await Promise.all(rawClearances.map((entry) => withClearanceTerm(entry)));
        if (!isMounted) return;

        setAllClearances(termedClearances);
        const matched = selectedClearanceId != null
          ? termedClearances.find((entry) => String(entry.id) === String(selectedClearanceId))
          : null;
        const clearance = matched || selectClearance(termedClearances);

        if (!clearance) {
          setClearanceRecord(null);
          setRequirements([]);
          return;
        }

        const embeddedItems = Array.isArray(clearance.items) ? clearance.items : [];
        const extractedItems = embeddedItems.length > 0
          ? embeddedItems
          : await fetchClearanceItems(clearance.id);
        if (!isMounted) return;
        setClearanceRecord({
          ...clearance,
          status: clearance.status ?? clearance.overall_status,
          overall_status: clearance.overall_status ?? clearance.status,
        });
        setRequirements(
          extractedItems
            .map(normalizeRequirement)
            .map((item, index) => ({ item, index }))
            .sort((a, b) => (
              (a.item.order_sequence ?? a.index + 1) -
              (b.item.order_sequence ?? b.index + 1)
            ))
            .map(({ item }) => item),
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to fetch student clearance:", err);
        setClearanceRecord(null);
        setRequirements([]);
        setClearanceError("We couldn’t load your clearance information. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoadingClearance(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isDesignPreview, reloadKey, selectedClearanceId]);

  const handleAvatarStateChange = (newUrl) => {
    setAvatarPreview(newUrl);
  };

  const handleGlobalStatusUpdate = (itemId, updatedItem) => {
    const newStatus = typeof updatedItem === "string" ? updatedItem : updatedItem?.status;
    setRequirements((prevItems) =>
      prevItems.map((item) =>
        item.id === parseInt(itemId)
          ? {
              ...item,
              ...(updatedItem && typeof updatedItem === "object" ? updatedItem : {}),
              status: newStatus === "has_issue" ? "deficiency" : (newStatus || item.status),
            }
          : item
      )
    );
  };

  const triggerUploadNotification = (officeName) => {
    setCustomNotification({
      id: `upload-event-${Date.now()}`,
      text: `Your settlement proof file for ${officeName} has been submitted successfully and is under review.`,
      type: "info",
      time: "Just now"
    });
  };

  const calculateOverallStatus = () => {
    const normalizeStatus = (status) => (status || "").toLowerCase().replace(/[\s-]+/g, "_");
    const deficiencyCount = requirements.filter(item => normalizeStatus(item.status) === "deficiency").length;
    const underReviewCount = requirements.filter(item => normalizeStatus(item.status) === "under_review").length;
    const clearedCount = requirements.filter(item => normalizeStatus(item.status) === "cleared").length;
    const recordStatus = normalizeStatus(clearanceRecord?.overall_status);

    if (deficiencyCount > 0 || recordStatus === "deficiency" || recordStatus === "has_issue") return "DEFICIENCY";
    if (recordStatus === "completed" || (requirements.length > 0 && clearedCount === requirements.length)) return "COMPLETED";
    if (recordStatus === "rejected") return "REJECTED";
    if (underReviewCount > 0 || recordStatus === "under_review" || recordStatus === "in_progress") return "UNDER REVIEW";
    return "PENDING";
  };

  const openProofRequest = (itemId) => {
    setRequestItemId(itemId);
    setCurrentTab("request");
  };
  const openRemoveProofModal = (item) => {
    setRemovingProofItem(item);
    setRemoveProofError("");
  };
  const closeRemoveProofModal = () => {
    if (isRemovingProof) return;
    setRemovingProofItem(null);
    setRemoveProofError("");
  };
  const confirmRemoveProof = async () => {
    if (!removingProofItem || isRemovingProof) return;
    setIsRemovingProof(true);
    setRemoveProofError("");
    try {
      await apiClient.delete(`student-clearance-items/${removingProofItem.id}/remove-proof/`);
      const officeName = removingProofItem.requirement_name || "your requirement";
      setCustomNotification({
        id: `remove-proof-${Date.now()}`,
        text: `Your submitted settlement proof for ${officeName} was removed.`,
        type: "info",
        time: "Just now",
      });
      setRemovingProofItem(null);
      setLoadingClearance(true);
      setReloadKey((key) => key + 1);
    } catch (error) {
      const data = error?.response?.data;
      const msg = data?.detail || data?.errors?.detail || (data?.message !== "Error" ? data?.message : "");
      setRemoveProofError(typeof msg === "string" && msg.trim() ? msg : "Could not remove the submitted proof. Please try again.");
    } finally {
      setIsRemovingProof(false);
    }
  };
  const handleSelectClearanceFromHistory = (record, targetTab = "dashboard") => {
    if (record?.id != null && String(record.id) !== String(clearanceRecord?.id)) {
      setLoadingClearance(true);
      setSelectedClearanceId(record.id);
    }
    setCurrentTab(targetTab);
  };
  const clearRequestedItem = useCallback(() => setRequestItemId(null), []);
  const retryClearanceLoad = () => {
    setLoadingClearance(true);
    setClearanceError("");
    setReloadKey((key) => key + 1);
  };

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ")
    || profile?.name
    || "Student";
  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name.charAt(0).toUpperCase()}${profile.last_name.charAt(0).toUpperCase()}`
    : displayName.charAt(0).toUpperCase() || "S";

  const overallStatus = calculateOverallStatus();
  const scopedClearances = allClearances.filter((entry) => {
    if (clearanceScope === "active") return !isPastStudentClearance(entry);
    if (clearanceScope === "past") return isPastStudentClearance(entry);
    return true;
  });
  const showTermSwitcher = allClearances.length > 1 && ["dashboard", "request", "track", "download", "clearance"].includes(currentTab);

  const handleScopeChange = (nextScope) => {
    setClearanceScope(nextScope);
    const matching = allClearances.filter((entry) => {
      if (nextScope === "active") return !isPastStudentClearance(entry);
      if (nextScope === "past") return isPastStudentClearance(entry);
      return true;
    });
    if (matching.length > 0 && !matching.some((entry) => String(entry.id) === String(clearanceRecord?.id))) {
      setLoadingClearance(true);
      setSelectedClearanceId(matching[0].id);
    }
  };

  return (
    <div className="dashboard-container">
      {isMobile ? (
        <MobileNavigation 
          activeTab={currentTab} 
          setActiveTab={setCurrentTab} 
          avatarUrl={avatarPreview} 
          userInitials={initials}
          displayName={displayName}
          email={profile?.email || ""}
          roleName="Student"
          requirements={requirements}
          injectedAlert={customNotification}
          clearInjectedAlert={() => setCustomNotification(null)}
        />
      ) : (
        <Navigation 
          activeTab={currentTab} 
          setActiveTab={setCurrentTab} 
          avatarUrl={avatarPreview} 
          userInitials={initials}
          displayName={displayName}
          email={profile?.email || ""}
          roleName="Student"
          requirements={requirements}
          injectedAlert={customNotification}
          clearInjectedAlert={() => setCustomNotification(null)}
        />
      )}

      <main className="dashboard-content">
        {showTermSwitcher && !loadingClearance && !clearanceError && (
          <div className="clearance-cycle-bar clearance-cycle-bar--student">
            <div role="group" aria-label="Filter clearance cycle" className="clearance-cycle-pills">
              {[
                { id: "all", label: `All (${allClearances.length})` },
                { id: "active", label: `Active (${allClearances.filter((entry) => !isPastStudentClearance(entry)).length})` },
                { id: "past", label: `Past (${allClearances.filter((entry) => isPastStudentClearance(entry)).length})` },
              ].map((option) => {
                const activeOption = clearanceScope === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={activeOption}
                    onClick={() => handleScopeChange(option.id)}
                    className={`clearance-cycle-btn${activeOption ? " is-active" : ""}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <label className="clearance-cycle-select-wrap">
              <span className="clearance-cycle-select-label">Clearance:</span>
              <select
                aria-label="Select clearance term"
                value={clearanceRecord?.id ?? ""}
                onChange={(event) => {
                  const chosenId = event.target.value;
                  if (chosenId && String(chosenId) !== String(clearanceRecord?.id)) {
                    setLoadingClearance(true);
                    setSelectedClearanceId(chosenId);
                  }
                }}
                className="clearance-cycle-select"
              >
                {(scopedClearances.length > 0 ? scopedClearances : allClearances).map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {formatClearanceOptionLabel(entry)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {isDesignPreview && currentTab === "dashboard" && (
          <div className="dashboard-preview-notice" role="status">
            Design preview — sample data, not live clearance information
          </div>
        )}
        {loadingClearance && currentTab !== "profile" ? (
          <PortalLoading variant="student" title="Loading your clearance" detail="Getting your latest requirements and progress." />
        ) : clearanceError && currentTab !== "profile" ? (
          <div className="dashboard-state dashboard-error-state" role="alert">
            <span className="dashboard-state-icon" aria-hidden="true">!</span>
            <strong>We couldn’t load your clearance</strong>
            <span>{clearanceError}</span>
            <button type="button" className="dashboard-retry-button" onClick={retryClearanceLoad}>
              Try again
            </button>
          </div>
        ) : (
          <div key={currentTab} className="page-fade-in">
            {currentTab === "dashboard" && !clearanceRecord ? (
              <div className="dashboard-state">
                <span className="dashboard-state-icon" aria-hidden="true">✓</span>
                <strong>No active clearance term</strong>
                <span>There isn’t an active clearance checklist for your account right now.</span>
              </div>
            ) : currentTab === "dashboard" ? (
              <div className="dashboard-canvas">
                <HeroBanner requirements={requirements} overallStatus={overallStatus} clearance={clearanceRecord} />
                <OverviewCards requirements={requirements} />
                <MainContent
                  requirements={requirements}
                  onUploadProof={isDesignPreview ? undefined : openProofRequest}
                  onRemoveProof={isDesignPreview ? undefined : openRemoveProofModal}
                />
              </div>
            ) : currentTab === "profile" ? (
              <div className="dashboard-canvas-clearance-request-fix">
                <ProfileSection onAvatarUpdated={handleAvatarStateChange} requirements={requirements} />
              </div>
            ) : currentTab === "request" ? (
              clearanceRecord ? (
                <div className="dashboard-canvas-clearance-request-fix">
                  <ClearanceRequest 
                    requirements={requirements} 
                    onUploadSuccess={handleGlobalStatusUpdate}
                    onUploadTriggered={triggerUploadNotification}
                    onUploadCompleted={() => {
                      setClearanceError("");
                      setReloadKey((key) => key + 1);
                    }}
                    onRemoveProof={isDesignPreview ? undefined : openRemoveProofModal}
                    requestItemId={requestItemId}
                    onRequestItemHandled={clearRequestedItem}
                  />
                </div>
              ) : (
                <div className="dashboard-state">
                  <strong>No active clearance term</strong>
                  <span>A clearance request is unavailable until a checklist is assigned to your account.</span>
                </div>
              )
            ) : currentTab === "track" ? (
              clearanceRecord ? (
                <div className="dashboard-canvas-clearance-request-fix">
                  <ClearanceTracker
                    requirements={requirements}
                    overallStatus={overallStatus}
                    clearance={clearanceRecord}
                  />
                </div>
              ) : (
                <div className="dashboard-state">
                  <strong>No active clearance term</strong>
                  <span>Tracking details will appear when a clearance is assigned to your account.</span>
                </div>
              )
            ) : currentTab === "history" ? (
              <div className="dashboard-canvas-clearance-request-fix">
                <ClearanceHistory
                  clearances={allClearances}
                  activeClearanceId={clearanceRecord?.id}
                  onSelectClearance={handleSelectClearanceFromHistory}
                />
              </div>
            ) : currentTab === "download" || currentTab === "clearance" ? (
              clearanceRecord ? (
                <div className="dashboard-canvas-clearance-request-fix">
                  <DownloadClearance requirements={requirements} clearance={clearanceRecord} />
                </div>
              ) : (
                <div className="dashboard-state">
                  <strong>No active clearance term</strong>
                  <span>A clearance certificate will be available after a clearance is assigned.</span>
                </div>
              )
            ) : (
              <div className="dashboard-canvas">
                <div className="alert-card">Section in active development.</div>
              </div>
            )}
          </div>
        )}
      </main>
      {removingProofItem && (
        <div className="profile-avatar-modal-overlay" onClick={closeRemoveProofModal}>
          <div className="profile-avatar-modal-card-box" onClick={(event) => event.stopPropagation()}>
            <h4>Remove Submitted Proof</h4>
            <p>
              Remove your uploaded settlement proof for{" "}
              <strong>{removingProofItem.requirement_name || "this requirement"}</strong>? You can upload a new receipt afterward.
            </p>
            {removeProofError && (
              <p role="alert" style={{ color: "#AA5757", fontWeight: 600, fontSize: "0.84rem" }}>
                {removeProofError}
              </p>
            )}
            <div className="profile-avatar-modal-actions-row">
              <button
                type="button"
                className="submit-request-form-btn-cancel"
                onClick={closeRemoveProofModal}
                disabled={isRemovingProof}
              >
                Cancel
              </button>
              <button
                type="button"
                className="submit-request-form-btn-aligned"
                style={{ backgroundColor: "#AA5757" }}
                onClick={confirmRemoveProof}
                disabled={isRemovingProof}
              >
                {isRemovingProof ? "Removing…" : "Remove Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;