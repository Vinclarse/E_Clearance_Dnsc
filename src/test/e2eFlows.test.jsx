import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import StudentDashboard from "../pages/StudentDashboard.jsx";
import SignatoryApp from "../signatory/SignatoryApp.jsx";
import ClearanceTemplates from "../admin/pages/ClearanceTemplates.jsx";
import ExecutiveDashboard from "../admin/pages/ExecutiveDashboard.jsx";
import ProfileSection from "../components/ProfileSection.jsx";
import { createMockBackend } from "./mockServer.js";

describe("E-Clearance DNSC End-to-End User Flows", () => {
  let backend;

  beforeEach(() => {
    backend = createMockBackend();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    window.history.replaceState({}, "", "/");
  });

  it("Flow 1: renders clean homepage footer and resolves documented portal sub-routes", async () => {
    render(<App />);
    expect(screen.getByText("Institute of Computing")).toBeInTheDocument();
    expect(screen.queryByText(/mock data/i)).not.toBeInTheDocument();

    localStorage.setItem("auth_token", "mock-access-token");
    backend.currentUserKey = "student";
    window.history.replaceState({}, "", "/student/history");

    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Clearance History" })).toBeInTheDocument();
    });
  });

  it("Flow 2: Admin creates a multi-clearance template by cloning steps, adds a step, issues it, and filters Executive Dashboard", async () => {
    const user = userEvent.setup();
    backend.currentUserKey = "admin";

    render(<ClearanceTemplates />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("2nd Semester Clearance")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /New template/i }));
    const dialog = screen.getByRole("dialog", { name: /Create Clearance Template/i });
    await user.type(within(dialog).getByLabelText(/Clearance Title/i), "Summer Clearance");
    await user.clear(within(dialog).getByLabelText(/Semester/i));
    await user.type(within(dialog).getByLabelText(/Semester/i), "Summer");
    await user.click(within(dialog).getByRole("button", { name: /Create Template/i }));

    await waitFor(() => {
      expect(screen.getByText(/Created "Summer Clearance" with 2 sequential step\(s\)/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Add step/i }));
    const stepDialog = screen.getByRole("dialog", { name: /Add Sequential Requirement/i });
    await user.type(within(stepDialog).getByLabelText(/Requirement Name/i), "Chair Approval");
    await user.click(within(stepDialog).getByRole("button", { name: /Add Step/i }));

    await waitFor(() => {
      expect(screen.getByText("Chair Approval")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Issue Clearance to Students/i }));
    await waitFor(() => {
      expect(screen.getByText(/Clearance records have been issued/i)).toBeInTheDocument();
    });
    expect(backend.clearanceTypes.some((t) => t.name === "Summer Clearance" && t.is_issued)).toBe(true);

    render(<ExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Select clearance template for dashboard/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /^Past \(/i }));
    await user.click(screen.getByRole("button", { name: /^Active \(/i }));
    expect(screen.getByText("Clearance Status Distribution")).toBeInTheDocument();
  });

  it("Flow 3: Student switches active/past clearances, uploads & removes proof, and verifies QR URL", async () => {
    const user = userEvent.setup();
    backend.currentUserKey = "student";
    localStorage.setItem("auth_token", "mock-access-token");

    render(<StudentDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Overdue book: Database Systems/i)).toBeInTheDocument();
    });

    // Switch to History and inspect completed 1st Semester Certificate & QR
    await user.click(screen.getAllByText("History")[0]);
    expect(screen.getByRole("heading", { name: "Clearance History" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Past \/ Completed/i }));
    expect(screen.getByText("1st Semester Clearance")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Certificate & QR/i }));
    await waitFor(() => {
      const verifyLink = screen.getByRole("link", { name: /Scan or open verification page/i });
      expect(verifyLink).toHaveAttribute(
        "href",
        "https://e-clearance-system-api.onrender.com/verify/11111111-2222-3333-4444-555555555555/",
      );
    });

    // Switch back to Active 2nd Semester clearance via top switcher and upload proof
    await user.click(screen.getByRole("button", { name: /^Active \(/i }));
    await user.click(screen.getAllByText("Dashboard")[0]);
    await waitFor(() => {
      expect(screen.getByText(/Overdue book: Database Systems/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Upload proof of settlement/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Upload proof of settlement/i }));

    const fileInput = document.getElementById("clearance-file-input");
    const receipt = new File(["receipt-bytes"], "receipt.png", { type: "image/png" });
    await user.upload(fileInput, receipt);
    await user.type(screen.getByPlaceholderText(/GCash Reference Number/i), "GCash Ref 555666");
    await user.click(screen.getByRole("button", { name: /Submit Clearance File/i }));
    await user.click(screen.getByRole("button", { name: /Confirm Submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Successfully Uploaded/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Done" }));

    // Return to Dashboard, see Under review + Remove proof, then remove the proof
    await user.click(screen.getAllByText("Dashboard")[0]);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Remove proof/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /^Remove proof$/ }));
    await user.click(screen.getByRole("button", { name: /^Remove Proof$/ }));

    await waitFor(() => {
      expect(backend.items.find((i) => i.id === 6001).proof_attachment).toBeNull();
    });
  });

  it("Flow 4: Signatory filters cycles, checks sequential lock tooltip, flags deficiency, rejects & approves proof, and validates enrollment", async () => {
    const user = userEvent.setup();
    backend.currentUserKey = "signatory";
    localStorage.setItem("auth_token", "mock-access-token");

    render(<SignatoryApp />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Filter by clearance cycle/i)).toBeInTheDocument();
    });

    // Scope to 2nd Semester Clearance
    await user.selectOptions(screen.getByLabelText(/Filter by clearance cycle/i), "2");
    await user.click(screen.getByRole("button", { name: /^Approval Queue$/i }));

    // Step 2 (Cashier) must be locked with Step 1 prerequisite tooltip
    const cashierRow = screen.getByText("Cashier Clearance").closest("tr");
    const lockedBtn = within(cashierRow).getByRole("button", { name: /Locked/i });
    expect(lockedBtn).toBeDisabled();
    expect(lockedBtn).toHaveAttribute("title", "Waiting for Step 1: Library Clearance");

    // Flag Deficiency via Modal SIG-3 on Step 1
    const libraryRow = screen.getByText("Library Clearance").closest("tr");
    await user.click(within(libraryRow).getByRole("button", { name: /Flag/i }));
    const remarksInput = screen.getByLabelText(/REASON \/ REMARKS/i);
    await user.clear(remarksInput);
    await user.type(remarksInput, "Missing lab clearance kit");
    const amountInput = screen.getByLabelText(/AMOUNT DUE IN PHP/i);
    await user.clear(amountInput);
    await user.type(amountInput, "250");
    await user.click(screen.getByRole("button", { name: /Confirm Deficiency/i }));

    await waitFor(() => {
      const item = backend.items.find((i) => i.id === 6001);
      expect(item.status).toBe("has_issue");
      expect(item.remarks).toBe("Missing lab clearance kit");
    });

    // Simulate student proof upload so item enters under_review -> SIG3 Ready for Review
    const targetItem = backend.items.find((i) => i.id === 6001);
    targetItem.status = "under_review";
    targetItem.proof_attachment = "https://res.cloudinary.com/ubxjjws9/image/upload/v1/receipt.jpg";
    targetItem.proof_attachment_url = targetItem.proof_attachment;
    targetItem.proof_notes = "Paid at window 2";
    targetItem.proof_uploaded_at = "2026-11-26T12:15:00Z";

    // Refresh via Deficiencies & Proofs
    await user.click(screen.getAllByLabelText("Refresh")[0]);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Deficiencies & Proofs$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /^Deficiencies & Proofs$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Inspect Proof/i })).toBeInTheDocument();
    });

    // Reject Proof in SIG-4
    await user.click(screen.getByRole("button", { name: /Inspect Proof/i }));
    await user.click(screen.getByRole("button", { name: /^Reject Proof$/i }));
    await user.type(screen.getByLabelText(/REASON FOR REJECTING PROOF/i), "Receipt image is blurry");
    await user.click(screen.getByRole("button", { name: /Confirm Reject Proof/i }));

    await waitFor(() => {
      expect(backend.items.find((i) => i.id === 6001).status).toBe("has_issue");
      expect(backend.items.find((i) => i.id === 6001).remarks).toBe("Receipt image is blurry");
    });

    // Re-upload and approve both steps sequentially, then validate enrollment in SIG-5
    targetItem.status = "under_review";
    await user.click(screen.getAllByLabelText("Refresh")[0]);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Inspect Proof/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Inspect Proof/i }));
    await user.click(screen.getByRole("button", { name: /Approve Sign-Off/i }));

    await waitFor(() => {
      expect(backend.items.find((i) => i.id === 6001).status).toBe("cleared");
    });

    // Approve Step 2 in Queue and validate enrollment in Cohort Overview
    await user.click(screen.getByRole("button", { name: /^Approval Queue$/i }));
    const unlockedCashierRow = screen.getByText("Cashier Clearance").closest("tr");
    await user.click(within(unlockedCashierRow).getByRole("button", { name: /^Approve$/i }));

    await waitFor(() => {
      expect(backend.items.find((i) => i.id === 6002).status).toBe("cleared");
    });

    await user.click(screen.getByRole("button", { name: /^Cohort Overview$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Validate for Enrollment/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Validate for Enrollment/i }));

    await waitFor(() => {
      expect(backend.studentClearances.find((c) => c.id === 1002).is_enrolled).toBe(true);
    });
  }, 15000);

  it("Flow 5: Self-service email change completes request -> verify code -> set new -> resend -> cancel", async () => {
    const user = userEvent.setup();
    backend.currentUserKey = "student";
    localStorage.setItem("auth_token", "mock-access-token");

    render(
      <MemoryRouter>
        <ProfileSection />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Send Verification Code/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Send Verification Code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/Verification Code/i), "123456");
    await user.click(screen.getByRole("button", { name: /Verify Code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/New Email Address/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/New Email Address/i), "froyd.updated@dnsc.edu.ph");
    await user.click(screen.getByRole("button", { name: /Send Confirmation Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/A confirmation link was sent to/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Resend Link/i }));
    await waitFor(() => {
      expect(screen.getByText(/Resent confirmation link/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.getByText(/Email change request cancelled/i)).toBeInTheDocument();
    });
  });
});
