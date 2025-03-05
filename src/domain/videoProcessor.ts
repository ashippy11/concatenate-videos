import got from "got";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import ffmpeg from "fluent-ffmpeg";
import { Job } from "./model/job";

// Accepting the job ID as a command-line argument
const jobId = process.argv[2];
if (!jobId) {
  console.error("Job ID is required.");
  process.exit(1);
}

// You can fetch the job from the repository or database by jobId if needed.
// For now, we're assuming it's already in memory or another method.

function writeFile(url: string, destinationFile: string) {
  return new Promise<void>((resolve) => {
    const writeStream = got
      .stream(url)
      .pipe(createWriteStream(destinationFile));
    writeStream.on("finish", resolve);
  });
}

// The rest of your video processing logic stays the same as before
export async function processVideos(job: Job) {
  console.log("DEBUG: job received in processVideos:", job);
  const filePaths = await downloadVideos(job);
  console.log(`downloaded ${job.sourceVideoUrls.length} files`);

  await mergeFiles(job, filePaths);
}

processVideos({ id: jobId } as Job).catch((err) => {
  console.error("Error processing video:", err);
  process.exit(1);  // Exit with error code if something goes wrong
});
