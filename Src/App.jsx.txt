import { useMemo, useState } from "react";

// ---------- 1. DATA MODEL (from your concept) ----------

// Prototype areas – starting with key Macomb locations.
// In a real system, these get replaced by FEMA / Macomb GIS / NOAA etc.[file:4]
const prototypeAreas = {
  "Clinton Township, Macomb": {
    elevation: "Moderate-low",
    elevationFeet: 604,
    rainfall: 2.7,
    intensity: "Medium-high",
    soil: "Mixed drainage",
    sewer: "Moderate pressure",
    waterways: "Local drains and creeks nearby",
    impervious: "Medium-high",
    risk: "Medium-high",
    explanation:
      "Flood risk is driven by mixed soil drainage, concentrated roads and rooftops, and storm drains that may struggle during fast rainfall bursts.",
  },
  "Mount Clemens, Macomb": {
    elevation: "Low",
    elevationFeet: 587,
    rainfall: 3.1,
    intensity: "High",
    soil: "Poor drainage",
    sewer: "Near capacity",
    waterways: "Clinton River nearby",
    impervious: "High",
    risk: "High",
    explanation:
      "This area has low elevation, nearby waterways, older drainage pressure, and high impervious surface coverage, which increases runoff and flood exposure.",
  },
  "Warren, Macomb": {
    elevation: "Moderate",
    elevationFeet: 620,
    rainfall: 2.2,
    intensity: "Medium",
    soil: "Variable drainage",
    sewer: "Moderate",
    waterways: "Limited nearby waterways",
    impervious: "High",
    risk: "Medium",
    explanation:
      "The main issue is runoff from dense roads, rooftops, and parking lots. Flooding is more likely when rainfall intensity is fast.",
  },
};

function normalizeAreaRecord(raw = {}) {
  // Same idea as in your file: accept partial data, fill defaults.[file:4]
  return {
    elevation: raw.elevation ?? "Unknown",
    elevationFeet: Number(raw.elevationFeet ?? 0),
    rainfall: Number(raw.rainfall ?? 0),
    intensity: raw.intensity ?? "Unknown",
    soil: raw.soil ?? "Unknown",
    sewer: raw.sewer ?? "Unknown",
    waterways: raw.waterways ?? "Unknown",
    impervious: raw.impervious ?? "Unknown",
    risk: raw.risk ?? "Unknown",
    explanation:
      raw.explanation ??
      "Risk explanation will appear after GIS and weather data are connected.",
  };
}

// Aid types you listed.[file:4]
const aidOptions = [
  "Electricity / heat / water",
  "Hotel fees",
  "Temporary housing",
  "Rent or mortgage support",
  "Daycare / childcare",
  "Food assistance",
  "Home repairs",
  "Mold remediation",
  "Transportation",
];

// Damage cause → likely coverage, as in your coverageRules.[file:4]
const coverageRules = {
  "External floodwater": "Likely flood insurance",
  "Sewer backup": "May require sewer backup endorsement or flood policy review",
  "Burst pipe": "Likely regular home insurance",
  "Roof leak from storm": "Likely regular home insurance",
  "Groundwater seepage":
    "Often limited or excluded unless flood policy applies",
};

// Data connectors from your Data tab.[file:4]
const dataConnectors = [
  {
    label: "Elevation",
    source: "USGS / county LiDAR / DEM data",
    use: "Shows low points, slope, drainage bowls, and property elevation.",
  },
  {
    label: "Rainfall",
    source: "NOAA / National Weather Service / rain gauges",
    use: "Feeds current rainfall, storm totals, rainfall speed, and forecast risk.",
  },
  {
    label: "Flood zones",
    source: "FEMA NFHL / local floodplain maps",
    use: "Displays regulatory flood zones and known floodplain exposure.",
  },
  {
    label: "Soil drainage",
    source: "NRCS SSURGO soil survey",
    use: "Ranks how quickly land absorbs or holds water.",
  },
  {
    label: "Sewer capacity",
    source: "Macomb stormwater / municipal infrastructure data",
    use: "Compares rainfall load with storm sewer capacity and overflow risk.",
  },
  {
    label: "Waterways",
    source: "USGS hydrography / local drain commission layers",
    use: "Maps rivers, drains, creeks, retention basins, and overflow corridors.",
  },
  {
    label: "Impervious surfaces",
    source: "County land cover / parcel / road surface datasets",
    use: "Estimates runoff from roads, parking lots, rooftops, and concrete.",
  },
];

