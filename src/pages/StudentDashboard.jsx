import { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import MobileNavigation from "../components/MobileNavigation";
import HeroBanner from "../components/HeroBanner";
import OverviewCards from "../components/OverviewCards";
import MainContent from "../components/MainContent";
import ProfileSection from "../components/ProfileSection";
import ClearanceRequest from "../components/ClearanceRequest";
import ClearanceTracker from "../components/ClearanceTracker";
import DownloadClearance from "../components/DownloadClearance";
import apiClient from "../services/api";
import "../styles/theme.css";
import "../styles/dashboard.css";

const responsePayload = (data) => (
  data && typeof data === "object" && !Array.isArray(data) && "data" in data
    ? data.data
    : data
);

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

function StudentDashboard() {
  const isDesignPreview = new URLSearchParams(window.location.search).get("preview") === "true";
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [customNotification, setCustomNotification] = useState(null);
  const [requirements, setRequirements] = useState(() => isDesignPreview ? previewRequirements : []);
  const [clearanceRecord, setClearanceRecord] = useState(() => isDesignPreview ? previewClearance : null);
  const [clearanceError, setClearanceError] = useState("");
  const [loadingClearance, setLoadingClearance] = useState(!isDesignPreview);
  const [reloadKey, setReloadKey] = useState(0);
  const [requestItemId, setRequestItemId] = useState(null);

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
  }, [isDesignPreview]);

  useEffect(() => {
    if (isDesignPreview) return undefined;

    let isMounted = true;

    apiClient.get("student-clearances/my-clearances/")
      .then(async (res) => {
        if (!isMounted) return;
        const clearance = selectClearance(extractCollection(res.data).items);
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
  }, [isDesignPreview, reloadKey]);

  const handleAvatarStateChange = (newUrl) => {
    setAvatarPreview(newUrl);
  };

  const handleGlobalStatusUpdate = (itemId, newStatus) => {
    setRequirements((prevItems) =>
      prevItems.map((item) =>
        item.id === parseInt(itemId)
          ? { ...item, status: newStatus === "has_issue" ? "deficiency" : newStatus }
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
  const clearRequestedItem = useCallback(() => setRequestItemId(null), []);
  const retryClearanceLoad = () => {
    setLoadingClearance(true);
    setClearanceError("");
    setReloadKey((key) => key + 1);
  };

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name.charAt(0).toUpperCase()}${profile.last_name.charAt(0).toUpperCase()}`
    : profile?.name 
      ? profile.name.charAt(0).toUpperCase()
      : "A";

  const overallStatus = calculateOverallStatus();

  return (
    <div className="dashboard-container">
      {isMobile ? (
        <MobileNavigation 
          activeTab={currentTab} 
          setActiveTab={setCurrentTab} 
          avatarUrl={avatarPreview} 
          userInitials={initials}
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
          requirements={requirements}
          injectedAlert={customNotification}
          clearInjectedAlert={() => setCustomNotification(null)}
        />
      )}

      <main className="dashboard-content">
        {isDesignPreview && currentTab === "dashboard" && (
          <div className="dashboard-preview-notice" role="status">
            Design preview — sample data, not live clearance information
          </div>
        )}
        {loadingClearance && currentTab !== "profile" ? (
          <div className="dashboard-state" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <strong>Loading your clearance</strong>
            <span>Getting your latest requirements and progress.</span>
          </div>
        ) : clearanceError && currentTab !== "profile" ? (
          <div className="dashboard-state dashboard-error-state" role="alert">
            <span className="dashboard-state-icon" aria-hidden="true">!</span>
            <strong>We couldn’t load your clearance</strong>
            <span>{clearanceError}</span>
            <button type="button" className="dashboard-retry-button" onClick={retryClearanceLoad}>
              Try again
            </button>
          </div>
        ) : currentTab === "dashboard" && !clearanceRecord ? (
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
      </main>
    </div>
  );
}

export default StudentDashboard;