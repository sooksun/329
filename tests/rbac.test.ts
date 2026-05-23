import { describe, expect, it } from "vitest";
import { can, permissions } from "../src/lib/rbac";
import {
  canEditCommitteeTask,
  canViewCommitteeTask,
  filterTasksByCommitteeAccess,
  isGlobalTaskAdmin
} from "../src/server/auth/committee-access";
import {
  canReviewEvidence,
  canUpdateTask,
  canUploadEvidence,
  canViewDashboard,
  canViewTask
} from "../src/server/permissions/assert";

const sportCommittee = "committee-sport";
const venueCommittee = "committee-venue";
const otherCommittee = "committee-other";

const committeeMember = { id: "u1", roles: ["Data Recorder", "Task Owner"] };
const evidenceReviewer = { id: "u2", roles: ["Evidence Reviewer"] };
const director = { id: "dir", roles: ["Project Director"] };
const admin = { id: "adm", roles: ["Super Admin"] };
const outsider = { id: "u9", roles: ["Viewer"] };

const memberAccess = { committeeIds: [sportCommittee], isGlobalAdmin: false };
const globalAccess = { committeeIds: [], isGlobalAdmin: true };

describe("RBAC permissions", () => {
  it("allows admin wildcard", () => {
    expect(can(["Super Admin"], permissions.taskManage)).toBe(true);
  });

  it("scopes project director to review and reports", () => {
    expect(can(["Project Director"], permissions.evidenceReview)).toBe(true);
    expect(can(["Project Director"], permissions.snapshotManage)).toBe(false);
  });

  it("requires dashboard permission for shell access", () => {
    expect(canViewDashboard({ id: "v1", roles: ["Viewer"] })).toBe(true);
    expect(canViewDashboard({ id: "x1", roles: [] })).toBe(false);
  });
});

describe("Committee-scoped task access", () => {
  it("treats admin and director as global", () => {
    expect(isGlobalTaskAdmin(admin)).toBe(true);
    expect(isGlobalTaskAdmin(director)).toBe(true);
    expect(isGlobalTaskAdmin(committeeMember)).toBe(false);
  });

  it("allows committee member to edit only own committee tasks", () => {
    const ownTask = { committee_id: sportCommittee, owner_id: "other" };
    const foreignTask = { committee_id: venueCommittee, owner_id: "u1" };

    expect(canEditCommitteeTask(committeeMember, ownTask, memberAccess)).toBe(true);
    expect(canEditCommitteeTask(committeeMember, foreignTask, memberAccess)).toBe(false);
    expect(canUpdateTask(committeeMember, ownTask, memberAccess)).toBe(true);
    expect(canUpdateTask(committeeMember, foreignTask, memberAccess)).toBe(false);
  });

  it("allows global admin to edit any committee", () => {
    const task = { committee_id: otherCommittee, owner_id: null };
    expect(canUpdateTask(director, task, globalAccess)).toBe(true);
    expect(canUploadEvidence(admin, task, globalAccess)).toBe(true);
  });

  it("blocks viewer without committee membership", () => {
    const task = { committee_id: sportCommittee };
    const access = { committeeIds: [], isGlobalAdmin: false };
    expect(canViewCommitteeTask(outsider, task, access)).toBe(false);
    expect(canViewTask(outsider, task, access)).toBe(false);
  });

  it("scopes evidence review to own committee unless global admin", () => {
    const sportEvidence = { committee_id: sportCommittee };
    const venueEvidence = { committee_id: venueCommittee };

    expect(canReviewEvidence(evidenceReviewer, sportEvidence, memberAccess)).toBe(true);
    expect(canReviewEvidence(evidenceReviewer, venueEvidence, memberAccess)).toBe(false);
    expect(canReviewEvidence(director, venueEvidence, globalAccess)).toBe(true);
    expect(canReviewEvidence({ id: "u3", roles: ["Task Owner"] }, sportEvidence, memberAccess)).toBe(false);
  });

  it("filters task lists for committee members", () => {
    const tasks = [
      { committee_id: sportCommittee, id: "t1" },
      { committee_id: venueCommittee, id: "t2" },
      { committee_id: otherCommittee, id: "t3" }
    ];
    const scoped = filterTasksByCommitteeAccess(tasks, memberAccess);
    expect(scoped.map((task) => task.id)).toEqual(["t1"]);
  });
});
