import { v4 as uuid } from "uuid";

import {
  CreateJobRequest,
  CreateJobResponse,
  GetJobStatusResponse,
  Job,
  Status,
} from "./model/job";
import {
  saveJob,
  getJob,
  getNextPendingJob,
  updateStatus,
} from "../repository/jobRepository";
import { processVideos } from "./videoProcessor";

export async function createJob(
  createJobRequest: CreateJobRequest
): Promise<CreateJobResponse> {
  const job: Job = new Job(
    uuid(),
    createJobRequest.sourceVideoUrls,
    createJobRequest.destination,
    Status.pending
  );
  await saveJob(job);
  return new CreateJobResponse(job.id);
}

export async function getStatus(id: string): Promise<GetJobStatusResponse> {
  const job = await getJob(id);
  if (!job) {
    throw new Error(`job ${id} is not found`);
  }
  return new GetJobStatusResponse(Status[job.status]);
}

export async function processNextJob() {
  const job = await getNextPendingJob();
  if (!job) {
    console.log("no jobs to process");
    return;
  }
  console.log(`processing job ${job.id}`);
  await updateStatus(job.id, Status.inProgress);

  await processVideos(job);

  await updateStatus(job.id, Status.done);
}