// Tabs matching your original: Flood Map, Data, Insurance, etc.[file:4]
const tabs = [
  ["map", "Flood Map"],
  ["data", "Data"],
  ["insurance", "Insurance"],
  ["claimbuilder", "Claim Builder"],
  ["aid", "Aid"],
  ["building", "Building"],
  ["housing", "Housing"],
  ["community", "Community"],
];

// ---------- 2. MAIN APP COMPONENT ----------

function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [selectedAreaKey, setSelectedAreaKey] = useState(
    "Clinton Township, Macomb"
  );
  const [damageCause, setDamageCause] = useState("External floodwater");
  const [uploadedEvidence, setUploadedEvidence] = useState([]);
  const [claimItems, setClaimItems] = useState([]);
  const [paidAlready, setPaidAlready] = useState(0);
  const [reimbursementRate, setReimbursementRate] = useState(70);
  const [selectedAid, setSelectedAid] = useState([]);

  const selectedArea = useMemo(
    () => normalizeAreaRecord(prototypeAreas[selectedAreaKey]),
    [selectedAreaKey]
  );

  const totalClaimValue = useMemo(
    () =>
      claimItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [claimItems]
  );

  const estimatedReimbursement = useMemo(
    () => (totalClaimValue * reimbursementRate) / 100,
    [totalClaimValue, reimbursementRate]
  );

  const stillNeedToPay = useMemo(
    () => Math.max(totalClaimValue - paidAlready, 0),
    [totalClaimValue, paidAlready]
  );

  const remainingOutOfPocket = useMemo(
    () => Math.max(totalClaimValue - estimatedReimbursement, 0),
    [totalClaimValue, estimatedReimbursement]
  );

  function handleEvidenceUpload(e) {
    const files = Array.from(e.target.files || []);
    setUploadedEvidence((prev) => [...prev, ...files]);
    const newItems = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      location: "Unknown",
      coverage: "Unknown / review",
      receipt: "No",
      value: "",
    }));
    setClaimItems((prev) => [...prev, ...newItems]);
  }

  function updateClaimItem(id, field, value) {
    setClaimItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function toggleAid(option) {
    setSelectedAid((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  }

  function downloadClaimSummary() {
    const payload = {
      area: selectedAreaKey,
      damageCause,
      claimItems,
      totalClaimValue,
      paidAlready,
      reimbursementRate,
      estimatedReimbursement,
      stillNeedToPay,
      remainingOutOfPocket,
      selectedAid,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macomb-flood-claim-summary.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #ddd",
          marginBottom: 12,
          paddingBottom: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>Macomb Flood Response System</h1>
        <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
          Flood risk, insurance support, claims, aid, building, and community
          recovery.
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
          Prototype – data is sample/synthetic. Designed so real GIS and program
          data can be connected later.
        </p>
      </header>

      {/* Location selector */}
      <section
        style={{
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 12 }}>
          1. Choose your city / zone (Michigan)
        </strong>
        <div style={{ marginTop: 4, fontSize: 12 }}>
          <select
            value={selectedAreaKey}
            onChange={(e) => setSelectedAreaKey(e.target.value)}
          >
            {Object.keys(prototypeAreas).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: 8, color: "#666" }}>
            This controls flood risk, GIS explanation, and support.
          </span>
        </div>
      </section>

      {/* Overview */}
      <section style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            flex: 2,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <strong style={{ fontSize: 12 }}>Civic flood recovery platform</strong>
          <p style={{ fontSize: 13 }}>
            A workable front-end demo for flood mapping, GIS risk explanation,
            insurance routing, claim documentation, aid matching, rebuilding
            support, and community recovery.
          </p>
        </div>
        <div
          style={{
            flex: 1,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
          }}
        >
          <strong>Status</strong>
          <p style={{ margin: "4px 0" }}>Mode: Monitoring</p>
          <p style={{ margin: "4px 0" }}>Rain: {selectedArea.rainfall} in</p>
          <p style={{ margin: "4px 0" }}>Risk: {selectedArea.risk}</p>
        </div>
      </section>

      {/* Tabs */}
      <nav style={{ marginBottom: 8 }}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              marginRight: 4,
              marginBottom: 4,
              padding: "4px 8px",
              fontSize: 12,
              borderRadius: 999,
              border: "1px solid #ccc",
              background: activeTab === id ? "#222" : "#f4f4f4",
              color: activeTab === id ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === "map" && (
        <FloodMapTab areaKey={selectedAreaKey} selectedArea={selectedArea} />
      )}
      {activeTab === "data" && <DataTab />}
      {activeTab === "insurance" && (
        <InsuranceTab
          damageCause={damageCause}
          setDamageCause={setDamageCause}
        />
      )}
      {activeTab === "claimbuilder" && (
        <ClaimBuilderTab
          uploadedEvidence={uploadedEvidence}
          handleEvidenceUpload={handleEvidenceUpload}
          claimItems={claimItems}
          updateClaimItem={updateClaimItem}
          totalClaimValue={totalClaimValue}
          paidAlready={paidAlready}
          setPaidAlready={setPaidAlready}
          reimbursementRate={reimbursementRate}
          setReimbursementRate={setReimbursementRate}
          estimatedReimbursement={estimatedReimbursement}
          stillNeedToPay={stillNeedToPay}
          remainingOutOfPocket={remainingOutOfPocket}
          downloadClaimSummary={downloadClaimSummary}
        />
      )}
      {activeTab === "aid" && (
        <AidTab
          aidOptions={aidOptions}
          selectedAid={selectedAid}
          toggleAid={toggleAid}
        />
      )}
      {activeTab === "building" && <BuildingTab />}
      {activeTab === "housing" && <HousingTab />}
      {activeTab === "community" && <CommunityTab />}
    </div>
  );
}

// ---------- 3. TAB COMPONENTS ----------

function FloodMapTab({ areaKey, selectedArea }) {
  return (
    <section style={{ display: "flex", gap: 12 }}>
      <div
        style={{
          flex: 2,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
        }}
      >
        <strong>Flood Map & GIS Risk</strong>
        <p style={{ marginTop: 4 }}>
          {areaKey} – Risk: {selectedArea.risk} – Rainfall:{" "}
          {selectedArea.rainfall} in
        </p>
        <div
          style={{
            height: 180,
            borderRadius: 8,
            background: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#666",
            marginBottom: 8,
          }}
        >
          Map placeholder (connect Mapbox/ArcGIS + flood layers here)
        </div>
        <p>
          Visible GIS layers could include elevation heatmap, rain intensity,
          drainage pressure, and impervious surfaces.
        </p>
      </div>
      <div
        style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
        }}
      >
        <strong>Plain-language risk explanation</strong>
        <p style={{ marginTop: 4 }}>{selectedArea.explanation}</p>
        <ul style={{ paddingLeft: 16 }}>
          <li>
            Elevation: {selectedArea.elevation} / {selectedArea.elevationFeet} ft
          </li>
          <li>Rain volume: {selectedArea.rainfall} in</li>
          <li>Rain intensity: {selectedArea.intensity}</li>
          <li>Soil drainage: {selectedArea.soil}</li>
          <li>Sewer capacity: {selectedArea.sewer}</li>
          <li>Waterways: {selectedArea.waterways}</li>
          <li>Impervious surfaces: {selectedArea.impervious}</li>
        </ul>
      </div>
    </section>
  );
}

