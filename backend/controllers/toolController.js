import path from "path";
import fs from "fs-extra";
import archiver from "archiver";
import { fileURLToPath } from "url";
import { spawn, spawnSync } from "child_process";
import axios from "axios";
import FormData from "form-data";
import pdfParse from "pdf-parse";
import { Document, Packer, Paragraph, TextRun } from "docx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toolOutputDir = path.join(__dirname, "..", "uploads", "documents");

const cleanupPaths = async (paths = []) => {
  await Promise.all(paths.map((filePath) => fs.remove(filePath).catch(() => {})));
};

const findSofficeBinary = () => {
  const candidates = [
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/usr/bin/soffice",
    "/usr/local/bin/soffice",
    "soffice",
    "libreoffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ];

  for (const c of candidates) {
    try {
      if (path.isAbsolute(c)) {
        if (fs.existsSync(c)) return c;
        continue;
      }

      if (process.platform === "win32") {
        const res = spawnSync("where", [c], { encoding: "utf8" });
        if (res.status === 0 && res.stdout) {
          return res.stdout.split(/\r?\n/)[0].trim();
        }
      } else {
        const res = spawnSync("which", [c], { encoding: "utf8" });
        if (res.status === 0 && res.stdout) {
          return res.stdout.split(/\r?\n/)[0].trim();
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
};

const waitForOutputInDir = async (workDir, timeoutMs = 10000, intervalMs = 500) => {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const files = await fs.readdir(workDir);
      const docFile = files.find((f) => {
        const lower = f.toLowerCase();
        return lower.endsWith(".docx") || lower.endsWith(".doc") || lower.endsWith(".odt");
      });
      if (docFile) return path.join(workDir, docFile);
    } catch (e) {
      // ignore read errors while waiting
    }

    // sleep
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return null;
};

const sanitizeBaseName = (name) => {
  const raw = String(name || "").trim();
  const cleaned = raw
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return cleaned || "document";
};

const convertWithTextExtractionFallback = async (localFilePath, baseName) => {
  const outputFileName = `${baseName}-${Date.now()}.docx`;
  const finalOutput = path.join(toolOutputDir, outputFileName);

  const fileBuffer = await fs.readFile(localFilePath);
  const parsed = await pdfParse(fileBuffer);
  const lines = String(parsed?.text || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const paragraphs = lines.length
    ? lines.map((line) => new Paragraph({ children: [new TextRun(line || " ")] }))
    : [new Paragraph({ children: [new TextRun("No extractable text found in this PDF.")] })];

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const docBuffer = await Packer.toBuffer(doc);
  await fs.writeFile(finalOutput, docBuffer);
  return finalOutput;
};

const convertWithConvertAPI = async (localFilePath, baseName) => {
  const secret = process.env.CONVERTAPI_SECRET;
  if (!secret) throw new Error("CONVERTAPI_SECRET not configured");

  const url = `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${encodeURIComponent(secret)}`;
  const fd = new FormData();
  fd.append("File", fs.createReadStream(localFilePath));

  const headers = fd.getHeaders ? fd.getHeaders() : {};

  const resp = await axios.post(url, fd, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120000,
  });

  const files = resp?.data?.Files || resp?.data?.files;
  if (!files || !files.length) throw new Error("ConvertAPI returned no output files");

  const downloadUrl = files[0].Url || files[0].url;
  if (!downloadUrl) throw new Error("ConvertAPI did not provide a download URL");

  const outputFileName = `${baseName}-${Date.now()}.docx`;
  const finalOutput = path.join(toolOutputDir, outputFileName);

  const dl = await axios.get(downloadUrl, { responseType: "stream", timeout: 120000 });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(finalOutput);
    dl.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return finalOutput;
};

const convertWithCloudmersive = async (localFilePath, baseName) => {
  const key = process.env.CLOUDMERSIVE_API_KEY;
  if (!key) throw new Error("CLOUDMERSIVE_API_KEY not configured");

  const url = "https://api.cloudmersive.com/convert/pdf/to/docx";
  const fd = new FormData();
  fd.append("file", fs.createReadStream(localFilePath));

  const headers = Object.assign({}, fd.getHeaders ? fd.getHeaders() : {}, {
    Apikey: key,
  });

  const resp = await axios.post(url, fd, {
    headers,
    responseType: "arraybuffer",
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120000,
  });

  const outputFileName = `${baseName}-${Date.now()}.docx`;
  const finalOutput = path.join(toolOutputDir, outputFileName);
  await fs.writeFile(finalOutput, Buffer.from(resp.data));
  return finalOutput;
};

export const compressFile = async (req, res) => {
  const inputPath = req.file?.path;
  let zipPath;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }

    await fs.ensureDir(toolOutputDir);

    const baseName = path.parse(req.file.originalname).name;
    const zipFileName = `${baseName}-${Date.now()}.zip`;
    zipPath = path.join(toolOutputDir, zipFileName);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", resolve);
      archive.on("error", reject);

      archive.pipe(output);
      archive.file(req.file.path, { name: req.file.originalname });
      archive.finalize();
    });

    return res.download(zipPath, zipFileName, async () => {
      await cleanupPaths([inputPath, zipPath]);
    });
  } catch (error) {
    await cleanupPaths([inputPath, zipPath]);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const pdfToWord = async (req, res) => {
  const inputPath = req.file?.path;
  let outputPath;
  let workDir;
  let downloadFileName = "converted.docx";

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    if (extension !== ".pdf") {
      await cleanupPaths([inputPath]);
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed"
      });
    }

    await fs.ensureDir(toolOutputDir);

    // also ensure base documents folder exists
    const documentsBase = path.join(__dirname, "..", "uploads", "documents");
    await fs.ensureDir(documentsBase);

  const originalBaseName = path.parse(req.file.originalname).name;
  const safeBaseName = sanitizeBaseName(originalBaseName);

  workDir = path.join(toolOutputDir, `${safeBaseName}-${Date.now()}`);
    await fs.ensureDir(workDir);

  // copy input into work dir to avoid path/permission issues and problematic characters
  const workingInputPath = path.join(workDir, `${safeBaseName}${extension}`);
    await fs.copy(inputPath, workingInputPath);

    const runSoffice = (cmd, args, timeoutMs = 120000) =>
      new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
        let finished = false;
        let stdout = "";
        let stderr = "";

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            try {
              child.kill("SIGKILL");
            } catch (e) {
              // ignore
            }
            reject(new Error("Conversion timed out"));
          }
        }, timeoutMs);

        if (child.stdout) {
          child.stdout.on("data", (d) => {
            try {
              stdout += d.toString();
            } catch (e) {
              stdout += String(d);
            }
          });
        }

        if (child.stderr) {
          child.stderr.on("data", (d) => {
            try {
              stderr += d.toString();
            } catch (e) {
              stderr += String(d);
            }
          });
        }

        child.on("error", (err) => {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            err.stdout = stdout;
            err.stderr = stderr;
            reject(err);
          }
        });

        child.on("close", (code) => {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve({ code, stdout, stderr });
          }
        });
      });

    const convertAttempts = [
      { convertTo: "docx", infilter: "writer_pdf_import" },
      { convertTo: "docx:MS Word 2007 XML", infilter: "writer_pdf_import" },
      { convertTo: "docx", infilter: null },
    ];

    let converted = false;
    let lastError = null;
    const sofficeCmd = findSofficeBinary();
    const sofficeAttemptLogs = [];

    if (sofficeCmd) {
      for (const attempt of convertAttempts) {
        const { convertTo, infilter } = attempt;
        const args = [
          "--headless",
          "--invisible",
          "--nologo",
          "--nofirststartwizard",
        ];

        if (infilter) {
          args.push(`--infilter=${infilter}`);
        }

        args.push(
          "--convert-to",
          convertTo,
          "--outdir",
          workDir,
          workingInputPath,
        );

        try {
          const result = await runSoffice(sofficeCmd, args, 180000);
          const code = result?.code;
          sofficeAttemptLogs.push({ convertTo, infilter, code, stdout: result?.stdout, stderr: result?.stderr });

          if (code === 0) {
            const waited = await waitForOutputInDir(workDir, 10000, 500);
            if (waited) {
              outputPath = waited;
            }
          }

          if (outputPath) {
            converted = true;
            break;
          }

          lastError = new Error(`soffice attempt produced no document for convert=${convertTo}`);
          lastError.stdout = result?.stdout;
          lastError.stderr = result?.stderr;
        } catch (err) {
          sofficeAttemptLogs.push({ convertTo, infilter, error: String(err).slice(0, 2000), stdout: err.stdout, stderr: err.stderr });
          lastError = err;
        }
      }
    }

    // If local LibreOffice didn't convert, attempt configured cloud fallbacks
    if (!outputPath && !converted) {
      try {
        if (process.env.CONVERTAPI_SECRET) {
          outputPath = await convertWithConvertAPI(workingInputPath, safeBaseName);
          converted = true;
        } else if (process.env.CLOUDMERSIVE_API_KEY) {
          outputPath = await convertWithCloudmersive(workingInputPath, safeBaseName);
          converted = true;
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Guaranteed local fallback: extract text from PDF and build a DOCX.
    if (!outputPath) {
      try {
        outputPath = await convertWithTextExtractionFallback(workingInputPath, safeBaseName);
        converted = true;
      } catch (fallbackErr) {
        const files = await fs.readdir(workDir);
        const debugFiles = [];
        for (const f of files) {
          try {
            const st = await fs.stat(path.join(workDir, f));
            debugFiles.push(`${f} (${st.size} bytes)`);
          } catch (e) {
            debugFiles.push(f);
          }
        }

        let details = debugFiles.join(", ");
        if (lastError) {
          if (lastError.stdout) details += `; stdout: ${String(lastError.stdout).slice(0, 1000)}`;
          if (lastError.stderr) details += `; stderr: ${String(lastError.stderr).slice(0, 1000)}`;
        }
        if (sofficeAttemptLogs.length) {
          details += `; attempts: ${sofficeAttemptLogs.map((a) => `${a.convertTo}${a.infilter ? `(${a.infilter})` : ""}:${a.code ?? "err"}`).join("|")}`;
        }

        throw new Error(`Conversion failed after all fallbacks. Details: ${details}; fallbackErr: ${String(fallbackErr).slice(0, 1000)}`);
      }
    }

    const producedExt = path.extname(outputPath).toLowerCase() || ".docx";
    downloadFileName = `${safeBaseName}-${Date.now()}${producedExt}`;

    // Ensure file served from output dir with consistent name
    const finalOutputPath = path.join(toolOutputDir, downloadFileName);
    if (path.resolve(outputPath) !== path.resolve(finalOutputPath)) {
      await fs.move(outputPath, finalOutputPath, { overwrite: true });
      outputPath = finalOutputPath;
    }

    // Respond with JSON containing the public file URL
    const publicUrl = `/uploads/documents/${downloadFileName}`;

    // cleanup temporary input/work dirs but keep final output
    await cleanupPaths([inputPath, workDir].filter(Boolean));

    return res.status(200).json({ success: true, fileUrl: publicUrl });
  } catch (error) {
    // log full error server-side for debugging
    // eslint-disable-next-line no-console
    console.error(error && error.stack ? error.stack : error);
    await cleanupPaths([inputPath, workDir].filter(Boolean));
    if (error?.code === "SOFFICE_MISSING" || error?.code === "ENOENT") {
      return res.status(501).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
