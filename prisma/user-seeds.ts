/** 8 ผู้ใช้งานฝ่ายงาน (หัวหน้า + เจ้าหน้าที่ × 4 กลุ่มงานหลัก) + director + admin = 10 บัญชี */
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
    committeeName: "อำนวยการและการเงิน",
    abbr: "gov",
    users: [
      { username: "gov_lead", name: "โกวเหมิน แซ่หลี่", position: "หัวหน้าฝ่ายอำนวยการและการเงิน", role: "Committee Lead", initials: "กห" },
      { username: "gov_staff", name: "หวัง จื่อหยาง", position: "เจ้าหน้าที่การเงินและธุรการ", role: "Task Owner", initials: "วจ" }
    ]
  },
  {
    committeeName: "กีฬา สถานที่ และความปลอดภัย",
    abbr: "ops",
    users: [
      { username: "ops_lead", name: "สมชาย แซ่ลี", position: "หัวหน้าฝ่ายกีฬา สถานที่ และความปลอดภัย", role: "Committee Lead", initials: "สล" },
      { username: "ops_staff", name: "เฉิน เจียหลง", position: "เจ้าหน้าที่สนามและความปลอดภัย", role: "Task Owner", initials: "จล" }
    ]
  },
  {
    committeeName: "พิธีการ สวัสดิการ และประชาสัมพันธ์",
    abbr: "host",
    users: [
      { username: "host_lead", name: "หลิน เสี่ยวหยาง", position: "หัวหน้าฝ่ายพิธีการ สวัสดิการ และประชาสัมพันธ์", role: "Committee Lead", initials: "ลย" },
      { username: "host_staff", name: "เจียง หลี่เฉิน", position: "เจ้าหน้าที่สวัสดิการและประชาสัมพันธ์", role: "Task Owner", initials: "จฉ" }
    ]
  },
  {
    committeeName: "เอกสารและติดตามงาน",
    abbr: "mis",
    users: [
      { username: "mis_lead", name: "หลี่ หมิงเฉิน", position: "หัวหน้าฝ่ายเอกสารและติดตามงาน", role: "Committee Lead", initials: "ลม" },
      { username: "mis_staff", name: "เย่ จื่อเฉิน", position: "เจ้าหน้าที่ MIS และติดตามงาน", role: "Task Owner", initials: "ยจ" }
    ]
  }
];
