import * as core from "@actions/core";
import * as github from "@actions/github";
import { syncRepositories } from "./utils";
import { SyncInputs } from "./index";

async function run() {
  try {
    const inputs: SyncInputs = {
      sourceRepo: core.getInput("source-repo", { required: true }),
      sourceBranch: core.getInput("source-branch", { required: true }),
      destinationRepo: core.getInput("destination-repo", { required: true }),
      destinationBranch: core.getInput("destination-branch", {
        required: true,
      }),
      // syncOperation: core.getInput("sync-operation", { required: true }),
      githubToken: core.getInput("github-token", { required: true }),
    };

    const octokit = github.getOctokit(inputs.githubToken);

    await syncRepositories(inputs);
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

run();
