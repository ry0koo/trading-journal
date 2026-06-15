import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BackButton } from "../components/BackButton";
import { PageWrapper } from "../components/PageWrapper";
import {
  headerStyle,
  inputStyle,
  labelStyle,
  pageStyle,
  selectStyle,
  titleStyle,
} from "../ui";
import { getTodayInputValue, tradeDateToIso } from "../utils/dateUtils";
import { Button, Card } from "../components/PremiumUI";
import { ScreenshotUpload } from "../components/ScreenshotUpload";

function NewTrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resultFocused, setResultFocused] = useState(false);

  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [instrument, setInstrument] = useState<"EURUSD" | "GBPUSD">("EURUSD");
  const [tradeDate, setTradeDate] = useState(getTodayInputValue());
  const [session, setSession] = useState("London");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [result, setResult] = useState("");
  const [comment, setComment] = useState("");
  const [beforeImage, setBeforeImage] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!editId) return;

    const loadTrade = async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", editId)
        .single();

      if (error || !data) return;

      setInstrument(data.instrument);
      setDirection(data.direction);
      setSession(data.session || "London");
      setTradeDate(data.trade_date || getTodayInputValue());
      setResult(String(data.result));
      setComment(data.comment || "");
      setBeforeImage(data.before_image || "");
      setAfterImage(data.after_image || "");
    };

    void loadTrade();
  }, [editId]);

  const handleImageFile = (file: File, type: "before" | "after") => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const image = reader.result as string;
      if (type === "before") setBeforeImage(image);
      else setAfterImage(image);
    };
    reader.readAsDataURL(file);
  };

  const saveTrade = async () => {
    if (!result.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    const payload = {
      instrument,
      direction,
      result: Number(result.replace(",", ".")),
      session,
      trade_date: tradeDate,
      comment,
      before_image: beforeImage,
      after_image: afterImage,
    };

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("trades")
          .update(payload)
          .eq("id", editId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("trades").insert([
          { ...payload, created_at: tradeDateToIso(tradeDate) },
        ]);

        if (error) throw error;
      }

      navigate("/history");
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave =
    result.trim() !== "" && !Number.isNaN(Number(result.replace(",", ".")));

  return (
    <PageWrapper style={{ ...pageStyle, maxWidth: "520px" }}>
      <header style={{ ...headerStyle, marginBottom: "32px" }}>
        <BackButton />
        <h1 style={{ ...titleStyle, fontSize: "40px" }}>{isEditMode ? "EDIT" : "NEW"} TRADE</h1>
      </header>

      <Card style={{ marginBottom: "16px", padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <Field label="Instrument">
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as "EURUSD" | "GBPUSD")}
              style={selectStyle}
            >
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
            </select>
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
            />
          </Field>
        </div>

        <Field label="Session">
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            style={{ ...selectStyle, marginBottom: "20px" }}
          >
            <option value="Tokyo">Tokyo</option>
            <option value="London">London</option>
            <option value="New York">New York</option>
            <option value="Out of session">Out of session</option>
          </select>
        </Field>

        <label style={{ ...labelStyle, marginBottom: "12px" }}>Direction</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
          <DirectionButton 
            active={direction === "LONG"} 
            onClick={() => setDirection("LONG")}
            label="LONG"
            activeColor="var(--green)"
          />
          <DirectionButton 
            active={direction === "SHORT"} 
            onClick={() => setDirection("SHORT")}
            label="SHORT"
            activeColor="var(--red)"
          />
        </div>

        <label style={{ ...labelStyle, textAlign: "center", marginBottom: "12px" }}>RESULT (R)</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={result}
          onChange={(e) => setResult(e.target.value.replace(",", "."))}
          onFocus={() => setResultFocused(true)}
          onBlur={() => setResultFocused(false)}
          style={{
            ...inputStyle,
            marginBottom: 0,
            fontSize: "48px",
            fontWeight: 900,
            lineHeight: 1,
            textAlign: "center",
            height: "100px",
            borderColor: resultFocused ? "var(--text)" : "var(--border)",
            background: resultFocused ? "var(--panel-soft)" : "var(--panel)",
            color: Number(result) >= 0 ? "var(--green)" : "var(--red)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Card>

      <Card style={{ marginBottom: "16px", padding: "20px" }}>
        <label style={{ ...labelStyle, marginBottom: "12px" }}>ANALYSIS & NOTES</label>
        <textarea
          placeholder="What did you see? What did you feel? What did you learn?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            ...inputStyle,
            height: "140px",
            marginBottom: 0,
            resize: "none",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <ScreenshotUpload
          title="Before"
          image={beforeImage}
          onClear={() => setBeforeImage("")}
          onFileChange={(file) => handleImageFile(file, "before")}
        />
        <ScreenshotUpload
          title="After"
          image={afterImage}
          onClear={() => setAfterImage("")}
          onFileChange={(file) => handleImageFile(file, "after")}
        />
      </div>

      {saveError && (
        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            background: "var(--red-soft)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "14px",
            color: "var(--red)",
            fontSize: "14px",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {saveError}
        </div>
      )}

      <Button
        disabled={!canSave || isSaving}
        size="lg"
        fullWidth
        onClick={saveTrade}
        style={{ height: "64px", fontSize: "16px" }}
      >
        {isSaving ? "SAVING…" : isEditMode ? "SAVE CHANGES" : "SAVE TRADE"}
      </Button>
    </PageWrapper>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: "8px" }}>{label}</label>
      {children}
    </div>
  );
}

function DirectionButton({ active, onClick, label, activeColor }: { active: boolean, onClick: () => void, label: string, activeColor: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-press"
      style={{
        padding: "16px",
        borderRadius: "14px",
        background: active ? activeColor : "var(--panel)",
        color: active ? "#000" : "var(--muted)",
        border: active ? `1px solid ${activeColor}` : "1px solid var(--border)",
        fontWeight: 900,
        fontSize: "13px",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </button>
  );
}

export default NewTrade;