function DataTab() {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      <strong>Data & GIS integration</strong>
      <p style={{ marginTop: 4 }}>
        The prototype is designed around a replaceable data model. Sample
        neighborhood values can be swapped for real GIS layers, API responses,
        CSV uploads, or database records without changing the user interface.
      </p>
      <p>
        Production flow: Address search → geocode → pull GIS layers → calculate
        factor scores → classify flood risk → explain the result in plain
        language.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 8,
        }}
      >
        {dataConnectors.map((c) => (
          <div
            key={c.label}
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 8,
              width: 260,
            }}
          >
            <strong>{c.label}</strong>
            <div style={{ fontSize: 11, color: "#666" }}>{c.source}</div>
            <div style={{ fontSize: 11 }}>{c.use}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InsuranceTab({ damageCause, setDamageCause }) {
  const coverage = coverageRules[damageCause];
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      <strong>Insurance explanation</strong>
      <div style={{ marginTop: 8 }}>
        <div>What happened?</div>
        <select
          value={damageCause}
          onChange={(e) => setDamageCause(e.target.value)}
        >
          {Object.keys(coverageRules).map((cause) => (
            <option key={cause} value={cause}>
              {cause}
            </option>
          ))}
        </select>
        <p style={{ marginTop: 8 }}>
          Likely coverage path: <strong>{coverage}</strong>
        </p>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <strong>Flood insurance</strong>
          <p>
            External rising water, floodwater entering from outside, foundation,
            essential systems, some contents.
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <strong>Regular home insurance</strong>
          <p>
            Burst pipes, accidental internal leaks, wind or roof damage, theft,
            and some storm-related interior damage.
          </p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#666" }}>
        Structure matters: basements, garages, rentals, condos, and commercial
        buildings can have different eligibility rules.
      </p>
    </section>
  );
}

