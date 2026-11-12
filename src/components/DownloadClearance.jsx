import React, { useState } from "react";
import apiClient from "../services/api";

// ---- Minimal QR Code generator (byte mode, error correction level M, versions 1-10) ----
const QR_ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const QR_NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

function qrRawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}

function qrDataCodewords(ver) {
  return Math.floor(qrRawModules(ver) / 8) - QR_ECC_PER_BLOCK[ver] * QR_NUM_BLOCKS[ver];
}

function qrAlignPositions(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const size = ver * 4 + 17;
  const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const res = [6];
  for (let pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
  return res;
}

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree) {
  const res = new Array(degree).fill(0);
  res[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      res[j] = gfMul(res[j], root);
      if (j + 1 < degree) res[j] ^= res[j + 1];
    }
    root = gfMul(root, 2);
  }
  return res;
}

function rsRemainder(data, divisor) {
  const res = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ res.shift();
    res.push(0);
    divisor.forEach((coef, i) => (res[i] ^= gfMul(coef, factor)));
  }
  return res;
}

function qrPenalty(m, size) {
  let score = 0;
  // Rule 1: runs of 5+ same-colour modules
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < size; a++) {
      let run = 1;
      for (let b = 1; b < size; b++) {
        const cur = pass ? m[b][a] : m[a][b];
        const prev = pass ? m[b - 1][a] : m[a][b - 1];
        if (cur === prev) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
    }
  }
  // Rule 2: 2x2 blocks
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  // Rule 3: finder-like patterns
  const p1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const p2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  for (let pass = 0; pass < 2; pass++)
    for (let a = 0; a < size; a++)
      for (let b = 0; b <= size - 11; b++) {
        let f1 = true, f2 = true;
        for (let k = 0; k < 11; k++) {
          const v = (pass ? m[b + k][a] : m[a][b + k]) ? 1 : 0;
          if (v !== p1[k]) f1 = false;
          if (v !== p2[k]) f2 = false;
        }
        if (f1) score += 40;
        if (f2) score += 40;
      }
  // Rule 4: dark/light balance
  let dark = 0;
  for (const row of m) for (const v of row) if (v) dark++;
  const pct = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return score;
}

function generateQR(text) {
  const bytes = Array.from(new TextEncoder().encode(text));

  // pick the smallest version that fits
  let ver = 1;
  for (; ver <= 10; ver++) {
    const countBits = ver <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= qrDataCodewords(ver) * 8) break;
  }
  if (ver > 10) throw new Error("QR text too long");
  const size = ver * 4 + 17;

  // build the bit stream
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4);
  put(bytes.length, ver <= 9 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));
  const capBits = qrDataCodewords(ver) * 8;
  put(0, Math.min(4, capBits - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }

  // error correction + interleave
  const numBlocks = QR_NUM_BLOCKS[ver];
  const eccLen = QR_ECC_PER_BLOCK[ver];
  const raw = Math.floor(qrRawModules(ver) / 8);
  const numShort = numBlocks - (raw % numBlocks);
  const shortLen = Math.floor(raw / numBlocks);
  const blocks = [];
  const div = rsDivisor(eccLen);
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const codewords = [];
  for (let i = 0; i < blocks[0].length; i++)
    blocks.forEach((blk, j) => {
      if (i !== shortLen - eccLen || j >= numShort) codewords.push(blk[i]);
    });

  // matrix + function patterns
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };

  for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
      }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const ap = qrAlignPositions(ver);
  ap.forEach((ay, i) =>
    ap.forEach((ax, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    })
  );

  const drawFormat = (mask) => {
    const d = (0 << 3) | mask; // level M = 00
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bitsF = ((d << 10) | rem) ^ 0x5412;
    const bit = (i) => ((bitsF >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(i));
    setFn(8, 7, bit(6)); setFn(8, 8, bit(7)); setFn(7, 8, bit(8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);

  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bitsV = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bitsV >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3), b = Math.floor(i / 3);
      setFn(a, b, dark); setFn(b, a, dark);
    }
  }

  // place codewords in the zigzag
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && bi < codewords.length * 8) {
          m[y][x] = ((codewords[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0;
          bi++;
        }
      }
  }

  // choose the best mask
  const maskFn = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (mask) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (!fn[y][x] && maskFn[mask](x, y)) m[y][x] = !m[y][x];
  };
  let best = 0, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const s = qrPenalty(m, size);
    if (s < bestScore) { bestScore = s; best = mask; }
    applyMask(mask);
  }
  applyMask(best);
  drawFormat(best);
  return m;
}

