
export type PendingResume = {
  generatedBlob?: Blob;
  fileName?: string;
  jobDescription?: string;
  resumeFile?: File;
  resumeFileName?: string;
  resumeId?: string;
};

let cached: PendingResume | null = null;

export function getPendingResume(): PendingResume | null {
  return cached;
}

export function setPendingResume(value: PendingResume | null): void {
  cached = value;
}

export function clearPendingResume(): void {
  cached = null;
}

export function hasPendingResumeData(value: PendingResume | undefined | null): boolean {
  if (!value) return false;
  return Boolean(
    value.generatedBlob ||
      value.jobDescription ||
      value.resumeFile ||
      value.resumeId,
  );
}
