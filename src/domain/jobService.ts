import { v4 as uuid } from "uuid";
import { spawn } from "child_process";  // Importing the child_process module

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

  //We can only pass strings to the command line argument so we need to serialize the job
  const jobObjectString = JSON.stringify(job);
  const jobProcessor = spawn("npx", ["ts-node", "./src/domain/videoProcessor.ts", jobObjectString]);

  // Handling stdout and stderr of the child process
  jobProcessor.stdout.on("data", (data) => {
    console.log(`jobProcessor stdout: ${data}`);
  });

  jobProcessor.stderr.on("data", (data) => {
    console.error(`jobProcessor stderr: ${data}`);
  });

  // When the job processor finishes, update the job status
  jobProcessor.on("close", async (code) => {
    if (code === 0) {
      await updateStatus(job.id, Status.done);
    } else {
      await updateStatus(job.id, Status.error);
      console.error(`Job ${job.id} failed with exit code ${code}`);
    }
  });
}
