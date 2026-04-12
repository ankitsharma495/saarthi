/**
 * /utils/dataCleaner.js
 *
 * Reads the messy dataset, cleans it, and writes cleanedStudents.json.
 * This is a pure utility — no DB dependency. Can be run standalone or imported.
 *
 * Flow: messy_students.json → clean → cleaned_students.json
 */

const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "../data/messy_students.json");
const OUTPUT = path.join(__dirname, "../data/cleaned_students.json");

const ALLOWED_FIELDS = ["name", "email", "status"];

// ─── Date Parsing ───────────────────────────────────────────────
function parseDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.trim();

  const patterns = [
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [3, 1, 2] },   // MM/DD/YYYY
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, order: [1, 2, 3] },          // YYYY-MM-DD
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, order: [1, 2, 3] },        // YYYY/MM/DD
    { regex: /^(\d{2})-(\d{2})-(\d{4})$/, order: [3, 2, 1] },          // DD-MM-YYYY
    { regex: /^(\d{4})\.(\d{2})\.(\d{2})$/, order: [1, 2, 3] },        // YYYY.MM.DD
  ];

  for (const { regex, order } of patterns) {
    const match = str.match(regex);
    if (match) {
      const [yi, mi, di] = order;
      return new Date(match[yi], match[mi] - 1, match[di]).toISOString().split("T")[0];
    }
  }

  // Fallback: native Date parsing for text dates ("April 1, 2026")
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

// ─── Extract students array from any JSON shape ─────────────────
function extractStudents(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.students)) return data.students;
  throw new Error("Cannot find students array in dataset");
}

// ─── Main Cleaning Function ─────────────────────────────────────
function cleanData() {
  console.log("=== Data Cleaning Pipeline ===\n");

  const raw = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
  const students = extractStudents(raw);
  console.log(`Found ${students.length} raw records\n`);

  const log = [];

  // Step 0: Log wrapper removal
  if (!Array.isArray(raw)) {
    const removedKeys = Object.keys(raw).filter((k) => k !== "students");
    log.push(
      `[Unwrap] Removed top-level fields: [${removedKeys.join(", ")}] — API metadata, not student data.`
    );
  }

  // Step 1: Strip unnecessary fields + resolve date
  const stripped = students.map((record, i) => {
    const cleaned = {};
    const removedFields = [];

    for (const key of Object.keys(record)) {
      if (ALLOWED_FIELDS.includes(key)) {
        cleaned[key] = record[key];
      } else if (!["created_at", "createdAt", "enrollment_date"].includes(key)) {
        removedFields.push(key);
      }
    }

    if (removedFields.length > 0) {
      log.push(`[Strip]  Record ${i + 1}: Removed [${removedFields.join(", ")}]`);
    }

    // Pick best date field
    const dateFields = ["created_at", "createdAt", "enrollment_date"].filter((f) => record[f]);
    if (dateFields.length > 1) {
      log.push(`[Date]   Record ${i + 1}: Multiple dates [${dateFields.join(", ")}] — used '${dateFields[0]}'`);
    }
    cleaned.rawDate = record.created_at || record.createdAt || record.enrollment_date || null;

    if (cleaned.rawDate) {
      const parsed = parseDate(cleaned.rawDate);
      if (parsed && parsed !== cleaned.rawDate) {
        log.push(`[Date]   Record ${i + 1}: "${cleaned.rawDate}" → "${parsed}" (ISO 8601)`);
      }
    }

    return cleaned;
  });

  // Step 2: Standardize values
  const standardized = stripped.map((record) => ({
    name: record.name
      ? record.name.trim().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
      : "",
    email: record.email ? record.email.trim().toLowerCase() : "",
    enrollmentDate: parseDate(record.rawDate),
    course: record.course ? record.course.trim() : "",
    status: record.status ? record.status.trim().toLowerCase() : "active",
  }));

  // Step 3: Remove duplicates by email
  const seen = new Set();
  const duplicates = [];
  const unique = standardized.filter((record, i) => {
    if (seen.has(record.email)) {
      duplicates.push({ index: i + 1, email: record.email });
      return false;
    }
    seen.add(record.email);
    return true;
  });

  if (duplicates.length > 0) {
    log.push(
      `[Dedup]  Removed ${duplicates.length} duplicate(s): ${duplicates.map((d) => `Record ${d.index} (${d.email})`).join(", ")}`
    );
  }

  // Print cleaning log
  console.log("--- Cleaning Log ---");
  log.forEach((entry) => console.log(`  ${entry}`));
  console.log(`\n--- Summary ---`);
  console.log(`  Raw: ${students.length} → Clean: ${unique.length} (${duplicates.length} duplicates removed)`);

  // Write output
  fs.writeFileSync(OUTPUT, JSON.stringify(unique, null, 2));
  console.log(`  Output: ${OUTPUT}\n`);

  return unique;
}

// ─── Read already-cleaned data (for seeding) ────────────────────
function getCleanedData() {
  if (!fs.existsSync(OUTPUT)) {
    console.log("Cleaned data not found — running cleaner first...");
    return cleanData();
  }
  return JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
}

// Run standalone: node src/utils/dataCleaner.js
if (require.main === module) {
  cleanData();
}

module.exports = { cleanData, getCleanedData };
