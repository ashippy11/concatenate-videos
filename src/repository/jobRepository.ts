import { Job, Status } from "../domain/model/job";

const jobs: Job[] = [];

export function saveJob(job: Job) {
  jobs.push(job);
}

export function getJob(id: string): Job | undefined {
  return jobs.find((job) => job.id === id);
}

export function getNextPendingJob(): Job | undefined {
  return jobs.find((job) => job.status === Status.pending);
}

export function updateStatus(id: string, status: Status) {
  const job = getJob(id);
  if (!job) {
    throw new Error(`Job ${id} not found`);
  }
  job.status = status;
}
