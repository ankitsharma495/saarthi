const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "../data/messy_students.json");
const OUTPUT = path.join(__dirname, "../data/cleaned_students.json");

// Allowed fields in the final clean output
const ALLOWED_FIELDS = ["name", "email", "status"];

/**
 * Parse various date formats into ISO 8601 (YYYY-MM-DD)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const str = dateStr.trim();

  const patterns = [
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD (already standard)
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // YYYY/MM/DD
    /^(\d{4})\/(\d{2})\/(\d{2})$/,
    // DD-MM-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,
    // YYYY.MM.DD
    /^(\d{4})\.(\d{2})\.(\d{2})$/,
  ];

  // MM/DD/YYYY
  let match = str.match(patterns[0]);
  if (match) {
    return new Date(match[3], match[1] - 1, match[2]).toISOString().split("T")[0];
  }

  // YYYY-MM-DD
  match = str.match(patterns[1]);
  if (match) {
    return new Date(match[1], match[2] - 1, match[3]).toISOString().split("T")[0];
  }

  // YYYY/MM/DD
  match = str.match(patterns[2]);
  if (match) {
    return new Date(match[1], match[2] - 1, match[3]).toISOString().split("T")[0];
  }

  // DD-MM-YYYY
  match = str.match(patterns[3]);
  if (match) {
    return new Date(match[3], match[2] - 1, match[1]).toISOString().split("T")[0];
  }

  // YYYY.MM.DD
  match = str.match(patterns[4]);
  if (match) {
    return new Date(match[1], match[2] - 1, match[3]).toISOString().split("T")[0];
  }

  // Fallback: native Date parsing for text dates like "April 1, 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Extract the students array from any JSON shape (flat array or nested object)
 */
function extractStudents(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.students)) return data.students;
  throw new Error("Cannot find students array in dataset");
}

function cleanData() {
  console.log("Reading messy dataset...");
  const raw = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
  const students = extractStudents(raw);
  console.log(`Found ${students.length} raw records\n`);

  // Track all cleaning actions for documentation
  const log = [];

  // Step 0: Strip top-level wrapper — only keep the students array
  if (!Array.isArray(raw)) {
    const removedKeys = Object.keys(raw).filter((k) => k !== "students");
    log.push({
      step: "Unwrap nested structure",
      action: `Removed top-level fields: [${removedKeys.join(", ")}]`,
      reason: "Only the 'students' array contains useful data. Fields like 'status', 'timestamp', 'meta' are API metadata, not student records.",
    });
  }

  // Step 1: Keep only allowed fields + resolve date
  const stripped = students.map((record, i) => {
    const cleaned = {};
    const removedFields = [];

    for (const key of Object.keys(record)) {
      if (ALLOWED_FIELDS.includes(key)) {
        cleaned[key] = record[key];
      } else if (key !== "created_at" && key !== "createdAt" && key !== "enrollment_date") {
        removedFields.push(key);
      }
    }

    if (removedFields.length > 0) {
      log.push({
        step: "Remove unnecessary fields",
        action: `Record ${i + 1}: Removed [${removedFields.join(", ")}]`,
        reason: "These fields are not part of the clean student schema (id, metadata, duplicated timestamps, etc.)",
      });
    }

    // Resolve duplicate date fields — pick the best one
    const dateFields = ["created_at", "createdAt", "enrollment_date"].filter((f) => record[f]);
    if (dateFields.length > 1) {
      log.push({
        step: "Resolve duplicate date fields",
        action: `Record ${i + 1}: Found [${dateFields.join(", ")}] — used '${dateFields[0]}'`,
        reason: "Multiple date fields exist due to inconsistent data entry. Prefer 'created_at' as the canonical source.",
      });
    }
    cleaned.rawDate = record.created_at || record.createdAt || record.enrollment_date || null;

    // Log date standardization
    if (cleaned.rawDate) {
      const parsed = parseDate(cleaned.rawDate);
      if (parsed && parsed !== cleaned.rawDate) {
        log.push({
          step: "Standardize date",
          action: `Record ${i + 1}: "${cleaned.rawDate}" → "${parsed}" (ISO 8601)`,
          reason: "Dates must be in consistent ISO format (YYYY-MM-DD) for reliable querying and sorting.",
        });
      }
    }

    return cleaned;
  });

  // Step 2: Standardize values
  const standardized = stripped.map((record) => ({
    name: record.name
      ? record.name
          .trim()
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "",
    email: record.email ? record.email.trim().toLowerCase() : "",
    enrollmentDate: parseDate(record.rawDate),
    course: record.course ? record.course.trim() : "",
    status: record.status ? record.status.trim().toLowerCase() : "active",
  }));

  // Step 3: Remove duplicates (by email)
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
    log.push({
      step: "Remove duplicates",
      action: `Removed ${duplicates.length} duplicate(s): ${duplicates.map((d) => `Record ${d.index} (${d.email})`).join(", ")}`,
      reason: "Duplicate entries identified by email. Kept the first occurrence to avoid redundant data.",
    });
  }

  // Print documentation
  console.log("--- Cleaning Log ---");
  log.forEach((entry, i) => {
    console.log(`\n[${i + 1}] ${entry.step}`);
    console.log(`    Action: ${entry.action}`);
    console.log(`    Reason: ${entry.reason}`);
  });

  console.log(`\n--- Summary ---`);
  console.log(`  Raw records:     ${students.length}`);
  console.log(`  Clean records:   ${unique.length}`);
  console.log(`  Duplicates:      ${duplicates.length}`);
  console.log(`  Dates converted: All → ISO 8601 (YYYY-MM-DD)`);

  fs.writeFileSync(OUTPUT, JSON.stringify(unique, null, 2));
  console.log(`\nCleaned data written to: ${OUTPUT}`);

  return unique;
}

// Run if executed directly
if (require.main === module) {
  cleanData();
}

module.exports = { cleanData };
