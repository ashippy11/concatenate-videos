import { Job, Status } from "../domain/model/job";
import * as fs from 'fs';
import * as path from 'path';

//Instead of keeping Job objects in-memory we are writing them to a file on an EBS volume- there are some
//potential scaling issues here as storing jobs as individual files on EBS and querying them by reading
//all files can become inefficient as the number of jobs grows, if given more time I would have used something like
//DynamoDB which would be quicker to index for jobs IDs and if we needed to scale the application with multiple
//instances then there would not be an I/O throughput issue like there could be with the EBS or EFS volume

// Use environment variable to determine the directory, for production use the EBS Volume path, on local use a tmp directory path
const JOBS_DIRECTORY = process.env.NODE_ENV === "production"
  ? "/mnt/job_data" // Path to the EBS volume in production
  : "/tmp/job_data"; // Fallback path for local or development environment

// Ensure the job directory exists
if (!fs.existsSync(JOBS_DIRECTORY)) {
  fs.mkdirSync(JOBS_DIRECTORY, { recursive: true });
}

function getJobFilePath(id: string): string {
  return path.join(JOBS_DIRECTORY, `${id}.json`);
}

export function saveJob(job: Job) {
  const jobFilePath = getJobFilePath(job.id);
  fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2)); // Store job data in JSON format
}

export function getJob(id: string): Job | undefined {
  const jobFilePath = getJobFilePath(id);
  if (fs.existsSync(jobFilePath)) {
    const jobData = fs.readFileSync(jobFilePath, "utf-8");
    return JSON.parse(jobData) as Job;
  }
  return undefined;
}

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

export function updateStatus(id: string, status: Status) {
  const job = getJob(id);
  if (!job) {
    throw new Error(`Job ${id} not found`);
  }
  job.status = status;
  saveJob(job); // Save the updated job back to EBS
}