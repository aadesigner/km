import { useState } from "react";
import {
  Lock,
  Gauge,
  AlertTriangle,
  Users,
  Car,
  ShieldCheck,
  TrendingUp,
  Tag,
  X,
  CheckCircle2,
  Globe,
  CreditCard,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const GREEN = "#1fa354";
const GREEN_LIGHT = "#e8f7ee";
const GREEN_BG = "#0d7a3e";

const LOCKED_ROWS = [
  { icon: Gauge,         label: "Mileage Verification",  blur: "47,832 km",   hint: "Odometer records cross-checked" },
  { icon: AlertTriangle, label: "Accident History",       blur: "2 records",   hint: "Reported collision events" },
  { icon: Users,         label: "Previous Owners",        blur: "3 owners",    hint: "Full ownership chain" },
  { icon: Car,           label: "Salvage / Total Loss",   blur: "Not flagged", hint: "Insurance write-off check" },
  { icon: ShieldCheck,   label: "Theft Records",          blur: "Not reported",hint: "Cross-border stolen vehicle DB" },
  { icon: TrendingUp,    label: "Market Value Estimate",  blur: "€8,400",      hint: "Current market pricing" },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "256-bit SSL" },
  { icon: Lock,        label: "Secure Payment" },
  { icon: RotateCcw,   label: "30-day Guarantee" },
  { icon: Clock,       label: "Instant Report" },
];

