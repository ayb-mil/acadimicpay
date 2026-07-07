import fs from "fs";
import path from "path";

export interface ContactSubmission {
  name: string;
  contact: string;
  serviceSlug: string;
  amount: string;
  message: string;
  submittedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

export function saveSubmission(submission: ContactSubmission): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let existing: ContactSubmission[] = [];
  if (fs.existsSync(SUBMISSIONS_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf-8"));
    } catch {
      existing = [];
    }
  }

  existing.push(submission);
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(existing, null, 2), "utf-8");
}
