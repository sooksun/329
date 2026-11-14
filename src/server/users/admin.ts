import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { nameInitials, normalizeUsername, validatePassword, validateUsername } from "@/lib/user-account";

const assignableRoles = new Set([
  "Committee Lead",
  "Task Owner",
  "Data Recorder",
  "Finance Officer",
  "Evidence Reviewer",
  "Viewer"
]);

export async function listUsersForAdmin() {
  return prisma.user.findMany({
    where: { deleted_at: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      created_at: true,
      roles: { include: { role: { select: { name: true, label: true } } } },
      committeeLinks: {
        include: { committee: { select: { id: true, name: true } } }
      }
    }
  });
}

export async function createUserByAdmin(input: {
  name: string;
  username: string;
  password: string;
  roleName?: string;
  committeeId?: string;
  position?: string;
  createdById: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("กรุณาระบุชื่อ-นามสกุล");
  const usernameError = validateUsername(input.username);
  if (usernameError) throw new Error(usernameError);
  const passwordError = validatePassword(input.password, { required: true });
  if (passwordError) throw new Error(passwordError);

  const username = normalizeUsername(input.username);
  const exists = await prisma.user.findFirst({ where: { username, deleted_at: null } });
  if (exists) throw new Error("ชื่อผู้ใช้นี้มีในระบบแล้ว");

  const roleName = input.roleName && assignableRoles.has(input.roleName) ? input.roleName : "Task Owner";
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error("ไม่พบบทบาทที่เลือก");

  const password_hash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      password_hash,
      roles: { create: [{ role_id: role.id }] },
      ...(input.committeeId
        ? {
            committeeLinks: {
              create: {
                committee_id: input.committeeId,
                position: input.position?.trim() || "สมาชิกคณะ"
              }
            }
          }
        : {})
    },
    include: {
      roles: { include: { role: true } },
      committeeLinks: { include: { committee: true } }
    }
  });

  const org = await prisma.organization.findFirst({ where: { deleted_at: null }, orderBy: { created_at: "asc" } });
  if (org) {
    await prisma.organizationMember.upsert({
      where: { organization_id_user_id: { organization_id: org.id, user_id: user.id } },
      create: { organization_id: org.id, user_id: user.id },
      update: {}
    });
  }

  await prisma.auditLog.create({
    data: {
      user_id: input.createdById,
      action: "Create user",
      entity_type: "User",
      entity_id: user.id,
      new_value: JSON.stringify({ username: user.username, name: user.name, role: roleName })
    }
  });

  // ห้ามส่ง password_hash กลับไปให้ client (route คืนค่านี้เป็น JSON ตรงๆ)
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * แก้ไขข้อมูลผู้ใช้โดยผู้ดูแลระบบ
 * - roleName: เปลี่ยนเฉพาะบทบาทที่ assign ได้ (บทบาทระดับระบบ เช่น Super Admin คงไว้)
 * - committeeId: undefined = ไม่เปลี่ยน, "" = ถอดออกจากคณะในโครงการนี้, id = ย้ายไปคณะนั้น
 * - committeeScopeIds: คณะของโครงการที่ active — แก้เฉพาะลิงก์ในขอบเขตนี้ ไม่แตะโครงการอื่น
 */
