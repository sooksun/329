import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/messages";

export async function listCommitteesWithMembers(projectId: string) {
  return prisma.committee.findMany({
    where: { project_id: projectId, deleted_at: null },
    orderBy: { sort_order: "asc" },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { position: "asc" }
      },
      _count: { select: { tasks: { where: { deleted_at: null } } } }
    }
  });
}

export async function createCommittee(input: {
  projectId: string;
  name: string;
  owner_name: string;
  owner_initials: string;
  sort_order?: number;
  risk_level?: string;
  planned_budget?: number;
  createdById: string;
}) {
  const name = input.name.trim();
  const owner_name = input.owner_name.trim();
  const owner_initials = input.owner_initials.trim();
  if (!name) throw new Error(errors.committeeNameRequired);
  if (!owner_name) throw new Error("กรุณาระบุชื่อหัวหน้าคณะ");
  if (!owner_initials) throw new Error("กรุณาระบุตัวย่อหัวหน้าคณะ");

  const maxOrder = await prisma.committee.aggregate({
    where: { project_id: input.projectId, deleted_at: null },
    _max: { sort_order: true }
  });

  return prisma.committee.create({
    data: {
      project_id: input.projectId,
      name,
      owner_name,
      owner_initials,
      sort_order: input.sort_order ?? (maxOrder._max.sort_order ?? 0) + 1,
      risk_level: input.risk_level?.trim() || "Low",
      planned_budget: input.planned_budget ?? 0,
      created_by: input.createdById,
      updated_by: input.createdById
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, username: true } } } },
      _count: { select: { tasks: true } }
    }
  });
}

export async function updateCommittee(
  committeeId: string,
  projectId: string,
  data: {
    name?: string;
    owner_name?: string;
    owner_initials?: string;
    sort_order?: number;
    risk_level?: string;
    planned_budget?: number;
  },
  updatedById: string
) {
  const existing = await prisma.committee.findFirst({
    where: { id: committeeId, project_id: projectId, deleted_at: null }
  });
  if (!existing) throw new Error(errors.committeeNotFound);

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  if (!name) throw new Error(errors.committeeNameRequired);

  return prisma.committee.update({
    where: { id: committeeId },
    data: {
      name,
      owner_name: data.owner_name !== undefined ? data.owner_name.trim() : existing.owner_name,
      owner_initials: data.owner_initials !== undefined ? data.owner_initials.trim() : existing.owner_initials,
      sort_order: data.sort_order ?? existing.sort_order,
      risk_level: data.risk_level !== undefined ? data.risk_level.trim() : existing.risk_level,
      planned_budget: data.planned_budget ?? existing.planned_budget,
      updated_by: updatedById
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, username: true } } } },
      _count: { select: { tasks: { where: { deleted_at: null } } } }
    }
  });
}

export async function softDeleteCommittee(committeeId: string, projectId: string, updatedById: string) {
  const existing = await prisma.committee.findFirst({
    where: { id: committeeId, project_id: projectId, deleted_at: null },
    include: { _count: { select: { tasks: { where: { deleted_at: null } } } } }
  });
  if (!existing) throw new Error(errors.committeeNotFound);
  if (existing._count.tasks > 0) throw new Error(errors.committeeHasTasks);

  return prisma.committee.update({
    where: { id: committeeId },
    data: { deleted_at: new Date(), updated_by: updatedById }
  });
}

export async function addCommitteeMember(input: {
  committeeId: string;
  projectId: string;
  userId: string;
  position: string;
}) {
  const committee = await prisma.committee.findFirst({
    where: { id: input.committeeId, project_id: input.projectId, deleted_at: null }
  });
  if (!committee) throw new Error(errors.committeeNotFound);

  const user = await prisma.user.findFirst({ where: { id: input.userId, deleted_at: null } });
  if (!user) throw new Error("ไม่พบผู้ใช้");

  const position = input.position.trim();
  if (!position) throw new Error(errors.committeeMemberPositionRequired);

  const dup = await prisma.committeeMember.findFirst({
    where: { committee_id: input.committeeId, user_id: input.userId }
  });
  if (dup) throw new Error(errors.committeeMemberExists);

  return prisma.committeeMember.create({
    data: {
      committee_id: input.committeeId,
      user_id: input.userId,
      position
    },
    include: { user: { select: { id: true, name: true, username: true } } }
  });
}

export async function updateCommitteeMember(
  memberId: string,
  committeeId: string,
  position: string
) {
  const member = await prisma.committeeMember.findFirst({
    where: { id: memberId, committee_id: committeeId }
  });
  if (!member) throw new Error(errors.committeeMemberNotFound);

  const nextPosition = position.trim();
  if (!nextPosition) throw new Error(errors.committeeMemberPositionRequired);

  return prisma.committeeMember.update({
    where: { id: memberId },
    data: { position: nextPosition },
    include: { user: { select: { id: true, name: true, username: true } } }
  });
}

export async function removeCommitteeMember(memberId: string, committeeId: string) {
  const member = await prisma.committeeMember.findFirst({
    where: { id: memberId, committee_id: committeeId }
  });
  if (!member) throw new Error(errors.committeeMemberNotFound);
  await prisma.committeeMember.delete({ where: { id: memberId } });
}

export async function listUsersForCommitteePicker(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organization_id: true }
  });
  if (!project) return [];

  return prisma.user.findMany({
    where: {
      deleted_at: null,
      orgMemberships: { some: { organization_id: project.organization_id } }
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true }
  });
}
