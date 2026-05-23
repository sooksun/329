export type SubtaskEvidenceItem = {
  id: string;
  caption: string;
  status: string;
  fileAssetId: string;
  filename: string;
  mimeType: string;
};

export type SubtaskItem = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  reported_progress: number;
  verified_progress: number;
  owner?: { id: string; name: string; username: string } | null;
  evidence: SubtaskEvidenceItem[];
};