export async function updateUserByAdmin(input: {
  userId: string;
  name: string;
  username: string;
  password?: string;
  roleName?: string;
  committeeId?: string;
  position?: string;
  committeeScopeIds: string[];
  updatedById: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("กรุณาระบุชื่อ-นามสกุล");
  const usernameError = validateUsername(input.username);
  if (usernameError) throw new Error(usernameError);
  if (input.password) {
    const passwordError = validatePassword(input.password, { required: true });
    if (passwordError) throw new Error(passwordError);
  }

  const existing = await prisma.user.findFirst({
    where: { id: input.userId, deleted_at: null },
    include: { roles: { include: { role: true } }, committeeLinks: true }
  });
  if (!existing) throw new Error("ไม่พบบัญชีผู้ใช้");

  const username = normalizeUsername(input.username);
  const duplicate = await prisma.user.findFirst({
    where: { username, id: { not: input.userId }, deleted_at: null }
  });
  if (duplicate) throw new Error("ชื่อผู้ใช้นี้มีในระบบแล้ว");

  let newRoleId: string | undefined;
  if (input.roleName) {
    if (!assignableRoles.has(input.roleName)) throw new Error("บทบาทที่เลือกไม่ถูกต้อง");
    const role = await prisma.role.findUnique({ where: { name: input.roleName } });
    if (!role) throw new Error("ไม่พบบทบาทที่เลือก");
    newRoleId = role.id;
  }

  if (input.committeeId && !input.committeeScopeIds.includes(input.committeeId)) {
    throw new Error("ไม่พบคณะกรรมการที่เลือกในโครงการนี้");
  }

  const password_hash = input.password ? await bcrypt.hash(input.password, 10) : undefined;

  const affectedProjectIds = new Set<string>();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { name, username, ...(password_hash ? { password_hash } : {}) }
    });

    if (newRoleId) {
      const assignableRoleIds = existing.roles
        .filter((r) => assignableRoles.has(r.role.name))
        .map((r) => r.role_id);
      if (assignableRoleIds.length) {
        await tx.userRole.deleteMany({
          where: { user_id: input.userId, role_id: { in: assignableRoleIds } }
        });
      }
      const hasRole = existing.roles.some(
        (r) => r.role_id === newRoleId && !assignableRoles.has(r.role.name)
      );
      if (!hasRole) {
        await tx.userRole.create({ data: { user_id: input.userId, role_id: newRoleId } });
      }
    }

    if (input.committeeId !== undefined) {
      const position = input.position?.trim() || "สมาชิกคณะ";
      const current = existing.committeeLinks.find((l) => input.committeeScopeIds.includes(l.committee_id));
      if (current && current.committee_id === input.committeeId) {
        await tx.committeeMember.update({ where: { id: current.id }, data: { position } });
      } else {
        if (input.committeeScopeIds.length) {
          await tx.committeeMember.deleteMany({
            where: { user_id: input.userId, committee_id: { in: input.committeeScopeIds } }
          });
        }
        if (input.committeeId) {
          await tx.committeeMember.create({
            data: { user_id: input.userId, committee_id: input.committeeId, position }
          });
        }
      }
    }

    // ชื่อหัวหน้าคณะ/ผู้รับผิดชอบความเสี่ยง/ผู้รับผิดชอบมติประชุม เก็บเป็นข้อความ (ไม่ได้ผูก user)
    // → sync ชื่อใหม่ให้ตรงกับบัญชีผู้ใช้
    const oldName = existing.name;
    const committeesToSync = await tx.committee.findMany({
      where: {
        deleted_at: null,
        owner_name: { not: name },
        OR: [
          { owner_name: oldName },
          { members: { some: { user_id: input.userId, position: { startsWith: "หัวหน้า" } } } }
        ]
      },
      select: { id: true, project_id: true }
    });
    if (committeesToSync.length) {
      await tx.committee.updateMany({
        where: { id: { in: committeesToSync.map((c) => c.id) } },
        data: { owner_name: name, owner_initials: nameInitials(name) }
      });
      committeesToSync.forEach((c) => affectedProjectIds.add(c.project_id));
    }
    if (oldName !== name) {
      const risks = await tx.risk.findMany({ where: { owner_name: oldName }, select: { project_id: true } });
      await tx.risk.updateMany({ where: { owner_name: oldName }, data: { owner_name: name } });
      risks.forEach((r) => affectedProjectIds.add(r.project_id));
      await tx.meetingActionItem.updateMany({ where: { owner_name: oldName }, data: { owner_name: name } });
    }

    await tx.auditLog.create({
      data: {
        user_id: input.updatedById,
        action: "Update user",
        entity_type: "User",
        entity_id: input.userId,
        old_value: JSON.stringify({
          username: existing.username,
          name: existing.name,
          roles: existing.roles.map((r) => r.role.name)
        }),
        new_value: JSON.stringify({
          username,
          name,
          role: input.roleName ?? null,
          committee_id: input.committeeId ?? null,
          password_reset: Boolean(password_hash)
        })
      }
    });
  });

  // dashboard/shell ของโครงการ cache ไว้ใน Redis — ล้างเพื่อให้ชื่อใหม่แสดงทันที
  await Promise.all([...affectedProjectIds].map((id) => invalidateProjectCache(id).catch(() => undefined)));

  return { id: input.userId, name, username };
}

export async function listCommitteeMembers(committeeId: string) {
  return prisma.committeeMember.findMany({
    where: { committee_id: committeeId },
    include: { user: { select: { id: true, name: true, username: true } } },
    orderBy: { position: "asc" }
  });
}
