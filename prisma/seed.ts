import { PrismaClient, Priority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { committeeUserSeeds, DEFAULT_MEMBER_PASSWORD } from "./user-seeds";
import { computeRisk, evidenceProgress, weightedProgress } from "../src/lib/rules";
import { EVENT_329, addDays, scheduleTaskWindow } from "../src/lib/event-calendar";

const prisma = new PrismaClient();

type SeedPriority = "P0" | "P1" | "P2" | "P3";

type TaskSeed = {
  code: string;
  title: string;
  priority: SeedPriority;
  plan: string;
  subtasks: string[];
  outputs: string[];
  budget?: number;
  risk?: "Low" | "Medium" | "High" | "Critical";
  /** ช่วงเวลาของงาน: pre = ก่อนวันงาน (ค่าเริ่มต้น), event = ระหว่างวันแข่งขัน, post = หลังจบงาน */
  phase?: "pre" | "event" | "post";
};

const priorityMap: Record<SeedPriority, Priority> = {
  P0: "CRITICAL",
  P1: "HIGH",
  P2: "MEDIUM",
  P3: "LOW"
};

// ยุบ 14 คณะเดิมเป็น 4 กลุ่มงานหลัก — 1 หัวหน้าต่อกลุ่ม รวมงานประเภทเดียวกันไว้ด้วยกัน
// งบรวม = ผลรวมงบของคณะเดิมที่ยุบเข้ามา (รวมทั้งโครงการเท่าเดิม 3,660,000)
const committeeSeeds = [
  // ภาพรวม (180k) + คณะกรรมการ (120k) + งบประมาณ (240k)
  { name: "อำนวยการและการเงิน", ownerLabel: "ฝ่ายอำนวยการ", initials: "อก", budget: 540000, risk: "High", weight: 2 },
  // กีฬา (580k) + สถานที่ (520k) + ความปลอดภัย/แพทย์ (220k)
  { name: "กีฬา สถานที่ และความปลอดภัย", ownerLabel: "ฝ่ายกีฬาและสนาม", initials: "กฬ", budget: 1320000, risk: "High", weight: 2 },
  // พิธีการ (320k) + อาหาร/สวัสดิการ (340k) + ประชาสัมพันธ์ (260k) + ทะเบียน/ต้อนรับ (150k)
  { name: "พิธีการ สวัสดิการ และประชาสัมพันธ์", ownerLabel: "ฝ่ายพิธีการและสวัสดิการ", initials: "พธ", budget: 1070000, risk: "Medium", weight: 2 },
  // เอกสาร/MIS (170k) + Timeline/ความเสี่ยง (170k) + ปฏิบัติการวันงาน (260k) + สรุปผล (130k)
  { name: "เอกสารและติดตามงาน", ownerLabel: "ฝ่ายติดตามงานและ MIS", initials: "ตม", budget: 730000, risk: "High", weight: 1 }
] as const;

const taskSeeds: TaskSeed[] = [
  {
    code: "P0-01",
    title: "กำหนดขอบเขตการจัดงาน",
    priority: "P0",
    plan: "อำนวยการและการเงิน",
    subtasks: ["กำหนดชื่องานอย่างเป็นทางการ", "กำหนดวัตถุประสงค์ของงาน", "กำหนดวัน เวลา และสถานที่", "กำหนดจำนวนหมู่บ้าน/ชุมชน/ทีมที่คาดว่าจะเข้าร่วม", "กำหนดรูปแบบงาน: กีฬา + พิธีการ + วัฒนธรรม + มิตรภาพชุมชน", "จัดทำเอกสาร Concept Note โครงการ"],
    outputs: ["เอกสารสรุปโครงการ", "ไฟล์ PDF/Word ขอบเขตงาน", "มติที่ประชุมรับรอง"],
    risk: "Critical"
  },
  {
    code: "P0-02",
    title: "จัดโครงสร้างคณะกรรมการ",
    priority: "P0",
    plan: "อำนวยการและการเงิน",
    subtasks: ["กำหนดคณะกรรมการอำนวยการ", "ตั้งกลุ่มอำนวยการและการเงิน (ภาพรวม + คณะกรรมการ + งบประมาณ)", "ตั้งกลุ่มกีฬา สถานที่ และความปลอดภัย (กีฬา + สนาม + ความปลอดภัย/แพทย์)", "ตั้งกลุ่มพิธีการ สวัสดิการ และประชาสัมพันธ์ (พิธีการ + อาหาร + PR + ทะเบียน)", "ตั้งกลุ่มเอกสารและติดตามงาน (เอกสาร/MIS + Timeline/ความเสี่ยง + ปฏิบัติการวันงาน + สรุปผล)", "แต่งตั้งหัวหน้ากลุ่ม 1 คนต่อกลุ่ม"],
    outputs: ["คำสั่งแต่งตั้งคณะกรรมการ", "รายชื่อคณะกรรมการ", "โครงสร้างฝ่ายงาน"],
    risk: "Critical"
  },
  {
    code: "P0-03",
    title: "กำหนดบทบาทหน้าที่แต่ละฝ่าย",
    priority: "P0",
    plan: "อำนวยการและการเงิน",
    subtasks: ["ระบุหัวหน้าฝ่าย", "ระบุผู้ช่วย/ทีมงาน", "ระบุขอบเขตหน้าที่", "ระบุงานที่ต้องส่งมอบ", "ระบุวันครบกำหนดของแต่ละฝ่าย", "ระบุช่องทางรายงานความคืบหน้า", "นำข้อมูลเข้าระบบ MIS"],
    outputs: ["ตารางบทบาทหน้าที่", "RACI Matrix", "รายชื่อผู้รับผิดชอบในระบบ"],
    risk: "High"
  },
  {
    code: "P0-04",
    title: "จัดทำงบประมาณรวมทั้งโครงการ",
    priority: "P0",
    plan: "อำนวยการและการเงิน",
    subtasks: ["ประมาณการค่าใช้จ่ายด้านสนาม/สถานที่", "ประมาณการค่าอาหารและน้ำดื่ม", "ประมาณการค่ารางวัล/ถ้วย/เหรียญ", "ประมาณการค่าเครื่องเสียง/เวที/เต็นท์", "ประมาณการค่าป้าย/ประชาสัมพันธ์", "ประมาณการค่าปฐมพยาบาลและความปลอดภัย", "ประมาณการค่าเอกสาร/วัสดุสำนักงาน", "กำหนดเงินสำรองฉุกเฉินอย่างน้อย 10-15%"],
    outputs: ["ตารางงบประมาณรวม", "รายการงบประมาณแยกตามฝ่าย", "เอกสารอนุมัติงบ"],
    // ไม่ตั้ง budget: งานนี้คือ "ยอดรวมทั้งโครงการ" ไม่ใช่รายการค่าใช้จ่ายเดี่ยว —
    // ถ้าตั้งจะถูกสร้างเป็น BudgetItem แล้ว rollupBudgetTotals จะรวมยอดคณะพองเกินจริง
    risk: "Critical"
  },
  {
    code: "P0-05",
    title: "กำหนดแหล่งงบประมาณ",
    priority: "P0",
    plan: "อำนวยการและการเงิน",
    subtasks: ["สำรวจงบจากชุมชน/สมาคม/มูลนิธิ", "สำรวจงบสนับสนุนจาก อปท.", "สำรวจผู้สนับสนุนภาคเอกชน", "กำหนดรูปแบบการรับบริจาค/สนับสนุน", "จัดทำทะเบียนผู้สนับสนุน", "กำหนดวิธีออกใบรับ/หลักฐาน"],
    outputs: ["ทะเบียนแหล่งงบประมาณ", "หนังสือขอสนับสนุน", "หลักฐานการรับงบ"],
    budget: 0,
    risk: "High"
  },
  {
    code: "P0-06",
    title: "ตรวจสอบพื้นที่จัดการแข่งขัน",
    priority: "P0",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["สำรวจสนามฟุตบอล", "สำรวจสนามวอลเลย์บอล", "สำรวจสนามตะกร้อ", "สำรวจพื้นที่กีฬาอื่น ๆ", "ตรวจสภาพพื้นสนาม", "ตรวจความปลอดภัยของพื้นที่", "ตรวจจุดเสี่ยง เช่น หลุม พื้นลื่น สายไฟ ทางลาด", "ถ่ายภาพก่อนปรับปรุง"],
    outputs: ["ภาพถ่ายสนาม", "แบบฟอร์มตรวจสภาพสนาม", "แผนผังพื้นที่แข่งขัน"],
    budget: 80000,
    risk: "Critical"
  },
  {
    code: "P0-07",
    title: "กำหนดผังพื้นที่จัดงาน",
    priority: "P0",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["กำหนดจุดพิธีเปิด", "กำหนดจุดลงทะเบียน", "กำหนดจุดพักนักกีฬา", "กำหนดจุดอาหารและน้ำดื่ม", "กำหนดจุดปฐมพยาบาล", "กำหนดจุดจอดรถ", "กำหนดทางเข้า-ออก", "กำหนดจุดห้องน้ำ", "กำหนดจุดทิ้งขยะ", "จัดทำแผนผังภาพรวม"],
    outputs: ["แผนผังสถานที่", "รูปภาพจุดต่าง ๆ", "แผนที่นำทาง"],
    budget: 30000,
    risk: "High"
  },
  {
    code: "P0-08",
    title: "จัดทำแผนความปลอดภัย",
    priority: "P0",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["ประเมินความเสี่ยงด้านคนจำนวนมาก", "ประเมินความเสี่ยงด้านการจราจร", "ประเมินความเสี่ยงด้านอุบัติเหตุจากกีฬา", "ประเมินความเสี่ยงด้านไฟฟ้า/เครื่องเสียง", "กำหนดจุดควบคุมความปลอดภัย", "ประสานตำรวจ/อปพร./ผู้นำชุมชน", "จัดทีมดูแลความเรียบร้อย"],
    outputs: ["แผนความปลอดภัย", "รายชื่อเจ้าหน้าที่ดูแลความปลอดภัย", "จุดเฝ้าระวังในแผนผัง"],
    budget: 60000,
    risk: "Critical"
  },
  {
    code: "P0-09",
    title: "จัดระบบปฐมพยาบาล",
    priority: "P0",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["ประสานโรงพยาบาลส่งเสริมสุขภาพตำบล", "จัดทีมปฐมพยาบาล", "เตรียมชุดปฐมพยาบาล", "เตรียมรถรับส่งฉุกเฉิน", "กำหนดจุดปฐมพยาบาล", "จัดทำเบอร์ฉุกเฉิน", "จัดทำแนวทางส่งต่อผู้บาดเจ็บ"],
    outputs: ["หนังสือประสานหน่วยแพทย์", "ภาพจุดปฐมพยาบาล", "รายการอุปกรณ์การแพทย์"],
    budget: 70000,
    risk: "Critical"
  },
  {
    code: "P1-01",
    title: "กำหนดประเภทกีฬา",
    priority: "P1",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["สำรวจประเภทกีฬาที่จะจัดแข่งขัน", "กำหนดกีฬาเยาวชน", "กำหนดกีฬาประชาชน", "กำหนดกีฬาผู้อาวุโส/เชื่อมสัมพันธ์", "กำหนดกีฬาพื้นบ้าน", "กำหนดจำนวนทีมต่อประเภท", "ตรวจสอบความพร้อมของสนามแต่ละกีฬา"],
    outputs: ["รายการประเภทกีฬา", "ตารางจำนวนทีม", "เอกสารรับรองประเภทกีฬา"],
    risk: "High"
  },
  {
    code: "P1-02",
    title: "จัดทำระเบียบการแข่งขัน",
    priority: "P1",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["กำหนดคุณสมบัตินักกีฬา", "กำหนดจำนวนผู้เล่น", "กำหนดรูปแบบการแข่งขัน", "กำหนดกติกาแต่ละประเภทกีฬา", "กำหนดเกณฑ์แพ้ชนะ", "กำหนดวิธีประท้วงผลการแข่งขัน", "กำหนดบทลงโทษกรณีผิดกติกา", "เผยแพร่ระเบียบให้ทีมทราบ"],
    outputs: ["ระเบียบการแข่งขัน", "เอกสารกติกา", "หลักฐานการแจ้งทีม"],
    risk: "High"
  },
  {
    code: "P1-03",
    title: "ระบบลงทะเบียนทีมและนักกีฬา",
    priority: "P1",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["จัดทำแบบฟอร์มลงทะเบียนทีม", "จัดทำแบบฟอร์มรายชื่อนักกีฬา", "ตรวจสอบรายชื่อซ้ำ", "ตรวจสอบคุณสมบัตินักกีฬา", "จัดทำรหัสทีม", "จัดทำทะเบียนนักกีฬา", "สรุปจำนวนทีมทั้งหมด", "นำข้อมูลเข้าระบบ MIS"],
    outputs: ["ไฟล์รายชื่อทีม", "ไฟล์รายชื่อนักกีฬา", "สรุปจำนวนผู้เข้าร่วม"],
    risk: "High"
  },
  {
    code: "P1-04",
    title: "จัดตารางการแข่งขัน",
    priority: "P1",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["จับสลากแบ่งสาย", "จัดตารางรอบแรก", "จัดตารางรอบรองชนะเลิศ", "จัดตารางรอบชิงชนะเลิศ", "ตรวจสอบไม่ให้เวลาชนกัน", "ตรวจสอบไม่ให้ทีมเดียวแข่งซ้อน", "จัดทำตารางแข่งขันฉบับประกาศ", "ประกาศตารางให้ทุกทีมทราบ"],
    outputs: ["ตารางแข่งขัน", "ภาพ/ไฟล์ประกาศ", "บันทึกการจับสลาก"],
    risk: "High"
  },
  {
    code: "P1-05",
    title: "จัดหากรรมการตัดสิน",
    priority: "P1",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["ระบุจำนวนกรรมการแต่ละกีฬา", "ประสานกรรมการตัดสิน", "กำหนดค่าตอบแทน/สวัสดิการ", "จัดประชุมชี้แจงกติกา", "จัดตารางเวรกรรมการ", "เตรียมอุปกรณ์กรรมการ เช่น นกหวีด ใบคะแนน ปากกา", "จัดจุดพักกรรมการ"],
    outputs: ["รายชื่อกรรมการ", "ตารางกรรมการ", "ภาพประชุมกรรมการ"],
    budget: 120000,
    risk: "Medium"
  },
  {
    code: "P1-06",
    title: "ออกแบบพิธีเปิด",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["กำหนดประธานในพิธี", "จัดทำลำดับพิธีเปิด", "เตรียมคำกล่าวรายงาน", "เตรียมคำกล่าวเปิดงาน", "กำหนดขบวนพาเหรด/ขบวนนักกีฬา", "เตรียมธง/ป้ายทีม", "เตรียมเพลง/สัญญาณพิธี", "ซักซ้อมพิธีเปิด"],
    outputs: ["Script พิธีเปิด", "กำหนดการพิธีเปิด", "ภาพซ้อมพิธี"],
    budget: 65000,
    risk: "Medium"
  },
  {
    code: "P1-07",
    title: "ออกแบบพิธีปิดและมอบรางวัล",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["กำหนดลำดับพิธีปิด", "เตรียมรายชื่อผู้รับรางวัล", "เตรียมถ้วย/เหรียญ/เกียรติบัตร", "กำหนดผู้มอบรางวัล", "เตรียมจุดถ่ายภาพ", "เตรียมเพลง/ประกาศ", "จัดทีมดูแลรางวัล", "สรุปผลการแข่งขันก่อนพิธีปิด"],
    outputs: ["กำหนดการพิธีปิด", "รายการรางวัล", "ภาพถ้วย/เหรียญ/เกียรติบัตร"],
    budget: 140000,
    risk: "Medium"
  },
  {
    code: "P1-08",
    title: "การแสดงวัฒนธรรม",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["กำหนดชุดการแสดง", "ประสานผู้แสดง", "จัดลำดับการแสดง", "เตรียมชุด/อุปกรณ์", "เตรียมเพลงประกอบ", "ซ้อมการแสดง", "จัดพื้นที่รอการแสดง", "ถ่ายภาพ/วิดีโอเพื่อเก็บหลักฐาน"],
    outputs: ["รายการแสดง", "ภาพซ้อม", "คลิปการแสดง"],
    budget: 90000,
    risk: "Medium"
  },
  {
    code: "P1-09",
    title: "วางแผนอาหาร",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["ประมาณจำนวนผู้ร่วมงาน", "แยกกลุ่มนักกีฬา กรรมการ แขก คณะทำงาน", "กำหนดจำนวนมื้ออาหาร", "กำหนดเมนูอาหาร", "ตรวจข้อจำกัดด้านอาหาร เช่น อาหารฮาลาล/มังสวิรัติ/เด็ก", "ประสานแม่ครัว/ร้านอาหาร", "กำหนดจุดรับอาหาร", "เตรียมคูปองหรือระบบควบคุมการรับอาหาร"],
    outputs: ["แผนอาหาร", "รายการเมนู", "งบประมาณอาหาร"],
    budget: 260000,
    risk: "High"
  },
  {
    code: "P1-10",
    title: "จัดเตรียมน้ำดื่ม",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["ประมาณจำนวนขวด/ถังน้ำ", "กำหนดจุดบริการน้ำดื่ม", "จัดแก้ว/น้ำแข็ง", "จัดทีมเติมน้ำ", "จัดถังขยะใกล้จุดน้ำ", "สำรองน้ำฉุกเฉิน", "ตรวจคุณภาพภาชนะและความสะอาด"],
    outputs: ["ตารางจุดบริการน้ำ", "ภาพจุดน้ำดื่ม", "รายการจัดซื้อ"],
    budget: 80000,
    risk: "Medium"
  },
  {
    code: "P1-11",
    title: "จัดทำแผนประชาสัมพันธ์",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["กำหนดช่องทางประชาสัมพันธ์", "สร้างโพสต์ประชาสัมพันธ์", "จัดทำป้ายไวนิล", "จัดทำหนังสือเชิญ", "ประชาสัมพันธ์ผ่านเพจ/กลุ่มไลน์", "ประชาสัมพันธ์ผ่านผู้นำชุมชน", "แจ้งกำหนดการให้ทีมเข้าร่วม"],
    outputs: ["ไฟล์ภาพประชาสัมพันธ์", "ลิงก์โพสต์", "หนังสือเชิญ"],
    budget: 90000,
    risk: "Medium"
  },
  {
    code: "P1-12",
    title: "ระบบสื่อสารภายในคณะทำงาน",
    priority: "P1",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["สร้างกลุ่มสื่อสารหลัก", "สร้างกลุ่มหัวหน้าฝ่าย", "กำหนดรูปแบบการรายงานประจำวัน", "กำหนดผู้รวบรวมข้อมูล", "กำหนดเวลาอัปเดตงาน", "เชื่อมข้อมูลเข้าสู่ระบบ MIS", "สรุปประเด็นเร่งด่วนทุกวัน"],
    outputs: ["รายชื่อกลุ่มสื่อสาร", "Screenshot การแจ้งงาน", "รายงานความคืบหน้า"],
    risk: "High"
  },
  {
    code: "P2-01",
    title: "เตรียมเต็นท์ โต๊ะ เก้าอี้",
    priority: "P2",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["สำรวจจำนวนเต็นท์ที่ต้องใช้", "สำรวจจำนวนโต๊ะ", "สำรวจจำนวนเก้าอี้", "กำหนดจุดตั้งเต็นท์", "จัดทำแผนผังเต็นท์", "ประสานผู้ให้ยืม/เช่า", "ตรวจสภาพก่อนใช้งาน", "จัดทีมติดตั้งและรื้อถอน"],
    outputs: ["แผนผังเต็นท์", "ภาพติดตั้ง", "รายการอุปกรณ์"],
    budget: 150000,
    risk: "Medium"
  },
  {
    code: "P2-02",
    title: "ระบบไฟฟ้าและเครื่องเสียง",
    priority: "P2",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["สำรวจจุดใช้ไฟ", "เตรียมสายไฟ/ปลั๊กพ่วง", "ตรวจความปลอดภัยไฟฟ้า", "ติดตั้งเครื่องเสียง", "ทดสอบไมโครโฟน", "ทดสอบลำโพง", "เตรียมเครื่องสำรองไฟถ้าจำเป็น", "จัดผู้ดูแลระบบเสียงตลอดงาน"],
    outputs: ["ภาพติดตั้งเครื่องเสียง", "Checklist ทดสอบเสียง", "รายชื่อผู้ดูแล"],
    budget: 180000,
    risk: "High"
  },
  {
    code: "P2-04",
    title: "จัดจุดลงทะเบียน",
    priority: "P2",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["กำหนดจุดลงทะเบียน", "จัดโต๊ะลงทะเบียน", "แยกช่องลงทะเบียนตามทีม/หมู่บ้าน", "เตรียมรายชื่อผู้เข้าร่วม", "เตรียมป้ายชื่อ/บัตรทีม", "จัดทีมเจ้าหน้าที่ลงทะเบียน", "เตรียม QR Code ถ้ามีระบบดิจิทัล", "เตรียมสมุดลงชื่อสำรอง"],
    outputs: ["รายชื่อผู้ลงทะเบียน", "ภาพจุดลงทะเบียน", "รายงานจำนวนผู้เข้าร่วม"],
    budget: 45000,
    risk: "Medium"
  },
  {
    code: "P2-06",
    title: "จัดหาอุปกรณ์กีฬา",
    priority: "P2",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    subtasks: ["สำรวจอุปกรณ์แต่ละกีฬา", "ตรวจลูกฟุตบอล/วอลเลย์บอล/ตะกร้อ", "ตรวจตาข่าย/เสา/ประตู", "จัดซื้ออุปกรณ์ที่ขาด", "ติดป้าย/ลงทะเบียนอุปกรณ์", "จัดผู้ดูแลอุปกรณ์", "จัดระบบยืม-คืนอุปกรณ์"],
    outputs: ["รายการอุปกรณ์กีฬา", "ภาพอุปกรณ์", "ใบเสร็จจัดซื้อ"],
    budget: 160000,
    risk: "Medium"
  },
  {
    code: "P2-07",
    title: "จัดเตรียมรางวัล",
    priority: "P2",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    subtasks: ["กำหนดประเภทรางวัล", "จัดซื้อถ้วยรางวัล", "จัดซื้อเหรียญรางวัล", "จัดทำเกียรติบัตร", "ตรวจชื่อรางวัลให้ถูกต้อง", "จัดเรียงรางวัลตามลำดับพิธี", "จัดผู้รับผิดชอบโต๊ะรางวัล", "ถ่ายภาพหลักฐานรางวัล"],
    outputs: ["รายการรางวัล", "ภาพถ้วย/เหรียญ", "ไฟล์เกียรติบัตร"],
    budget: 180000,
    risk: "Medium"
  },
  {
    code: "P2-09",
    title: "บันทึกข้อมูลในระบบ MIS",
    priority: "P2",
    plan: "เอกสารและติดตามงาน",
    subtasks: ["สร้าง Project", "สร้าง Plan 12 หมวด", "สร้าง Task ตามฝ่าย", "สร้าง Subtask รายละเอียด", "ระบุผู้รับผิดชอบ", "ระบุวันครบกำหนด", "ระบุงบประมาณ", "แนบเอกสารที่เกี่ยวข้อง", "เปิด Dashboard สำหรับผู้บริหาร"],
    outputs: ["Screenshot Dashboard", "ข้อมูล Task/Subtask ในระบบ", "รายงานความคืบหน้า"],
    risk: "High"
  },
  {
    code: "P1-13",
    title: "จัดทำ Timeline หลัก",
    priority: "P1",
    plan: "เอกสารและติดตามงาน",
    subtasks: ["กำหนด Milestone 45 วันก่อนงาน", "กำหนด Milestone 30 วันก่อนงาน", "กำหนด Milestone 15 วันก่อนงาน", "กำหนด Milestone 7 วันก่อนงาน", "กำหนด Milestone 1 วันก่อนงาน", "กำหนด Timeline วันงานจริง", "กำหนดงานหลังจบงาน", "นำ Timeline เข้าระบบ Gantt"],
    outputs: ["Gantt Chart", "Timeline PDF", "Dashboard Timeline"],
    risk: "High"
  },
  {
    code: "P1-14",
    title: "ติดตามงานล่าช้า",
    priority: "P1",
    plan: "เอกสารและติดตามงาน",
    subtasks: ["ตรวจงานที่เลยกำหนด", "ตรวจงานที่ไม่มีผู้รับผิดชอบ", "ตรวจงานที่ไม่มีหลักฐาน", "ตรวจงานที่งบยังไม่อนุมัติ", "แจ้งเตือนหัวหน้าฝ่าย", "สรุปรายงานงานล่าช้าทุก 3 วัน", "เสนอประเด็นต่อที่ประชุม"],
    outputs: ["รายงาน Delayed Tasks", "Screenshot Dashboard", "บันทึกการแจ้งเตือน"],
    risk: "High"
  },
  {
    code: "P1-15",
    title: "วิเคราะห์ความเสี่ยงหลัก",
    priority: "P1",
    plan: "เอกสารและติดตามงาน",
    subtasks: ["ความเสี่ยงฝนตก", "ความเสี่ยงคนเข้าร่วมมากเกินคาด", "ความเสี่ยงอาหารไม่เพียงพอ", "ความเสี่ยงอุบัติเหตุจากกีฬา", "ความเสี่ยงไฟฟ้า/เครื่องเสียงขัดข้อง", "ความเสี่ยงตารางแข่งขันล่าช้า", "ความเสี่ยงงบประมาณไม่พอ", "ความเสี่ยงความขัดแย้งระหว่างทีม", "ความเสี่ยงรถติด/ที่จอดรถไม่พอ", "ความเสี่ยงเอกสาร/รายชื่อผิดพลาด"],
    outputs: ["Risk Register", "Risk Matrix", "แผนป้องกันและแผนสำรอง"],
    risk: "Critical"
  },
  {
    code: "P1-16",
    title: "แผนสำรองเหตุฉุกเฉิน",
    priority: "P1",
    plan: "เอกสารและติดตามงาน",
    subtasks: ["แผนสำรองกรณีฝนตก", "แผนสำรองกรณีสนามใช้ไม่ได้", "แผนสำรองกรณีไฟฟ้าดับ", "แผนสำรองกรณีผู้บาดเจ็บ", "แผนสำรองกรณีอาหารไม่พอ", "แผนสำรองกรณีแขกมาช้าหรือเปลี่ยนประธาน", "แผนสำรองกรณีตารางแข่งขันล่าช้า"],
    outputs: ["Contingency Plan", "รายชื่อผู้รับผิดชอบเหตุฉุกเฉิน", "เบอร์โทรสำคัญ"],
    risk: "Critical"
  },
  {
    code: "P2-10",
    title: "เปิดศูนย์ประสานงานกลาง",
    priority: "P2",
    plan: "เอกสารและติดตามงาน",
    phase: "event",
    subtasks: ["ตั้งโต๊ะศูนย์อำนวยการ", "ติดตั้งป้ายศูนย์ประสานงาน", "จัดเจ้าหน้าที่ประจำศูนย์", "เตรียมรายชื่อผู้ประสานงานทุกฝ่าย", "เตรียมเอกสารสำคัญ", "เตรียมวิทยุ/โทรศัพท์/กลุ่มไลน์", "เปิด Dashboard ติดตามงาน"],
    outputs: ["ภาพศูนย์ประสานงาน", "รายชื่อเวรประจำศูนย์", "รายงานสถานการณ์วันงาน"],
    budget: 50000,
    risk: "Medium"
  },
  {
    code: "P2-11",
    title: "ควบคุมพิธีเปิด",
    priority: "P2",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    phase: "event",
    subtasks: ["ตรวจความพร้อมเวที", "ตรวจความพร้อมเครื่องเสียง", "ตรวจขบวนพาเหรด", "ตรวจรายชื่อแขก", "ตรวจคำกล่าว", "ตรวจผู้ดำเนินรายการ", "เริ่มพิธีตามกำหนด", "บันทึกภาพ/วิดีโอ"],
    outputs: ["ภาพพิธีเปิด", "คลิปวิดีโอ", "รายงานปัญหา/ข้อสังเกต"],
    risk: "Medium"
  },
  {
    code: "P2-12",
    title: "ควบคุมการแข่งขัน",
    priority: "P2",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    phase: "event",
    subtasks: ["เปิดสนามแข่งขันตามตาราง", "เช็กชื่อทีมก่อนแข่งขัน", "เช็กกรรมการประจำสนาม", "บันทึกผลการแข่งขัน", "รายงานผลเข้าส่วนกลาง", "แก้ปัญหาตารางล่าช้า", "สรุปทีมเข้ารอบ", "ส่งผลให้ฝ่ายพิธีการเตรียมรางวัล"],
    outputs: ["ผลการแข่งขัน", "ภาพการแข่งขัน", "รายงานทีมชนะ"],
    risk: "High"
  },
  {
    code: "P2-13",
    title: "ดูแลอาหารและน้ำดื่มวันงาน",
    priority: "P2",
    plan: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    phase: "event",
    subtasks: ["ตรวจอาหารก่อนแจก", "แจกอาหารตามรอบ", "เติมน้ำดื่มตามจุด", "ตรวจความสะอาดจุดอาหาร", "แก้ปัญหาอาหารไม่พอ", "เก็บขยะหลังแจกอาหาร", "สรุปจำนวนอาหารที่ใช้จริง"],
    outputs: ["ภาพจุดอาหาร", "รายงานจำนวนอาหาร", "รายงานปัญหาหน้างาน"],
    risk: "High"
  },
  {
    code: "P2-14",
    title: "ควบคุมความปลอดภัยวันงาน",
    priority: "P2",
    plan: "กีฬา สถานที่ และความปลอดภัย",
    phase: "event",
    subtasks: ["จัดเวรดูแลจราจร", "จัดเวรดูแลสนาม", "ตรวจจุดเสี่ยง", "ดูแลเด็กและผู้สูงอายุ", "ประสานกรณีอุบัติเหตุ", "รายงานเหตุการณ์ผิดปกติ", "ปิดเหตุการณ์และสรุปผล"],
    outputs: ["รายงานเหตุการณ์", "ภาพจุดควบคุม", "บันทึกการปฐมพยาบาล"],
    risk: "Critical"
  }
];

function progressFor(index: number, priority: SeedPriority) {
  if (priority === "P3") return 0;
  if (priority === "P0") return [35, 45, 55, 65, 75][index % 5];
  if (priority === "P1") return [15, 25, 35, 45, 55][index % 5];
  return [0, 10, 20, 30, 40][index % 5];
}

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.reportGenerationJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.powerPointReport.deleteMany();
  await prisma.dashboardSnapshot.deleteMany();
  await prisma.meetingActionItem.deleteMany();
  await prisma.meetingAgenda.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.budgetTransaction.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  const roleNames = ["Super Admin", "Project Director", "Project Secretary", "Committee Lead", "Data Recorder", "Task Owner", "Finance Officer", "Evidence Reviewer", "Viewer"];
  const roles = await Promise.all(roleNames.map((name) => prisma.role.create({ data: { name, label: name } })));
  const roleByName = new Map(roles.map((role) => [role.name, role]));
  const director = await prisma.user.create({
    data: {
      name: "ประธานจัดงาน กีฬา 329 ชาวจีนยูนาน",
      username: "director",
      password_hash: await bcrypt.hash(process.env.SEED_DIRECTOR_PASSWORD ?? "password123", 10),
      roles: { create: [{ role_id: roleByName.get("Project Director")!.id }, { role_id: roleByName.get("Project Secretary")!.id }] }
    }
  });
  const admin = await prisma.user.create({
    data: {
      name: "ผู้ดูแลระบบ MIS 329",
      username: "admin",
      password_hash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "admin123", 10),
      roles: { create: [{ role_id: roleByName.get("Super Admin")!.id }] }
    }
  });

  const memberPassword = process.env.SEED_MEMBER_PASSWORD ?? DEFAULT_MEMBER_PASSWORD;
  const memberPasswordHash = await bcrypt.hash(memberPassword, 10);
  const committeeUsersByCommittee = new Map<string, { leadId: string; memberIds: string[] }>();

  for (const group of committeeUserSeeds) {
    const memberIds: string[] = [];
    let leadId = "";
    for (const seedUser of group.users) {
      const roleIds = [{ role_id: roleByName.get(seedUser.role)!.id }];
      if (group.committeeName === "อำนวยการและการเงิน") {
        roleIds.push({ role_id: roleByName.get("Finance Officer")!.id });
      }
      const created = await prisma.user.create({
        data: {
          name: seedUser.name,
          username: seedUser.username,
          password_hash: memberPasswordHash,
          roles: { create: roleIds }
        }
      });
      memberIds.push(created.id);
      if (seedUser.role === "Committee Lead") leadId = created.id;
    }
    committeeUsersByCommittee.set(group.committeeName, { leadId, memberIds });
  }

  const allMemberIds = [...committeeUsersByCommittee.values()].flatMap((g) => g.memberIds);

  const organization = await prisma.organization.create({
    data: {
      slug: "yunnan-329",
      name: "มูลนิธิกีฬา 329 ชาวจีนยูนาน"
    }
  });

  const orgMemberUserIds = [director.id, admin.id, ...allMemberIds];
  await prisma.organizationMember.createMany({
    data: orgMemberUserIds.map((user_id) => ({ organization_id: organization.id, user_id }))
  });

  const project = await prisma.project.create({
    data: {
      organization_id: organization.id,
      slug: "edition-2570",
      name: "กีฬา 329 ชาวจีนยูนาน",
      edition: "รอบจัดงาน 29 มี.ค. – 5 เม.ย. 2570",
      description:
        "ระบบ MIS สำหรับเตรียมและบริหารงานแข่งขันกีฬา 329 ชาวจีนยูนาน 329 = เดือน 3 (มีนาคม) วันที่ 29 จัดทุกปีในช่วง 29 มี.ค. – 5 เม.ย.",
      event_date: EVENT_329.start,
      event_end_date: EVENT_329.end,
      planned_budget: committeeSeeds.reduce((sum, item) => sum + item.budget, 0),
      actual_budget: 0,
      created_by: director.id
    }
  });

  const committees = new Map<string, Awaited<ReturnType<typeof prisma.committee.create>>>();
  const plans = new Map<string, Awaited<ReturnType<typeof prisma.plan.create>>>();

  for (let i = 0; i < committeeSeeds.length; i++) {
    const { name, ownerLabel, initials, budget, risk, weight } = committeeSeeds[i];
    const group = committeeUserSeeds.find((g) => g.committeeName === name);
    const leadUser = group?.users.find((u) => u.role === "Committee Lead");
    const committee = await prisma.committee.create({
      data: {
        project_id: project.id,
        name,
        owner_name: leadUser?.name ?? ownerLabel,
        owner_initials: leadUser?.initials ?? initials,
        sort_order: i + 1,
        risk_level: risk,
        planned_budget: budget,
        created_by: director.id
      }
    });
    committees.set(name, committee);
    plans.set(
      name,
      await prisma.plan.create({
        data: {
          project_id: project.id,
          committee_id: committee.id,
          name: `แผนงาน${name}`,
          description: `หมวดงานตั้งต้นสำหรับ ${name}`,
          weight,
          created_by: director.id
        }
      })
    );
  }

  const committeeMemberRows: Array<{ user_id: string; committee_id: string; position: string }> = [];
  for (const group of committeeUserSeeds) {
    const committee = committees.get(group.committeeName);
    if (!committee) continue;
    for (const seedUser of group.users) {
      const user = await prisma.user.findUnique({ where: { username: seedUser.username } });
      if (!user) continue;
      committeeMemberRows.push({
        user_id: user.id,
        committee_id: committee.id,
        position: seedUser.position
      });
    }
  }
  await prisma.committeeMember.createMany({ data: committeeMemberRows });

  const createdTasks = [];
  for (let i = 0; i < taskSeeds.length; i++) {
    const seed = taskSeeds[i];
    const committee = committees.get(seed.plan);
    const plan = plans.get(seed.plan);
    if (!committee || !plan) throw new Error(`Missing committee/plan for ${seed.plan}`);

    const progress = progressFor(i, seed.priority);
    const { start, due } = scheduleTaskWindow(seed.priority, i, seed.phase ?? "pre");
    const status: TaskStatus = progress === 0 ? "NOT_STARTED" : i % 13 === 0 ? "DELAYED" : progress >= 60 ? "SUBMITTED" : "IN_PROGRESS";
    const committeeUsers = committeeUsersByCommittee.get(seed.plan);
    const taskOwnerId = committeeUsers?.leadId ?? director.id;

    const task = await prisma.task.create({
      data: {
        project_id: project.id,
        committee_id: committee.id,
        plan_id: plan.id,
        code: seed.code,
        title: seed.title,
        description: `Priority ${seed.priority} | หลักฐานที่ต้องแนบ: ${seed.outputs.join(", ")}`,
        success_criteria: `สำเร็จเมื่อดำเนินงานครบและมีหลักฐาน: ${seed.outputs.join(", ")}`,
        status,
        priority: priorityMap[seed.priority],
        start_date: start,
        due_date: due,
        owner_id: taskOwnerId,
        reviewer_id: admin.id,
        reported_progress: Math.min(100, progress + 10),
        evidence_progress: evidenceProgress(seed.outputs.length, progress > 30 ? Math.min(seed.outputs.length, 1 + (i % seed.outputs.length)) : 0),
        verified_progress: progress,
        is_critical: seed.priority === "P0" || seed.risk === "Critical",
        weight: seed.priority === "P0" ? 2 : 1,
        created_by: director.id
      }
    });
    createdTasks.push({ task, seed, committee, plan });

    const assignees = committeeUsers?.memberIds.length ? committeeUsers.memberIds : [director.id];
    await prisma.subtask.createMany({
      data: seed.subtasks.map((title, subIndex) => ({
        task_id: task.id,
        title,
        owner_id: assignees[subIndex % assignees.length],
        status: progress === 0 ? "NOT_STARTED" : subIndex < Math.floor(seed.subtasks.length * (progress / 100)) ? "DONE" : "IN_PROGRESS",
        reported_progress: progress,
        evidence_progress: progress > 40 ? 50 : 0,
        verified_progress: subIndex < Math.floor(seed.subtasks.length * (progress / 100)) ? 100 : 0,
        created_by: director.id
      }))
    });
  }

  const seededBudgetItems: Array<{ id: string; planned: number; priority: string }> = [];
  for (const { task, seed, committee, plan } of createdTasks.filter((item) => item.seed.budget !== undefined)) {
    const planned = seed.budget ?? 0;
    const item = await prisma.budgetItem.create({
      data: {
        project_id: project.id,
        committee_id: committee.id,
        plan_id: plan.id,
        task_id: task.id,
        title: `งบประมาณ: ${seed.title}`,
        category: seed.plan,
        receipt_no: `BUD-${seed.code}`,
        planned_amount: planned,
        requested_amount: planned,
        approved_amount: seed.priority === "P0" ? planned * 0.75 : planned * 0.35,
        committed_amount: 0,
        actual_amount: 0,
        status: seed.priority === "P0" ? "REQUESTED" : "DRAFT",
        created_by: director.id
      }
    });
    seededBudgetItems.push({ id: item.id, planned, priority: seed.priority });
  }

  for (const [index, budgetSeed] of seededBudgetItems.slice(0, 6).entries()) {
    const paid = Math.round(budgetSeed.planned * (budgetSeed.priority === "P0" ? 0.15 : 0.05) * (index + 1) * 0.3);
    if (paid <= 0) continue;
    await prisma.budgetTransaction.create({
      data: {
        budget_item_id: budgetSeed.id,
        amount: paid,
        status: "PAID",
        note: `ตัวอย่างธุรกรรม seed #${index + 1}`,
        created_by: director.id
      }
    });
    await prisma.budgetItem.update({
      where: { id: budgetSeed.id },
      data: { actual_amount: paid, status: "PAID" }
    });
  }

  for (let i = 0; i < Math.min(18, createdTasks.length); i++) {
    const { task, seed, committee } = createdTasks[i];
    const file = await prisma.fileAsset.create({
      data: {
        project_id: project.id,
        uuid_filename: `seed-${seed.code.toLowerCase()}.pdf`,
        original_filename: `${seed.outputs[0]}.pdf`,
        mime_type: "application/pdf",
        byte_size: 48000 + i * 2500,
        sha256_hash: `seed-${seed.code}`,
        storage_key: `local/seed/${seed.code}.pdf`,
        created_by: director.id
      }
    });
    await prisma.evidence.create({
      data: {
        project_id: project.id,
        committee_id: committee.id,
        task_id: task.id,
        file_asset_id: file.id,
        code: `EV-${String(i + 1).padStart(3, "0")}`,
        caption: seed.outputs[0],
        status: i % 5 === 0 ? "PENDING" : "APPROVED",
        created_by: director.id
      }
    });
  }

  const risks = createdTasks.filter(({ seed }) => seed.risk && ["Critical", "High"].includes(seed.risk)).slice(0, 12);
  for (let i = 0; i < risks.length; i++) {
    const { task, seed, committee } = risks[i];
    const likelihood = seed.risk === "Critical" ? 4 : 3;
    const impact = seed.risk === "Critical" ? 5 : 4;
    const risk = computeRisk(likelihood, impact);
    await prisma.risk.create({
      data: {
        project_id: project.id,
        committee_id: committee.id,
        task_id: task.id,
        code: `R-${String(i + 1).padStart(2, "0")}`,
        title: `ความเสี่ยง: ${seed.title}`,
        likelihood,
        impact,
        score: risk.score,
        level: risk.level,
        mitigation_plan: `ติดตาม ${seed.title} ในที่ประชุมประจำสัปดาห์และกำหนดผู้รับผิดชอบชัดเจน`,
        contingency_plan: `หากงานล่าช้า ให้ศูนย์ประสานงานกลางยกระดับเข้าคณะกรรมการอำนวยการภายใน 24 ชั่วโมง`,
        owner_name: committee.owner_name,
        owner_initials: committee.owner_initials,
        status: i % 3 === 0 ? "MITIGATING" : "WATCHING",
        created_by: director.id
      }
    });
  }

  const meeting = await prisma.meeting.create({
    data: {
      project_id: project.id,
      title: "ประชุมเปิดแผนเตรียมงาน 329 รอบ 29 มี.ค. – 5 เม.ย. 2570",
      meeting_at: new Date("2026-06-05T13:30:00+07:00"),
      notes: "ยืนยันปฏิทินงาน 329 (29 มีนาคม) โครงสร้างคณะกรรมการ งบประมาณ และ Timeline เตรียมงาน 10 เดือนก่อนวันแข่งขัน",
      decisions: "อนุมัติแผนเตรียมงานรอบ 29 มี.ค. – 5 เม.ย. 2570 และให้ทุกฝ่ายลง Due Date ใน MIS ให้ครบก่อนวันงาน",
      created_by: director.id
    }
  });
  await prisma.meetingAgenda.createMany({
    data: ["ภาพรวมโครงการ", "คณะกรรมการ", "งบประมาณ", "Timeline", "Risk Register", "Dashboard"].map((title, order) => ({ meeting_id: meeting.id, title, order }))
  });
  await prisma.meetingActionItem.create({
    data: {
      meeting_id: meeting.id,
      decision_title: "ตรวจทานผู้รับผิดชอบรายฝ่าย",
      description: "ให้แต่ละฝ่ายตรวจทาน Owner, Reviewer, Due Date และหลักฐานที่ต้องแนบในระบบ MIS",
      owner_name: "เลขานุการโครงการ",
      due_date: addDays(EVENT_329.planningStart, 21),
      linked_task_id: createdTasks[2].task.id,
      linked_committee_id: createdTasks[2].committee.id
    }
  });

  const refreshedTasks = await prisma.task.findMany({ where: { project_id: project.id }, include: { committee: true, evidence: true, budgetItems: true, risks: true } });
  const refreshedCommittees = await prisma.committee.findMany({ where: { project_id: project.id }, orderBy: { sort_order: "asc" } });
  const totalSubtasks = await prisma.subtask.count({ where: { task: { project_id: project.id } } });
  const summary = {
    project: project.name,
    template: "329 = 29 มีนาคม · รอบ 29 มี.ค. – 5 เม.ย. 2570",
    totalTasks: refreshedTasks.length,
    totalSubtasks,
    prioritySummary: {
      P0: taskSeeds.filter((task) => task.priority === "P0").length,
      P1: taskSeeds.filter((task) => task.priority === "P1").length,
      P2: taskSeeds.filter((task) => task.priority === "P2").length,
      P3: taskSeeds.filter((task) => task.priority === "P3").length
    },
    overallProgress: weightedProgress(refreshedTasks),
    committeeProgress: refreshedCommittees.map((committee) => ({
      name: committee.name,
      progress: weightedProgress(refreshedTasks.filter((task) => task.committee_id === committee.id)),
      delayed: refreshedTasks.filter((task) => task.committee_id === committee.id && task.status === "DELAYED").length
    })),
    budgetSummary: {
      planned: committeeSeeds.reduce((sum, item) => sum + item.budget, 0),
      requested: taskSeeds.reduce((sum, task) => sum + (task.budget ?? 0), 0)
    },
    delayedTasks: refreshedTasks.filter((task) => task.status === "DELAYED").map((task) => task.title),
    criticalRisks: risks.slice(0, 5).map(({ seed }) => seed.title),
    next7DaysTasks: refreshedTasks.slice(0, 7).map((task) => task.title),
    decisionsNeeded: ["ยืนยันวัน เวลา สถานที่", "รับรองคำสั่งคณะกรรมการ", "อนุมัติงบประมาณรวม", "ยืนยันแผนความปลอดภัยและปฐมพยาบาล"]
  };
  const snapshot = await prisma.dashboardSnapshot.create({
    data: {
      project_id: project.id,
      title: "Seed Snapshot 329 · 29 มี.ค. – 5 เม.ย. 2570",
      data: JSON.stringify(summary),
      created_by: director.id
    }
  });
  await prisma.powerPointReport.create({
    data: {
      project_id: project.id,
      snapshot_id: snapshot.id,
      type: "EXECUTIVE_SUMMARY",
      title: "รายงานผู้บริหาร กีฬา 329 ชาวจีนยูนาน",
      file_path: "storage/reports/seed-329-yunnan-sports-summary.pptx",
      generated_by: director.id
    }
  });
  await prisma.project.create({
    data: {
      organization_id: organization.id,
      slug: "edition-2571-demo",
      name: "กีฬา 329 (รอบซ้อม)",
      edition: "รอบซ้อม 29 มี.ค. – 5 เม.ย. 2571 (ตัวอย่าง)",
      description: "โปรเจกต์ตัวอย่างสำหรับทดสอบสลับหลายรอบจัดงาน — ยังไม่มีภารกิจ",
      event_date: new Date("2028-03-29"),
      event_end_date: new Date("2028-04-05"),
      planned_budget: 0,
      created_by: director.id
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        project_id: project.id,
        title: "งานล่าช้า",
        body: "มีงานที่เลยกำหนด — ตรวจบอร์ดภารกิจ",
        user_id: null
      },
      {
        project_id: project.id,
        title: "Snapshot",
        body: "บันทึก Snapshot ก่อนสร้างรายงาน PowerPoint",
        user_id: director.id
      }
    ]
  });

  await prisma.auditLog.create({
    data: {
      user_id: director.id,
      action: "Seed 329 Yunnan sports template",
      entity_type: "Project",
      entity_id: project.id,
      new_value: JSON.stringify({
        organization: organization.slug,
        tasks: refreshedTasks.length,
        subtasks: totalSubtasks,
        snapshot: snapshot.id,
        multiProject: true
      })
    }
  });

  const userCount = await prisma.user.count({ where: { deleted_at: null } });
  const pwHint = (envKey: string, def: string) => (process.env[envKey] ? "(ตั้งผ่าน env)" : def);
  console.log("\n=== บัญชีผู้ใช้ 329 MIS (10 คน) ===");
  console.log(`ผู้ดูแล: admin / ${pwHint("SEED_ADMIN_PASSWORD", "admin123")}`);
  console.log(`ประธาน: director / ${pwHint("SEED_DIRECTOR_PASSWORD", "password123")}`);
  console.log(`สมาชิกฝ่าย (8 คน · 4 กลุ่มงาน): รหัสผ่านเริ่มต้น ${pwHint("SEED_MEMBER_PASSWORD", DEFAULT_MEMBER_PASSWORD)}`);
  console.log("ตัวอย่าง: gov_lead, ops_lead, host_lead, mis_lead ... (ดู prisma/user-seeds.ts)");
  console.log("⚠️  Production: ตั้ง SEED_ADMIN_PASSWORD / SEED_DIRECTOR_PASSWORD / SEED_MEMBER_PASSWORD แล้วเปลี่ยนรหัสหลัง deploy");
  console.log(`รวมผู้ใช้ในระบบ: ${userCount} คน\n`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