function ClaimBuilderTab(props) {
  const {
    uploadedEvidence,
    handleEvidenceUpload,
    claimItems,
    updateClaimItem,
    totalClaimValue,
    paidAlready,
    setPaidAlready,
    reimbursementRate,
    setReimbursementRate,
    estimatedReimbursement,
    stillNeedToPay,
    remainingOutOfPocket,
    downloadClaimSummary,
  } = props;

  return (
    <section style={{ display: "flex", gap: 12 }}>
      <div
        style={{
          flex: 2,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
        }}
      >
        <strong>AI-assisted claim builder</strong>
        <p>
          Upload photos, videos, receipts, or item lists. The demo turns
          filenames into claim items you can refine. A full version would also
          classify items and suggest coverage.
        </p>
        <input type="file" multiple onChange={handleEvidenceUpload} />
        <div style={{ marginTop: 8 }}>
          <strong>Uploaded evidence:</strong>
          {uploadedEvidence.length === 0 ? (
            <p style={{ fontSize: 11, color: "#666" }}>No evidence yet.</p>
          ) : (
            <ul style={{ fontSize: 11 }}>
              {uploadedEvidence.map((file, i) => (
                <li key={file.name + i}>
                  {file.name} ({file.type}, {file.size} bytes)
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>Claim items</strong>
          {claimItems.length === 0 && (
            <p style={{ fontSize: 11, color: "#666" }}>
              Items will appear here as you upload evidence.
            </p>
          )}
          {claimItems.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 4,
                fontSize: 11,
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc" }}>Item</th>
                  <th style={{ border: "1px solid #ccc" }}>Location</th>
                  <th style={{ border: "1px solid #ccc" }}>Coverage</th>
                  <th style={{ border: "1px solid #ccc" }}>Receipt</th>
                  <th style={{ border: "1px solid #ccc" }}>Value ($)</th>
                </tr>
              </thead>
              <tbody>
                {claimItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ border: "1px solid #ccc" }}>
                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateClaimItem(item.id, "name", e.target.value)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc" }}>
                      <input
                        value={item.location}
                        onChange={(e) =>
                          updateClaimItem(item.id, "location", e.target.value)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc" }}>
                      <input
                        value={item.coverage}
                        onChange={(e) =>
                          updateClaimItem(item.id, "coverage", e.target.value)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc" }}>
                      <input
                        value={item.receipt}
                        onChange={(e) =>
                          updateClaimItem(item.id, "receipt", e.target.value)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc" }}>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) =>
                          updateClaimItem(item.id, "value", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ marginTop: 4 }}>
            Estimated claim value: ${totalClaimValue.toLocaleString()}
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
        }}
      >
        <strong>Cost & reimbursement</strong>
        <div style={{ marginTop: 8 }}>
          <div>Paid Up Front ($)</div>
          <input
            type="number"
            value={paidAlready}
            onChange={(e) => setPaidAlready(Number(e.target.value || 0))}
          />
          <div style={{ marginTop: 8 }}>Likely Reimbursement (%)</div>
          <input
            type="number"
            value={reimbursementRate}
            onChange={(e) =>
              setReimbursementRate(Number(e.target.value || 0))
            }
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <p>Paid Up Front: ${paidAlready.toLocaleString()}</p>
          <p>Likely Reimbursed: ${estimatedReimbursement.toLocaleString()}</p>
          <p>Still Need To Pay: ${stillNeedToPay.toLocaleString()}</p>
          <p>Out of Pocket: ${remainingOutOfPocket.toLocaleString()}</p>
        </div>
        <button onClick={downloadClaimSummary} style={{ marginTop: 8 }}>
          Download claim summary (JSON)
        </button>
        <p style={{ marginTop: 4, fontSize: 11, color: "#666" }}>
          In a full system, this step would generate a complete packet with
          forms, item list, receipts, and coverage path, ready to send or print.
        </p>
      </div>
    </section>
  );
}

function AidTab({ aidOptions, selectedAid, toggleAid }) {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      <strong>Aid & financial support</strong>
      <p style={{ marginTop: 4 }}>
        Select what your household needs. This becomes a recovery checklist you
        can use with local programs.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {aidOptions.map((option) => (
          <button
            key={option}
            onClick={() => toggleAid(option)}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: selectedAid.includes(option) ? "#222" : "#fff",
              color: selectedAid.includes(option) ? "#fff" : "#333",
              fontSize: 11,
            }}
          >
            {option}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 8 }}>
        Recovery plan:{" "}
        {selectedAid.length ? selectedAid.join(" • ") : "None selected yet."}
      </p>
    </section>
  );
}

function BuildingTab() {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      <strong>Building, repairs & resilience</strong>
      <ul style={{ marginTop: 4, paddingLeft: 16 }}>
        <li>Immediate fixes: water extraction, mold, electrical safety.</li>
        <li>Rebuilding: permits, contractor estimates, grants.</li>
        <li>Future protection: sump pumps, grading, raised utilities.</li>
      </ul>
      <p style={{ fontSize: 11, color: "#666" }}>
        In a full deployment, residents could upload photos of their basement,
        foundation, and yard. The system would suggest floodproofing upgrades
        and highlight building code and policy weaknesses.
      </p>
    </section>
  );
}

function HousingTab() {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      <strong>Housing & temporary shelter</strong>
      <ul style={{ marginTop: 4, paddingLeft: 16 }}>
        <li>Shelters and community centers.</li>
        <li>Hotels and reimbursement tracking.</li>
        <li>Temporary rentals and relocation support.</li>
      </ul>
    </section>
  );
}

function CommunityTab() {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      <strong>Community support</strong>
      <ul style={{ marginTop: 4, paddingLeft: 16 }}>
        <li>Request help: cleanup, transport, supplies, childcare.</li>
        <li>Volunteer: match skills and availability.</li>
        <li>Donate: tools, food, clothing, housing space.</li>
      </ul>
    </section>
  );
}

export default App;