// Draws the QR matrix as a crisp SVG (no external library needed)
function QRCodeSVG({ value, size = 150 }) {
  const matrix = React.useMemo(() => {
    try {
      return generateQR(value);
    } catch (error) {
      console.error("Failed to generate clearance QR code:", error);
      return null;
    }
  }, [value]);
  if (!matrix) return null;

  const quiet = 2; // white border, measured in modules
  const n = matrix.length + quiet * 2;
  let path = "";
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    })
  );

  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Clearance verification QR code"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <rect width={n} height={n} fill="#ffffff" />
      <path d={path} fill="#1a1a1a" />
    </svg>
  );
}

function ClearanceQR({ value, verificationToken, size = 150 }) {
  if (!value || !verificationToken) {
    return <span style={{ fontSize: "0.78rem", color: "#737568" }}>Verification code unavailable</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          background: "#ffffff",
          padding: "12px",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          lineHeight: 0,
          width: `${size + 24}px`,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <QRCodeSVG value={value} size={size} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#737568", fontWeight: "600" }}>
        {verificationToken}
      </span>
      <span style={{ fontSize: "0.72rem", color: "#737568" }}>Scan to verify</span>
    </div>
  );
}

function DownloadClearance({ requirements = [], clearance }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const totalCount = requirements.length;
  const clearedCount = requirements.filter(
    (item) => item.status && item.status.toLowerCase() === "cleared"
  ).length;
  const clearanceStatus = String(clearance?.status ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const isFullyCleared = clearanceStatus === "completed" ||
    (totalCount > 0 && clearedCount === totalCount);
  const verificationToken = clearance?.verification_token;
  const verificationUrl = verificationToken
    ? new URL(
      `student-clearances/verify/${encodeURIComponent(verificationToken)}/`,
      new URL(apiClient.defaults.baseURL, window.location.origin),
    ).toString()
    : "";
  const academicYear = clearance?.academic_year || "—";
  const semester = clearance?.semester || "—";

  const downloadCertificate = async () => {
    if (!clearance?.id || isDownloading) return;

    setIsDownloading(true);
    setDownloadError("");
    try {
      const response = await apiClient.get(
        `student-clearances/${clearance.id}/certificate/`,
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Clearance_Certificate_${clearance.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download the clearance certificate:", error);
      setDownloadError("Could not download your clearance certificate. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusLabelText = (status) => {
    if (!status) return "PENDING";
    if (status.toLowerCase() === "under_review") return "UNDER REVIEW";
    return status.toUpperCase();
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <div className="download-blueprint-grid-layout">
        <div className="download-blueprint-top-full-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "24px", width: "100%" }}>
            <div style={{ fontSize: "3.5rem" }}>🏛️</div>
            <div style={{ marginRight: "auto" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.4rem", fontWeight: "800", color: "#1a1a1a" }}>
                DAVAO DEL NORTE STATE COLLEGE
              </h3>
              <p style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#737568" }}>
                New Visayas, Panabo City, Davao del Norte
              </p>
              <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--primary-green)" }}>
                OFFICIAL STUDENT SEMESTRAL CLEARANCE
              </h4>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={downloadCertificate}
                disabled={isDownloading}
                className="submit-request-form-btn-aligned"
              >
                {isDownloading ? "Downloading..." : "Download PDF"}
              </button>
              <button type="button" onClick={() => window.print()} className="submit-request-form-btn-aligned">
                🖨️ Print Clearance
              </button>
            </div>
          </div>
        </div>
        {downloadError && <p role="alert" style={{ color: "#b42318", margin: "0" }}>{downloadError}</p>}

        <div className="download-blueprint-lower-split-row">
          <div className="download-blueprint-left-main-box download-responsive-card-padding">
            <div
              className="download-table-header-bar"
              style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#55574a", padding: "14px 24px", color: "#ffffff", fontSize: "0.85rem", fontWeight: "700", borderRadius: "12px", marginBottom: "16px" }}
            >
              <span>DEPARTMENT / AUTHORIZING OFFICE</span>
              <span>EVALUATION STATUS</span>
            </div>

            <div className="tracker-blueprint-list-container" style={{ gap: "12px", marginBottom: "24px" }}>
              {requirements.map((item, index) => (
                <div className="tracker-blueprint-list-row-item" key={item.id || index} style={{ background: "#f7f8f3" }}>
                  <span className="tracker-blueprint-item-name">
                    Step {index + 1}: {item.requirement_name}
                  </span>
                  <span className={`tracker-blueprint-status-tag ${item.status ? item.status.toLowerCase() : "pending"}`}>
                    {getStatusLabelText(item.status)}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile: meta + QR shown under the list (right column is hidden on mobile) */}
            <div
              className="mobile-only-print-meta-stack"
              style={{ display: "none", flexDirection: "column", gap: "16px", borderTop: "1.5px dashed #b8baa9", paddingTop: "20px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#737568", fontWeight: "600" }}>Academic Year:</span>
                <span style={{ fontWeight: "700", color: "#2c2d25" }}>{academicYear}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#737568", fontWeight: "600" }}>Semester Term:</span>
                <span style={{ fontWeight: "700", color: "#2c2d25" }}>{semester}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", alignItems: "center" }}>
                <span style={{ color: "#737568", fontWeight: "600" }}>Clearance State:</span>
                <span className={`tracker-blueprint-status-tag ${isFullyCleared ? "cleared" : "pending"}`}>
                  {isFullyCleared ? "CLEARED" : "HOLD"}
                </span>
              </div>
              <div style={{ paddingTop: "12px" }}>
                <ClearanceQR value={verificationUrl} verificationToken={verificationToken} size={150} />
              </div>
            </div>
          </div>

          {/* Desktop: right column */}
          <div className="download-blueprint-right-side-column">
            <div className="download-blueprint-right-mini-box">
              <span className="side-capsule-label" style={{ marginBottom: "8px", display: "block" }}>
                Verification Registry
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#737568", display: "block" }}>Academic Year</span>
                  <span style={{ fontSize: "1rem", fontWeight: "700", color: "#2c2d25" }}>{academicYear}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#737568", display: "block" }}>Semester Term</span>
                  <span style={{ fontSize: "1rem", fontWeight: "700", color: "#2c2d25" }}>{semester}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#737568", display: "block" }}>Clearance State</span>
                  <span
                    className={`tracker-blueprint-status-tag ${isFullyCleared ? "cleared" : "pending"}`}
                    style={{ display: "inline-block", marginTop: "4px" }}
                  >
                    {isFullyCleared ? "CLEARED" : "HOLD"}
                  </span>
                </div>
              </div>
            </div>

            <div className="download-blueprint-right-mini-box" style={{ justifyContent: "center", alignItems: "center" }}>
              <ClearanceQR value={verificationUrl} verificationToken={verificationToken} size={150} />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .download-blueprint-right-side-column { display: none !important; }
            .download-table-header-bar { display: none !important; }
            .mobile-only-print-meta-stack { display: flex !important; }
            .download-responsive-card-padding { padding: 24px 16px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default DownloadClearance;