/** 28 ผู้ใช้งานฝ่ายงาน (2 คน/คณะ × 14 คณะ) + director + admin = 30 บัญชี */
export const DEFAULT_MEMBER_PASSWORD = "Pass329!";

export type CommitteeUserSeed = {
  username: string;
  name: string;
  position: string;
  role: "Committee Lead" | "Task Owner";
  initials: string;
};

export const committeeUserSeeds: Array<{
  committeeName: string;
  abbr: string;
  users: [CommitteeUserSeed, CommitteeUserSeed];
}> = [
  {
    committeeName: "ภาพรวมโครงการ",
    abbr: "pv",
    users: [
      { username: "pv_lead", name: "โกวเหมิน แซ่หลี่", position: "ประธานคณะภาพรวม", role: "Committee Lead", initials: "กห" },
      { username: "pv_staff", name: "หยาง หลี่หม่า", position: "เลขาภาพรวม", role: "Task Owner", initials: "ยห" }
    ]
  },
  {
    committeeName: "คณะกรรมการและบทบาท",
    abbr: "kn",
    users: [
      { username: "kn_lead", name: "หลี่ เหวินเฉียง", position: "หัวหน้าฝ่ายคณะกรรมการ", role: "Committee Lead", initials: "หว" },
      { username: "kn_staff", name: "จาง เสี่ยวหลิง", position: "เจ้าหน้าที่คณะกรรมการ", role: "Task Owner", initials: "จห" }
    ]
  },
  {
    committeeName: "งบประมาณและการเงิน",
    abbr: "ng",
    users: [
      { username: "ng_lead", name: "หวัง จื่อหยาง", position: "หัวหน้าฝ่ายการเงิน", role: "Committee Lead", initials: "วจ" },
      { username: "ng_staff", name: "หลิว หมิง", position: "เจ้าหน้าที่งบประมาณ", role: "Task Owner", initials: "ลห" }
    ]
  },
  {
    committeeName: "สถานที่และผังงาน",
    abbr: "st",
    users: [
      { username: "st_lead", name: "เฉิน เจียหลง", position: "หัวหน้าฝ่ายสถานที่", role: "Committee Lead", initials: "เจย" },
      { username: "st_staff", name: "หวง เสี่ยวหมิง", position: "เจ้าหน้าที่สถานที่", role: "Task Owner", initials: "วห" }
    ]
  },
  {
    committeeName: "ความปลอดภัยและการแพทย์",
    abbr: "ps",
    users: [
      { username: "ps_lead", name: "หยาง หลี่เฉิน", position: "หัวหน้าฝ่ายความปลอดภัย", role: "Committee Lead", initials: "ยล" },
      { username: "ps_staff", name: "จ้าว หลี่หลง", position: "เจ้าหน้าที่ปฐมพยาบาล", role: "Task Owner", initials: "จล" }
    ]
  },
  {
    committeeName: "กีฬาและการแข่งขัน",
    abbr: "kl",
    users: [
      { username: "kl_lead", name: "สมชาย แซ่ลี", position: "หัวหน้าฝ่ายกีฬา", role: "Committee Lead", initials: "สล" },
      { username: "kl_staff", name: "หมี จาง", position: "เจ้าหน้าที่กีฬา", role: "Task Owner", initials: "หจ" }
    ]
  },
  {
    committeeName: "พิธีการและวัฒนธรรม",
    abbr: "pt",
    users: [
      { username: "pt_lead", name: "หลิน เสี่ยวหยาง", position: "หัวหน้าฝ่ายพิธีการ", role: "Committee Lead", initials: "ลย" },
      { username: "pt_staff", name: "เย่ หลี่หลิง", position: "เจ้าหน้าที่พิธีการ", role: "Task Owner", initials: "ยล" }
    ]
  },
  {
    committeeName: "อาหารและสวัสดิการ",
    abbr: "ah",
    users: [
      { username: "ah_lead", name: "เจียง หลี่เฉิน", position: "หัวหน้าฝ่ายสวัสดิการ", role: "Committee Lead", initials: "จล" },
      { username: "ah_staff", name: "ซุน หมิง", position: "เจ้าหน้าที่อาหาร", role: "Task Owner", initials: "ซห" }
    ]
  },
  {
    committeeName: "ประชาสัมพันธ์และสื่อสาร",
    abbr: "pc",
    users: [
      { username: "pc_lead", name: "หยาง จื่อเฉิน", position: "หัวหน้าฝ่ายประชาสัมพันธ์", role: "Committee Lead", initials: "ยจ" },
      { username: "pc_staff", name: "หวู่ เสี่ยวหลิง", position: "เจ้าหน้าที่สื่อ", role: "Task Owner", initials: "วห" }
    ]
  },
  {
    committeeName: "ทะเบียนและต้อนรับ",
    abbr: "tb",
    users: [
      { username: "tb_lead", name: "เฉิน หลี่หลิง", position: "หัวหน้าฝ่ายทะเบียน", role: "Committee Lead", initials: "ฉล" },
      { username: "tb_staff", name: "หลิว หยาง", position: "เจ้าหน้าที่ทะเบียน", role: "Task Owner", initials: "ลย" }
    ]
  },
  {
    committeeName: "เอกสาร รายงาน และ MIS",
    abbr: "ek",
    users: [
      { username: "ek_lead", name: "หลี่ หมิงเฉิน", position: "หัวหน้าฝ่ายเอกสาร", role: "Committee Lead", initials: "ลห" },
      { username: "ek_staff", name: "เย่ จื่อเฉิน", position: "เจ้าหน้าที่ MIS", role: "Task Owner", initials: "ยจ" }
    ]
  },
  {
    committeeName: "Timeline และความเสี่ยง",
    abbr: "tl",
    users: [
      { username: "tl_lead", name: "หยาง หลี่เฉิน", position: "หัวหน้าฝ่ายติดตามงาน", role: "Committee Lead", initials: "ยล" },
      { username: "tl_staff", name: "หวัง เสี่ยวหลิง", position: "เจ้าหน้าที่ไทม์ไลน์", role: "Task Owner", initials: "วห" }
    ]
  },
  {
    committeeName: "ปฏิบัติการวันงาน",
    abbr: "sp",
    users: [
      { username: "sp_lead", name: "จ้าว หลี่หยาง", position: "หัวหน้าศูนย์ประสานงาน", role: "Committee Lead", initials: "จย" },
      { username: "sp_staff", name: "หลิน เสี่ยวหยาง", position: "เจ้าหน้าที่ปฏิบัติการ", role: "Task Owner", initials: "ลย" }
    ]
  },
  {
    committeeName: "สรุปผลและพัฒนาปีถัดไป",
    abbr: "sr",
    users: [
      { username: "sr_lead", name: "เย่ หลี่หลิง", position: "หัวหน้าฝ่ายรายงานผล", role: "Committee Lead", initials: "ยล" },
      { username: "sr_staff", name: "หยาง หมิง", position: "เจ้าหน้าที่สรุปผล", role: "Task Owner", initials: "ยห" }
    ]
  }
];
