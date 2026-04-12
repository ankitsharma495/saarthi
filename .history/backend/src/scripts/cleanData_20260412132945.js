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
  console.log(`Found ${students.length} raw records`);

  // Step 1: Keep only allowed fields + resolve date from created_at / createdAt / enrollment_date
  const stripped = students.map((record) => {
    const cleaned = {};
    for (const field of ALLOWED_FIELDS) {
      if (record[field] !== undefined) {
        cleaned[field] = record[field];
      }
    }
    // Pick the best date field available (created_at > createdAt > enrollment_date)
    cleaned.rawDate = record.created_at || record.createdAt || record.enrollment_date || null;
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
  const unique = standardized.filter((record) => {
    if (seen.has(record.email)) return false;
    seen.add(record.email);
    return true;
  });

  console.log(
    `After cleaning: ${unique.length} unique records (removed ${raw.length - unique.length} duplicates)`
  );

  fs.writeFileSync(OUTPUT, JSON.stringify(unique, null, 2));
  console.log(`Cleaned data written to: ${OUTPUT}`);

  return unique;
}

// Run if executed directly
if (require.main === module) {
  cleanData();
}

module.exports = { cleanData };
