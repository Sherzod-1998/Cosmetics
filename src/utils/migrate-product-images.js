/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const MONGODB_URI = process.env.MONGODB_URI;

// Sizning Product schema minimal (faqat kerakli fieldlar)
const ProductSchema = new mongoose.Schema(
  {
    productImages: [String],
  },
  { collection: "products" } // collection nomingiz boshqa bo'lsa o'zgartiring
);
const Product = mongoose.model("Product", ProductSchema);

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function normalizeLocalPath(p) {
  return (p || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, ""); // "/uploads/.." -> "uploads/.."
}

function guessExt(urlOrPath) {
  const clean = (urlOrPath || "").split("?")[0].split("#")[0];
  const ext = path.extname(clean);
  if (ext && ext.length <= 6) return ext;
  return ".jpg";
}

async function downloadToUploads(url) {
  const ext = guessExt(url);
  const filename = uuidv4() + ext;
  const filepath = path.join(UPLOAD_DIR, filename);

  const res = await axios.get(url, { responseType: "stream", timeout: 30000 });
  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(filepath);
    res.data.pipe(w);
    w.on("finish", resolve);
    w.on("error", reject);
  });

  // DBga yoziladigan standart path (relative)
  return `uploads/products/${filename}`;
}

(async () => {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI env yo'q. Masalan: export MONGODB_URI='mongodb://...'");
    process.exit(1);
  }

  ensureDir();
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  const products = await Product.find({ productImages: { $exists: true, $ne: [] } }).lean();
  console.log("Products:", products.length);

  let changed = 0;

  for (const p of products) {
    const imgs = Array.isArray(p.productImages) ? p.productImages : [];
    if (!imgs.length) continue;

    let dirty = false;
    const next = [];

    for (const img of imgs) {
      const s = (img || "").trim();
      if (!s) continue;

      // 1) http(s) bo'lsa -> yuklab olib localga o'zgartiramiz
      if (/^https?:\/\//i.test(s)) {
        try {
          const local = await downloadToUploads(s);
          next.push(local);
          dirty = true;
        } catch (e) {
          console.log("⚠️ download fail:", s, e.message);
          // agar download bo'lmasa, vaqtincha eski linkni qoldirish mumkin:
          next.push(s);
        }
        continue;
      }

      // 2) local path normalize
      const normalized = normalizeLocalPath(s);
      next.push(normalized);
      if (normalized !== s) dirty = true;
    }

    // duplikatlarni olib tashlash (xohlasangiz)
    const uniq = Array.from(new Set(next));

    if (dirty) {
      await Product.updateOne({ _id: p._id }, { $set: { productImages: uniq } });
      changed++;
      console.log("✅ updated:", p._id.toString());
    }
  }

  console.log("Done. Updated:", changed);
  await mongoose.disconnect();
  process.exit(0);
})();
