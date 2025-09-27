const formidable = require("formidable");
const fs = require("fs");
const { trace } = require("potrace");

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

module.exports = (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const form = new formidable.IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
    multiples: false,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).json({ error: "Invalid form data" });
      return;
    }

    const file =
      files.image || files.file || (files && Object.values(files)[0]);
    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const imgPath = file.filepath || file.path;

    const opts = {
      turdSize: fields.turdSize ? Number(fields.turdSize) : 2,
      turnPolicy: fields.turnPolicy || "majority",
      optTolerance: fields.optTolerance ? Number(fields.optTolerance) : 0.4,
    };

    trace(imgPath, opts, (err2, svg) => {
      try { if (imgPath) fs.unlinkSync(imgPath); } catch (_) {}

      if (err2) {
        res.status(500).json({ error: "Vectorization failed" });
        return;
      }

      res.status(200).json({ svg });
    });
  });
};
