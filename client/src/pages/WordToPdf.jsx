import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api, { UPLOADS_BASE_URL } from "../api/axios";

function WordToPdf() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (e) => {
    setError("");
    setProgress(0);
    const f = e.target?.files?.[0] || (e.dataTransfer && e.dataTransfer.files?.[0]) || null;
    if (f) setFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      if (!f.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are accepted');
        return;
      }
      setFile(f);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a PDF file to convert.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only .pdf files are accepted for this tool.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setBusy(true);
    setProgress(0);

    try {
      const response = await api.post("/tools/pdf-to-word", form, {
        headers: { "Content-Type": "multipart/form-data" },
        // conversion can take longer than the default timeout; allow longer wait
        timeout: 0,
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });

      const fileUrl = response.data?.fileUrl || response.data?.data?.fileUrl;
      if (!fileUrl) throw new Error('Conversion succeeded but no file URL returned');

      const downloadUrl = `${UPLOADS_BASE_URL}${fileUrl.replace('/uploads','')}`;
      window.open(downloadUrl, '_blank');
      setFile(null);
    } catch (err) {
      console.error(err);
      let msg = err?.message || "Conversion failed";
      const resp = err?.response;
      if (resp && resp.data) {
        try {
          // when responseType is 'blob' the error body may be a Blob containing JSON
          if (typeof resp.data.text === "function") {
            const text = await resp.data.text();
            try {
              const json = JSON.parse(text);
              msg = json?.message || json?.error || text || msg;
            } catch {
              msg = text || msg;
            }
          } else if (resp.data?.message) {
            msg = resp.data.message;
          }
        } catch {
          // ignore parse errors
        }
      }
      setError(msg);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef4ff] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7da7]">PDF → Word</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#112765]">Convert PDF to Word</h1>
          <p className="mt-2 text-sm text-[#6c7da7]">Upload a PDF and download the converted .docx file returned by the server.</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`mt-4 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer focus:outline-none ${
                dragActive ? 'border-[#10246d] bg-[#eef1f7]' : 'border-[#c8c4ba] bg-[#fffdfa]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFile}
                disabled={busy}
                hidden
              />

              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="text-sm text-[#1c2f6f]">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-[#6c7da7]">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button
                    type="button"
                    onClick={(ev) => { ev.stopPropagation(); setFile(null); setError(''); }}
                    className="inline-flex items-center rounded-md border border-[#c8c4ba] bg-[#fffdfa] px-3 py-1 text-sm text-[#1c2f6f] hover:border-[#10246d]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[#5f719e]">Click or drag & drop a PDF file here</p>
                  <p className="mt-2 text-xs text-[#9aa7c7]">Max 50MB • .pdf</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={busy || !file}
                className="inline-flex items-center justify-center rounded-xl bg-[#10246d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d327f] disabled:opacity-60"
              >
                {busy ? `Converting… ${progress}%` : "Convert to .docx"}
              </button>

              <Link to="/user" className="ml-2 inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-[#10246d] hover:border-[#10246d]">
                Back
              </Link>
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </form>
        </div>

        {/* Features cards */}
        <div>
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#d7d2c7] bg-white p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#eef6ff] flex items-center justify-center text-[#10246d] shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#112765]">High Quality</div>
                <div className="mt-1 text-xs text-[#6c7da7]">Preserves formatting, images, and layout from your original PDF.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7d2c7] bg-white p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#eaffef] flex items-center justify-center text-[#0a7a3a] shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#112765]">Fast Conversion</div>
                <div className="mt-1 text-xs text-[#6c7da7]">Convert your PDFs to Word documents in seconds with our advanced technology.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7d2c7] bg-white p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#f6eaff] flex items-center justify-center text-[#6b2aa6] shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 2v10" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#112765]">Easy to Use</div>
                <div className="mt-1 text-xs text-[#6c7da7]">Simply drag and drop your file, or click to upload and convert instantly.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WordToPdf;
