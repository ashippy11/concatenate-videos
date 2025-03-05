import { Job, Status } from "../domain/model/job";
import * as fs from 'fs';
import * as path from 'path';


// Use environment variable to determine the directory, for production use the EBS Volume path, on local use a tmp directory path
const JOBS_DIRECTORY = process.env.NODE_ENV === "production"
  ? "/mnt/job_data" // Path to the EBS volume in production
  : "/tmp/job_data"; // Fallback path for local or development environment

// Ensure the job directory exists
if (!fs.existsSync(JOBS_DIRECTORY)) {
  fs.mkdirSync(JOBS_DIRECTORY, { recursive: true });
}

// Helper function to get the job file path
function getJobFilePath(id: string): string {
  return path.join(JOBS_DIRECTORY, `${id}.json`);
}

// Function to save job to the EBS volume
export function saveJob(job: Job) {
  const jobFilePath = getJobFilePath(job.id);
  fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2)); // Store job data in JSON format
}

// Function to load a job from the EBS volume
export function getJob(id: string): Job | undefined {
  const jobFilePath = getJobFilePath(id);
  if (fs.existsSync(jobFilePath)) {
    const jobData = fs.readFileSync(jobFilePath, "utf-8");
    return JSON.parse(jobData) as Job;
  }
  return undefined;
}

// Function to get the next pending job
export function getNextPendingJob(): Job | undefined {
  const files = fs.readdirSync(JOBS_DIRECTORY);
  for (const file of files) {
    const jobData = fs.readFileSync(path.join(JOBS_DIRECTORY, file), "utf-8");
    const job: Job = JSON.parse(jobData);
    if (job.status === Status.pending) {
      return job;
    }
  }
  return undefined;
}

// Function to update job status on EBS volume
export function updateStatus(id: string, status: Status) {
  const job = getJob(id);
  if (!job) {
    throw new Error(`Job ${id} not found`);
  }
  job.status = status;
  saveJob(job); // Save the updated job back to EBS
}