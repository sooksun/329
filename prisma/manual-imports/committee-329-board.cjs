/* eslint-disable */
/**
 * นำเข้ารายชื่อ "คณะกรรมการ 329" (ครั้งเดียว) — รันใน container ของเว็บ:
 *
 *   ดูก่อน (ไม่เขียนอะไร):  docker exec -i yunnansports-web node prisma/manual-imports/committee-329-board.cjs
 *   เขียนจริง:              docker exec -i yunnansports-web node prisma/manual-imports/committee-329-board.cjs --apply
 *
 * สิ่งที่ทำ:
 *  - จับคู่คนในรายชื่อกับผู้ใช้เดิม (ตาม username ที่ยืนยันแล้ว หรือชื่อที่สะกดใกล้เคียง) — ไม่สร้างซ้ำ
 *  - เปลี่ยนชื่อให้ตรงรายชื่อ + ต่อท้ายชื่อจีน
 *  - สร้างผู้ใช้ใหม่ (รหัสผ่านสุ่ม แสดงครั้งเดียวในหน้าจอนี้) — บอร์ด = Viewer, ฝ่าย = Task Owner
 *  - สร้างคณะ "คณะกรรมการ 329" (ถ้ายังไม่มี) แล้วใส่สมาชิกพร้อมตำแหน่ง
 *  - ใส่สมาชิกในคณะ กีฬา สถานที่ฯ / อำนวยการฯ ตามหน้าที่ (ไม่ถอดใครออกจากคณะเดิม)
 *  - sync ชื่อ + ตัวย่อหัวหน้าคณะทุกคณะ แล้วล้าง cache (Redis)
 * รันซ้ำได้ — รอบสองจะเจอว่ามีอยู่แล้วและไม่สร้างซ้ำ
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const APPLY = process.argv.includes("--apply");
const TEST_ROLLBACK = process.env.TEST_ROLLBACK === "1"; // ใช้ทดสอบ: ทำทุกอย่างแล้ว rollback
const BOARD_NAME = "คณะกรรมการ 329";
const OPS = "กีฬา สถานที่ และความปลอดภัย";
const GOV = "อำนวยการและการเงิน";

// ชื่อตามรายชื่อ (สะกดตามต้นฉบับ) + ชื่อจีน; username = บัญชีเดิมที่ยืนยันว่าเป็นคนเดียวกัน, newUsername = ใช้เมื่อต้องสร้างใหม่
const PEOPLE = [
  { name: "สรรเสริญ สกุลรัตนไพศาล 董彬雲", username: "gov_staff", expect: "สรรเสริญ สกุลรัตน์ไพศาล", committee: BOARD_NAME, position: "ประธานฝ่ายจีน" },
  { name: "อภิสิทธ์ ปอดอแก้ว", newUsername: "board_chair_th", role: "Viewer", committee: BOARD_NAME, position: "ประธานฝ่ายไทย" },
  { name: "สินชัย แซ่ลี 李靜平", username: "ops_lead", expect: "สินชัย แซ่ลี", committee: BOARD_NAME, position: "ผู้ดำเนินการ" },
  { name: "จะรอ แช่ทุ่ง 童文良", newUsername: "board_vice_op", role: "Viewer", committee: BOARD_NAME, position: "รองผู้ดำเนินการ" },
  { name: "รัฐกร ศุภลักภักดีกุล 石兆清", newUsername: "board_op2", role: "Viewer", committee: BOARD_NAME, position: "ผู้ดำเนินการ" },
  { name: "สมบูรณ์ ศิรันดร์กุล 李學強", newUsername: "board_director", role: "Viewer", committee: BOARD_NAME, position: "ผู้อำนวยการ" },
  { name: "อนุชิต แซ่กุง 龔國平", username: "ops_staff", expect: "อนุชิต แซ่กุง", committee: OPS, position: "ผู้รับผิดชอบการแข่งขัน" },
  { name: "จรัญ แซ่จัง 張金學", newUsername: "ops_comp_vice", role: "Task Owner", committee: OPS, position: "รองผู้รับผิดชอบการแข่งขัน" },
  { name: "เจริญ มณิชุติพน 方正雲", username: "gov_lead", expect: "เจริญ มณีชุติพน", committee: GOV, position: "ฝ่ายธุรการ" },
  { name: "ประยงค์ แซ่ฝู่ 胡安富", username: "mis_lead", expect: "ประยูร แซ่ฝู", committee: GOV, position: "การบัญชีและการเงิน" },
  { name: "อนุพงษ์ เฉริมพลเกษม 李永光", newUsername: "ops_venue", role: "Task Owner", committee: OPS, position: "ผู้จัดการสถานที่หรือผู้ดูแลสถานที่" },
  { name: "ชัยนัน แสงหวั่ง 黃開生", newUsername: "ops_venue_vice", role: "Task Owner", committee: OPS, position: "รองผู้จัดการสถานที่หรือผู้ดูแลสถานที่" }
  // "ผู้อำนวยการ สมบูรณ์ ศิรันดร์กุล" ซ้ำในรายชื่อต้นฉบับ — นำเข้าครั้งเดียว
];
const BOARD_OWNER = PEOPLE[0]; // ประธานฝ่ายจีน แสดงเป็นหัวคณะกรรมการ 329

// ---------- helpers ----------
const LEADING = new Set(["เ", "แ", "โ", "ใ", "ไ"]);
const LOW_AFTER_HO = new Set(["ง", "ญ", "น", "ม", "ย", "ร", "ล", "ว"]);
function wordInitial(word) {
  let w = word.replace(/^(แซ่|แช่)(?=\S)/, "") || word;
  let i = 0;
  while (i < w.length && LEADING.has(w[i])) i++;
  if (w[i] === "ห" && LOW_AFTER_HO.has(w[i + 1] || "")) i++;
  return w[i] || "";
}
function nameInitials(full) {
  const words = full.trim().split(/\s+/).filter((w) => /[฀-๿a-zA-Z]/.test(w));
  const s = words.slice(0, 2).map((w) => (/^[฀-๿]/.test(w) ? wordInitial(w) : w[0].toUpperCase())).join("");
  return s || full.trim().slice(0, 2);
}
// เทียบชื่อแบบหลวม: ตัดชื่อจีน/ช่องว่าง/วรรณยุกต์/การันต์, ี=ิ ู=ุ, แช่=แซ่
function looseName(s) {
  return s
    .replace(/[^฀-๿]/g, "")
    .replace(/แช่/g, "แซ่")
    .replace(/[่-์]/g, "")
    .replace(/ี/g, "ิ")
    .replace(/ู/g, "ุ");
}
function randomPassword() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(12), (b) => abc[b % abc.length]).join("");
}

const prisma = new PrismaClient();
const out = [];
const say = (s) => out.push(s);

async function main() {
  const known = await prisma.committee.findMany({
    where: { deleted_at: null, name: { in: [OPS, GOV] } },
    select: { project_id: true }
  });
  const projectIds = [...new Set(known.map((c) => c.project_id))];
  if (projectIds.length !== 1) throw new Error(`ต้องเจอโครงการเดียวที่มีคณะ "${OPS}" และ "${GOV}" (เจอ ${projectIds.length})`);
  const projectId = projectIds[0];

  const roles = new Map((await prisma.role.findMany()).map((r) => [r.name, r]));
  const org = await prisma.organization.findFirst({ where: { deleted_at: null }, orderBy: { created_at: "asc" } });
  const actor = await prisma.user.findFirst({ where: { username: "admin", deleted_at: null }, select: { id: true } });
  const allUsers = await prisma.user.findMany({ where: { deleted_at: null }, select: { id: true, username: true, name: true } });
  const created = [];

  const run = async (tx) => {
    // 1) คณะกรรมการ 329
    let board = await tx.committee.findFirst({ where: { project_id: projectId, name: BOARD_NAME, deleted_at: null } });
    if (!board) {
      say(`+ สร้างคณะ "${BOARD_NAME}"`);
      if (APPLY) {
        board = await tx.committee.create({
          data: {
            project_id: projectId,
            name: BOARD_NAME,
            owner_name: BOARD_OWNER.name,
            owner_initials: nameInitials(BOARD_OWNER.name),
            sort_order: 0,
            risk_level: "Low",
            created_by: actor?.id ?? null
          }
        });
      }
    } else {
      say(`= คณะ "${BOARD_NAME}" มีอยู่แล้ว`);
    }
    const committees = new Map(
      (await tx.committee.findMany({ where: { project_id: projectId, deleted_at: null } })).map((c) => [c.name, c])
    );
    if (board) committees.set(BOARD_NAME, board);

    // 2) คน
    say("");
    for (const p of PEOPLE) {
      let user = null;
      let how = "";
      if (p.username) {
        user = allUsers.find((u) => u.username === p.username) || null;
        if (!user) throw new Error(`ไม่พบผู้ใช้ ${p.username} ที่ระบุว่าเป็นคนเดียวกับ ${p.name}`);
        // กันเปลี่ยนชื่อผิดคน: บัญชีต้องเป็นของคนที่คาดไว้ (หรือถูกนำเข้าไปแล้วเป็นชื่อใหม่)
        const current = looseName(user.name);
        if (current !== looseName(p.expect) && current !== looseName(p.name)) {
          throw new Error(`บัญชี ${p.username} ตอนนี้ชื่อ "${user.name}" ไม่ใช่ "${p.expect}" ตามที่คาดไว้ — หยุดเพื่อไม่ให้เปลี่ยนชื่อผิดคน`);
        }
        how = `บัญชีเดิม ${user.username}`;
      } else {
        user =
          allUsers.find((u) => u.username === p.newUsername) ||
          allUsers.find((u) => looseName(u.name) === looseName(p.name)) ||
          null;
        if (user) how = `พบอยู่แล้ว ${user.username} (ไม่สร้างซ้ำ)`;
      }

      if (user) {
        say(`* ${p.position}: ${p.name} — ${how}`);
        if (user.name !== p.name) {
          say(`    ชื่อ: "${user.name}" -> "${p.name}"`);
          if (APPLY) {
            await tx.user.update({ where: { id: user.id }, data: { name: p.name } });
            await tx.risk.updateMany({ where: { owner_name: user.name }, data: { owner_name: p.name } });
            await tx.meetingActionItem.updateMany({ where: { owner_name: user.name }, data: { owner_name: p.name } });
          }
        }
      } else {
        const role = roles.get(p.role);
        if (!role) throw new Error(`ไม่พบบทบาท ${p.role}`);
        const password = randomPassword();
        say(`+ ${p.position}: ${p.name} — สร้างผู้ใช้ใหม่ ${p.newUsername} (${p.role})`);
        if (APPLY) {
          user = await tx.user.create({
            data: {
              name: p.name,
              username: p.newUsername,
              password_hash: await bcrypt.hash(password, 10),
              roles: { create: [{ role_id: role.id }] }
            },
            select: { id: true, username: true, name: true }
          });
          if (org) {
            await tx.organizationMember.upsert({
              where: { organization_id_user_id: { organization_id: org.id, user_id: user.id } },
              create: { organization_id: org.id, user_id: user.id },
              update: {}
            });
          }
          created.push({ username: p.newUsername, name: p.name, password });
        }
      }

      // สมาชิกคณะ
      const committee = committees.get(p.committee);
      if (!committee) {
        say(`    + จะเพิ่มเข้าคณะ "${p.committee}" ตำแหน่ง "${p.position}" (หลังสร้างคณะ)`);
        continue;
      }
      if (!user) {
        say(`    + เพิ่มเข้าคณะ "${p.committee}" ตำแหน่ง "${p.position}"`);
        continue;
      }
      const link = await tx.committeeMember.findFirst({ where: { committee_id: committee.id, user_id: user.id } });
      if (!link) {
        say(`    + เพิ่มเข้าคณะ "${p.committee}" ตำแหน่ง "${p.position}"`);
        if (APPLY) await tx.committeeMember.create({ data: { committee_id: committee.id, user_id: user.id, position: p.position } });
      } else if (link.position.startsWith("หัวหน้า")) {
        say(`    = อยู่ในคณะ "${p.committee}" แล้ว — คงตำแหน่งหัวหน้า "${link.position}"`);
      } else if (link.position !== p.position) {
        say(`    ~ ตำแหน่งใน "${p.committee}": "${link.position}" -> "${p.position}"`);
        if (APPLY) await tx.committeeMember.update({ where: { id: link.id }, data: { position: p.position } });
      } else {
        say(`    = อยู่ในคณะ "${p.committee}" ตำแหน่งนี้แล้ว`);
      }
    }

    // 3) sync ชื่อ + ตัวย่อหัวหน้าคณะ
    say("");
    const all = await tx.committee.findMany({
      where: { project_id: projectId, deleted_at: null },
      select: {
        id: true,
        name: true,
        owner_name: true,
        owner_initials: true,
        members: { where: { position: { startsWith: "หัวหน้า" } }, select: { user: { select: { name: true, deleted_at: true } } } }
      },
      orderBy: { sort_order: "asc" }
    });
    for (const c of all) {
      const head = c.name === BOARD_NAME ? BOARD_OWNER.name : c.members.find((m) => !m.user.deleted_at)?.user.name;
      if (!head) {
        say(`? ${c.name}: ไม่มีหัวหน้า — ไม่แตะ (${c.owner_name} / ${c.owner_initials})`);
        continue;
      }
      const initials = nameInitials(head);
      if (c.owner_name === head && c.owner_initials === initials) {
        say(`= ${c.name}: ${head} (${initials})`);
        continue;
      }
      say(`~ ${c.name}: ${c.owner_name} (${c.owner_initials}) -> ${head} (${initials})`);
      if (APPLY) await tx.committee.update({ where: { id: c.id }, data: { owner_name: head, owner_initials: initials } });
    }

    if (APPLY) {
      await tx.auditLog.create({
        data: {
          user_id: actor?.id ?? null,
          project_id: projectId,
          action: "Import committee 329",
          entity_type: "Committee",
          entity_id: board?.id ?? "",
          new_value: JSON.stringify({ people: PEOPLE.length, created: created.map((c) => c.username) })
        }
      });
    }
    if (TEST_ROLLBACK) throw new Error("__ROLLBACK__");
  };

  if (APPLY) {
    try {
      await prisma.$transaction(run, { timeout: 120000, maxWait: 20000 });
    } catch (e) {
      if (e.message !== "__ROLLBACK__") throw e;
      say("\n(TEST_ROLLBACK: ทุกอย่างถูกย้อนกลับ ไม่มีการบันทึก)");
      created.length = 0;
    }
  } else {
    await run(prisma);
  }

  if (APPLY && !TEST_ROLLBACK) {
    if (process.env.REDIS_URL) {
      const Redis = require("ioredis");
      const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      try {
        await redis.connect();
        const keys = [];
        let cursor = "0";
        do {
          const [next, batch] = await redis.scan(cursor, "MATCH", "mis:v1:project:*", "COUNT", 200);
          cursor = next;
          keys.push(...batch);
        } while (cursor !== "0");
        if (keys.length) await redis.del(...keys);
        say(`\nล้าง cache ${keys.length} คีย์`);
      } catch (e) {
        say(`\n(ล้าง cache ไม่สำเร็จ: ${e.message} — ข้อมูลจะอัปเดตเมื่อ cache หมดอายุ)`);
      } finally {
        redis.disconnect();
      }
    }
  }

  console.log(out.join("\n"));
  if (created.length) {
    console.log("\n================ บัญชีใหม่ (รหัสผ่านแสดงครั้งเดียว — คัดลอกเก็บไว้แล้วแจ้งเจ้าของ) ================");
    for (const c of created) console.log(`${c.username}\t${c.password}\t${c.name}`);
  }
  console.log(APPLY ? (TEST_ROLLBACK ? "\nทดสอบเสร็จ (rollback)" : "\nบันทึกแล้ว") : "\n(ดูก่อนเท่านั้น — ยังไม่ได้บันทึก) ถ้าถูกต้อง รันซ้ำพร้อม --apply");
}

main()
  .catch((e) => {
    console.log(out.join("\n"));
    console.error("\n!! ผิดพลาด ไม่ได้บันทึกอะไร:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