export default function VinUnlockPage() {
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const basePrice = 19.99;
  const originalPrice = 34.99;
  const discountAmount = couponApplied ? 6.00 : 0;
  const finalPrice = basePrice - discountAmount;

  const handleApply = () => {
    if (couponCode.trim()) setCouponApplied(true);
  };

  const handleRemove = () => {
    setCouponApplied(false);
    setCouponCode("");
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f5f6f8", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GREEN_LIGHT, color: GREEN, borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <Lock size={13} />
            Step 2 of 2 — Secure Checkout
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>
            Unlock Your Vehicle Report
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
            Full history revealed instantly after payment
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Vehicle card */}
            <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.10)" }}>
              {/* Dark header */}
              <div style={{
                background: "linear-gradient(135deg, #0f1923 0%, #1a2f20 100%)",
                padding: "24px 24px 20px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Green accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GREEN }} />
                {/* Subtle glow */}
                <div style={{ position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(31,163,84,0.08)" }} />

                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                        Vehicle Identified
                      </div>
                      <div style={{ color: "#ffffff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px" }}>
                        2019 BMW 3 Series
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>320d · Sedan · 2.0L Diesel</div>
                    </div>
                    {/* Origin badge */}
                    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 20 }}>🇩🇪</div>
                      <div style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600, marginTop: 2 }}>GERMANY</div>
                    </div>
                  </div>

                  {/* VIN chip */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(31,163,84,0.15)", border: "1px solid rgba(31,163,84,0.3)", borderRadius: 8, padding: "7px 12px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
                    <span style={{ color: "#d1fae5", fontFamily: "'Menlo', monospace", fontSize: 13, fontWeight: 600, letterSpacing: "0.12em" }}>
                      WBA8E9G50JA123456
                    </span>
                  </div>
                </div>
              </div>

              {/* What's included header */}
              <div style={{ background: "#ffffff", padding: "18px 24px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  What's in your report
                </div>
              </div>

              {/* Locked data rows */}
              <div style={{ background: "#ffffff", padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
                {LOCKED_ROWS.map(({ icon: Icon, label, blur, hint }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 14px",
                      borderRadius: 10,
                      background: "linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%)",
                      border: "1px solid #e5e7eb",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Green left bar */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: GREEN, borderRadius: "10px 0 0 10px" }} />
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: GREEN_LIGHT,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={15} color={GREEN} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{hint}</div>
                    </div>
                    {/* Blurred value */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: "#374151",
                        filter: "blur(5px)",
                        userSelect: "none",
                        background: "rgba(31,163,84,0.08)",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}>
                        {blur}
                      </span>
                      <Lock size={12} color="#9ca3af" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Payment panel */}
            <div style={{ background: "#ffffff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", overflow: "hidden" }}>
              {/* Panel header */}
              <div style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2f20 100%)", padding: "18px 24px", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GREEN }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(31,163,84,0.2)", border: "1px solid rgba(31,163,84,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={16} color={GREEN} />
                  </div>
                  <div>
                    <div style={{ color: "#ffffff", fontSize: 15, fontWeight: 700 }}>Secure Payment</div>
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>Powered by PayPal</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "22px 24px" }}>

                {/* Price section */}
                <div style={{ background: GREEN_LIGHT, borderRadius: 12, padding: "16px 18px", marginBottom: 18, border: `1px solid rgba(31,163,84,0.2)` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#374151", fontSize: 14, fontWeight: 500 }}>Vehicle History Report</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#9ca3af", fontSize: 13, textDecoration: "line-through" }}>€{originalPrice.toFixed(2)}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>€{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  {couponApplied && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <CheckCircle2 size={13} color={GREEN} />
                      <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>Coupon applied — you save €{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {!couponApplied && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={13} color={GREEN} />
                      <span style={{ color: GREEN_BG, fontSize: 12, fontWeight: 500 }}>Save €{(originalPrice - basePrice).toFixed(2)} vs competitors</span>
                    </div>
                  )}
                </div>

                {/* Coupon section */}
                <div style={{ marginBottom: 18 }}>
                  <button
                    onClick={() => setCouponOpen(v => !v)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "none", border: "none", cursor: "pointer",
                      color: "#6b7280", fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 10,
                    }}
                  >
                    <Tag size={14} color="#6b7280" />
                    Have a coupon code?
                    {couponOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {couponOpen && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {couponApplied ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: GREEN_LIGHT, borderRadius: 10, border: `1px solid rgba(31,163,84,0.3)` }}>
                          <CheckCircle2 size={15} color={GREEN} />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: GREEN }}>{couponCode.toUpperCase()}</span>
                          <button onClick={handleRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            placeholder="Enter code"
                            style={{
                              flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                              fontSize: 13, outline: "none", fontFamily: "inherit",
                            }}
                          />
                          <button
                            onClick={handleApply}
                            style={{
                              padding: "10px 18px", borderRadius: 10, background: "#111827",
                              color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                            }}
                          >
                            Apply
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* PayPal button (mock) */}
                <div style={{ marginBottom: 14 }}>
                  <button
                    style={{
                      width: "100%", padding: "15px", borderRadius: 12,
                      background: "#ffc439", border: "none", cursor: "pointer",
                      fontSize: 16, fontWeight: 700, color: "#003087",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      boxShadow: "0 2px 8px rgba(255,196,57,0.4)",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>𝐏</span>
                    <span>Pay with PayPal</span>
                  </button>
                  <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 11, marginTop: 10 }}>or pay with debit or credit card</div>
                </div>

                {/* Credit card tab */}
                <button
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12,
                    background: "#f9fafb", border: "1.5px solid #e5e7eb", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: "#374151",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <CreditCard size={16} color="#6b7280" />
                  Pay with Card
                </button>

                {/* Trust badges strip */}
                <div style={{
                  marginTop: 20, paddingTop: 18,
                  borderTop: "1px solid #f3f4f6",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                }}>
                  {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: GREEN_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={13} color={GREEN} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Guarantee copy */}
                <div style={{
                  marginTop: 16, padding: "12px 14px",
                  background: "#f9fafb", borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <ShieldCheck size={18} color={GREEN} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                      30-Day Money-Back Guarantee
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
                      Not satisfied with the report? Get a full refund within 30 days — no questions asked.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data source note */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <Globe size={13} color="#9ca3af" />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Data sourced from official national registries and insurance databases</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
