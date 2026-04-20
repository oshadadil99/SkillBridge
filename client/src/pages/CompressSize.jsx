import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function CompressSize() {
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
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a file to compress.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setBusy(true);
    setProgress(0);

    try {
      const response = await api.post("/tools/compress-file", form, {
        responseType: "blob",
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });

      const blob = response.data;
      let filename = file.name + ".zip";
      const cd = response.headers["content-disposition"] || response.headers["Content-Disposition"];
      if (cd) {
        const m = cd.match(/filename[^;=]*=\s*(?:"([^"]+)"|([^;\n]+))/i);
        if (m) filename = (m[1] || m[2]).trim();
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Compression failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef4ff] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7da7]">Compress Size</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#112765]">Compress Files</h1>
          <p className="mt-2 text-sm text-[#6c7da7]">Upload a file and download a ZIP containing the file (server-side archive).</p>

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
                  <p className="text-sm text-[#5f719e]">Click or drag & drop a file here</p>
                  <p className="mt-2 text-xs text-[#9aa7c7]">Max 100MB</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={busy || !file}
                className="inline-flex items-center justify-center rounded-xl bg-[#10246d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d327f] disabled:opacity-60"
              >
                {busy ? `Compressing… ${progress}%` : "Compress & Download"}
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
                  <path d="M12 2l2 5 5 .5-4 3 1 5-4-3-4 3 1-5-4-3L10 7 12 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#112765]">Smart Compression</div>
                <div className="mt-1 text-xs text-[#6c7da7]">Advanced algorithms reduce file size while maintaining visual quality.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7d2c7] bg-white p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#f6eaff] flex items-center justify-center text-[#6b2aa6] shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 2v6" />
                  <path d="M5 12h14" />
                  <path d="M7 19h10" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#112765]">Multiple Formats</div>
                <div className="mt-1 text-xs text-[#6c7da7]">Supports images, PDFs, and document files for all your compression needs.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7d2c7] bg-white p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#eaffef] flex items-center justify-center text-[#0a7a3a] shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3v12" />
                  <path d="M8 7l4-4 4 4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#112765]">Instant Download</div>
                <div className="mt-1 text-xs text-[#6c7da7]">Compressed files are ready to download immediately after processing.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CompressSize;
