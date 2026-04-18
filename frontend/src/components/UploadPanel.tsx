import { useState } from "react";
import { uploadAudio, uploadExcel } from "../api/client";

type Props = {
  householdId?: string;
  householdOptions?: { id: string; name: string }[];
  onUploaded: () => void;
};

export const UploadPanel = ({ householdId, householdOptions = [], onUploaded }: Props) => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(
    householdOptions[0]?.id ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const audioTargetHouseholdId = householdId || selectedHouseholdId;

  const handleExcelUpload = async () => {
    if (!excelFile) return;
    setIsLoading(true);
    try {
      const result = await uploadExcel(excelFile);
      setMessage(`Imported ${result.importedHouseholds} household(s)`);
      onUploaded();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioUpload = async () => {
    if (!audioFile || !audioTargetHouseholdId) return;
    setIsLoading(true);
    try {
      await uploadAudio(audioTargetHouseholdId, audioFile);
      setMessage("Audio processed successfully");
      onUploaded();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel upload-panel">
      <h3>Ingestion</h3>
      <div className="field-row">
        <label>Excel import</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={handleExcelUpload} disabled={!excelFile || isLoading}>
          Upload Excel
        </button>
      </div>
      <div className="field-row">
        <label>Audio enrichment</label>
        {!householdId ? (
          <select
            value={selectedHouseholdId}
            onChange={(e) => setSelectedHouseholdId(e.target.value)}
          >
            {householdOptions.length === 0 ? (
              <option value="">No households available</option>
            ) : (
              householdOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))
            )}
          </select>
        ) : null}
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={handleAudioUpload}
          disabled={!audioFile || !audioTargetHouseholdId || isLoading}
        >
          Upload Audio
        </button>
      </div>
      {message ? <p className="status-message">{message}</p> : null}
      {!householdId && householdOptions.length === 0 ? (
        <p className="hint">Upload Excel first so a household can be selected for audio enrichment.</p>
      ) : null}
    </section>
  );
};
