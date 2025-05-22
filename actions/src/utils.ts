// This file contains utility functions for the synchronization process.

import { Octokit } from "@octokit/rest";
import { SyncInputs } from "./index";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function syncRepositories(inputs: SyncInputs): Promise<void> {
    const { sourceRepo, sourceBranch, destinationRepo, destinationBranch, githubToken } = inputs;

    const octokit = new Octokit({ auth: githubToken });

    const tempBranch = `sync-${Date.now()}`;
    await createBranch(octokit, destinationRepo, destinationBranch, tempBranch);

    await fetchSourceChanges(sourceRepo, sourceBranch, destinationRepo, tempBranch);

    await commitChanges(tempBranch);

    await createPullRequest(octokit, destinationRepo, tempBranch, destinationBranch);
}

async function createBranch(octokit: Octokit, repo: string, baseBranch: string, newBranch: string): Promise<void> {
    const [owner, repoName] = repo.split("/");
    const { data: { object: { sha } } } = await octokit.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${baseBranch}`
    });

    await octokit.git.createRef({
        owner,
        repo: repoName,
        ref: `refs/heads/${newBranch}`,
        sha
    });
}

async function fetchSourceChanges(sourceRepo: string, sourceBranch: string, destinationRepo: string, tempBranch: string): Promise<void> {
    await execPromise(`git clone --single-branch --branch ${sourceBranch} https://github.com/${sourceRepo}.git`);
    await execPromise(`git remote add destination https://github.com/${destinationRepo}.git`);
    await execPromise(`git checkout -b ${tempBranch}`);
    await execPromise(`git pull origin ${sourceBranch}`);
}

async function commitChanges(tempBranch: string): Promise<void> {
    await execPromise(`git config user.name "github-actions[bot]"`);
    await execPromise(`git config user.email "github-actions[bot]@users.noreply.github.com"`);
    await execPromise(`git add .`);
    await execPromise(`git commit -m "Sync changes from source repository"`);
    await execPromise(`git push destination ${tempBranch}`);
}

async function createPullRequest(octokit: Octokit, repo: string, head: string, base: string): Promise<void> {
    const [owner, repoName] = repo.split("/");
    await octokit.pulls.create({
        owner,
        repo: repoName,
        title: "Synchronize changes",
        head,
        base,
        body: "This pull request synchronizes changes from the source repository."
    });
}
