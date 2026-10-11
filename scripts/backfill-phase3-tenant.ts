/**
 * Backfill Organization + organization_id สำหรับ DB ที่มี Project อยู่แล้ว (ก่อน seed)
 * รัน: npx tsx scripts/backfill-phase3-tenant.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORG_SLUG = "yunnan-329";
const ORG_NAME = "มูลนิธิกีฬา 329 ชาวจีนยูนาน";

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    create: { slug: ORG_SLUG, name: ORG_NAME },
    update: { name: ORG_NAME }
  });

  // script นี้ไว้สำหรับ DB ยุคก่อน multi-tenant (มีองค์กรเดียว) — ถ้ามีองค์กรอื่นอยู่แล้ว
  // การย้ายทุกโปรเจกต์เข้า org นี้ = รวม tenant เข้าด้วยกัน จึงต้องยืนยันชัดเจน
  const otherOrgs = await prisma.organization.count({ where: { id: { not: org.id }, deleted_at: null } });
  if (otherOrgs > 0 && process.env.BACKFILL_CONFIRM !== "MERGE_ALL_ORGS") {
    throw new Error(
      `ยกเลิก: มีองค์กรอื่นอยู่แล้ว ${otherOrgs} องค์กร — script นี้จะย้ายทุกโปรเจกต์เข้า ${ORG_SLUG} ` +
        "ถ้าตั้งใจจริงให้ตั้ง BACKFILL_CONFIRM=MERGE_ALL_ORGS"
    );
  }

  const toMove = await prisma.project.findMany({
    where: { organization_id: { not: org.id } },
    select: { id: true, slug: true }
  });
  // คง slug เดิมไว้ — เดิมตั้ง "edition-legacy" ให้ทุกโปรเจกต์ ซึ่งชน @@unique([organization_id, slug])
  for (const project of toMove) {
    await prisma.project.update({
      where: { id: project.id },
      data: { organization_id: org.id, slug: project.slug ?? `edition-legacy-${project.id.slice(-6)}` }
    });
  }
  const updated = { count: toMove.length };

  const users = await prisma.user.findMany({ where: { deleted_at: null }, select: { id: true } });
  if (users.length) {
    await prisma.organizationMember.createMany({
      data: users.map((user) => ({ organization_id: org.id, user_id: user.id })),
      skipDuplicates: true
    });
  }

  const demoExists = await prisma.project.findFirst({
    where: { organization_id: org.id, slug: "edition-2571-demo" }
  });
  if (!demoExists) {
    await prisma.project.create({
      data: {
        organization_id: org.id,
        slug: "edition-2571-demo",
        name: "กีฬา 329 (รอบซ้อม)",
        edition: "รอบซ้อม 29 มี.ค. – 5 เม.ย. 2571 (ตัวอย่าง)",
        description: "โปรเจกต์ตัวอย่างสำหรับทดสอบสลับหลายรอบจัดงาน",
        event_date: new Date("2028-03-29"),
        event_end_date: new Date("2028-04-05"),
        planned_budget: 0
      }
    });
    console.log("Created demo project edition-2571-demo");
  }

  console.log(`Organization: ${org.slug} (${org.id})`);
  console.log(`Projects linked: ${updated.count}`);
  console.log(`Org members ensured for ${users.length} users`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
