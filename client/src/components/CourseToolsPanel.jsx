import { useRef, useState } from "react";

import api, { UPLOADS_BASE_URL } from "../api/axios";

const tools = [
  {
    id: "pdf-to-word",
    label: "PDF to Word",
    description: "Convert a PDF course file into a .docx document."
  },
  {
    id: "compress-size",
    label: "Compress Size",
    description: "Package a course file into a smaller ZIP download."
  }
];

const FileIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const ZipIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M20 13V6a2 2 0 0 0-2-2H6" />
    <path d="M8 21h8" />
    <path d="M12 3v6" />
    <path d="M9 17l3-4 3 4" />
  </svg>
);

function CourseToolForm({ activeTool }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const isPdfToWord = activeTool === "pdf-to-word";

  const resetFile = () => {
    setFile(null);
    setError("");
    setProgress(0);
  };

  const handlePickedFile = (pickedFile) => {
    setError("");
    setProgress(0);

    if (!pickedFile) {
      return;
    }

    if (isPdfToWord && !pickedFile.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Only PDF files are accepted for this tool.");
      return;
    }

    setFile(pickedFile);
  };

  const handleInputChange = (event) => {
    handlePickedFile(event.target?.files?.[0] || null);
  };

  const handleDrag = (event, isActive) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(isActive);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handlePickedFile(event.dataTransfer?.files?.[0] || null);
  };

  const downloadBlob = (blob, filename) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError(isPdfToWord ? "Select a PDF file first." : "Select a file first.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setBusy(true);
    setProgress(0);

    try {
      if (isPdfToWord) {
        const response = await api.post("/tools/pdf-to-word", form, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 0,
          onUploadProgress: (uploadEvent) => {
            if (uploadEvent.total) {
              setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
            }
          }
        });

        const fileUrl = response.data?.fileUrl || response.data?.data?.fileUrl;

        if (!fileUrl) {
          throw new Error("Conversion succeeded but no file URL returned.");
        }

        window.open(`${UPLOADS_BASE_URL}${fileUrl.replace("/uploads", "")}`, "_blank");
      } else {
        const response = await api.post("/tools/compress-file", form, {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (uploadEvent) => {
            if (uploadEvent.total) {
              setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
            }
          }
        });

        const disposition = response.headers["content-disposition"] || response.headers["Content-Disposition"];
        const match = disposition?.match(/filename[^;=]*=\s*(?:"([^"]+)"|([^;\n]+))/i);
        const filename = (match?.[1] || match?.[2] || `${file.name}.zip`).trim();

        downloadBlob(response.data, filename);
      }

      resetFile();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Tool request failed.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => handleDrag(event, true)}
        onDragEnter={(event) => handleDrag(event, true)}
        onDragLeave={(event) => handleDrag(event, false)}
        onDrop={handleDrop}
        className={`flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
          dragActive
            ? "border-[#0B1957] bg-[#D1E8FF]"
            : "border-[#9ECCFA] bg-[#F8F3EA] hover:border-[#0B1957]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={isPdfToWord ? ".pdf" : undefined}
          onChange={handleInputChange}
          disabled={busy}
          hidden
        />

        {file ? (
          <span className="max-w-full text-sm font-semibold text-[#0B1957]">
            <span className="block truncate">{file.name}</span>
            <span className="mt-1 block text-xs font-medium text-[#0B1957]/70">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </span>
        ) : (
          <>
            <span className="text-sm font-semibold text-[#0B1957]">
              {isPdfToWord ? "Select PDF" : "Select File"}
            </span>
            <span className="mt-1 text-xs text-[#0B1957]/70">
              {isPdfToWord ? ".pdf" : "Any file"}
            </span>
          </>
        )}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy || !file}
          className="inline-flex items-center justify-center rounded-xl bg-[#0B1957] px-4 py-2 text-sm font-semibold text-[#F8F3EA] transition hover:bg-[#9ECCFA] hover:text-[#0B1957] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? `${isPdfToWord ? "Converting" : "Compressing"}... ${progress}%`
            : isPdfToWord
              ? "Convert"
              : "Compress"}
        </button>

        {file ? (
          <button
            type="button"
            onClick={resetFile}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-2 text-sm font-semibold text-[#0B1957] transition hover:border-[#0B1957] hover:bg-[#D1E8FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm font-medium text-[#0B1957]">{error}</p> : null}
    </form>
  );
}

function CourseToolsPanel() {
  const [activeTool, setActiveTool] = useState("pdf-to-word");

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <section className="rounded-2xl border border-[#9ECCFA] bg-[#F8F3EA] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B1957]/70">Course Tools</p>
        <h2 className="mt-2 text-xl font-semibold text-[#0B1957]">File Actions</h2>

        <div className="mt-5 grid gap-3">
          {tools.map((tool) => {
            const isActive = activeTool === tool.id;
            const Icon = tool.id === "pdf-to-word" ? FileIcon : ZipIcon;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-[#0B1957] bg-[#D1E8FF] text-[#0B1957]"
                    : "border-[#9ECCFA] bg-[#F8F3EA] text-[#0B1957]/70 hover:border-[#0B1957]"
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D1E8FF] text-[#0B1957]">
                  <Icon />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0B1957]">{tool.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#0B1957]/70">{tool.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#9ECCFA] bg-[#F8F3EA] p-5 shadow-sm">
        <CourseToolForm key={activeTool} activeTool={activeTool} />
      </section>
    </aside>
  );
}

export default CourseToolsPanel;
