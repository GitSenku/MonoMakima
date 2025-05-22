export interface SyncInputs {
    sourceRepo: string;
    sourceBranch: string;
    destinationRepo: string;
    destinationBranch: string;
    // syncOperation: string;
    githubToken: string;
}