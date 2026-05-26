// ข้อมูลหมู่บ้าน/ทีม กีฬา 329 — รวบรวมจากบัญชีรายชื่อทางการของคณะกรรมการ (ครั้งที่ 30)
// แหล่ง: "329 各村 貴賓_桌牌_遊行順序 名單.xlsx" (ชีต 各村名單 / 最新村名 / 遊行順序)

export type VillageType = "village" | "association";

export interface Village {
  no: number;
  /** ชื่อหมู่บ้านภาษาจีน 中文村名 */
  zh: string;
  /** ชื่อหมู่บ้านภาษาไทย */
  th: string;
  provinceTh: string;
  provinceZh: string;
  phones: string[];
  /** ลำดับเดินพาเหรดพิธีเปิด (ถ้ามี) */
  parade: number | null;
  type: VillageType;
  /** เจ้าภาพครั้งที่ 31 */
  host: boolean;
}

export interface ProvinceInfo {
  th: string;
  zh: string;
  count: number;
}

export const PROVINCES: ProvinceInfo[] = [
  { th: "เชียงราย", zh: "清萊", count: 27 },
  { th: "เชียงใหม่", zh: "清邁", count: 18 },
  { th: "แม่ฮ่องสอน", zh: "夜豐頌府", count: 2 },
  { th: "ตาก", zh: "達府", count: 1 },
  { th: "กรุงเทพฯ", zh: "曼谷", count: 1 },
  { th: "ภูเก็ต", zh: "普吉島", count: 1 },
];

export const VILLAGES: Village[] = [
  { no: 1, zh: "大谷地", th: "บ้านอรุโณทัย", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["084-0208666"], parade: 2, type: "village", host: false },
  { no: 2, zh: "孟納村", th: "บ้านเมืองนะ", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["096-11795290", "081-4168565"], parade: null, type: "village", host: false },
  { no: 3, zh: "熱水塘村", th: "บ้านใหม่หนองบัว", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["061-3581868"], parade: 32, type: "village", host: false },
  { no: 4, zh: "塘窩村", th: "บ้านถ้ำง็อบ", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["093-1305160"], parade: 15, type: "village", host: false },
  { no: 5, zh: "新寨村", th: "บ้านสินชัย", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: [], parade: null, type: "village", host: false },
  { no: 6, zh: "華亮村", th: "บ้านผาแดง", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: [], parade: null, type: "village", host: false },
  { no: 7, zh: "賀肥村", th: "บ้านห้วฝาย", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["087-1828168", "087-1725909"], parade: 25, type: "village", host: false },
  { no: 8, zh: "伴懷村", th: "บ้านปางควาย", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: [], parade: null, type: "village", host: false },
  { no: 9, zh: "龍傳村", th: "ดอยป่าไผ่", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["096-6977127"], parade: 36, type: "village", host: false },
  { no: 10, zh: "昌龍村", th: "บ้านชางหลง", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["092-5468899"], parade: null, type: "village", host: false },
  { no: 11, zh: "盤龍村", th: "บ้านห้วยเฮี่ยน", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["099-6192542"], parade: 33, type: "village", host: false },
  { no: 12, zh: "邊龍村", th: "บ้านเปียงหลวง", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["081-0251588"], parade: 40, type: "village", host: false },
  { no: 13, zh: "安康村", th: "บ้านอ่างขาง", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["095-9265698", "083-8692026"], parade: 8, type: "village", host: false },
  { no: 14, zh: "黃果園村", th: "บ้านสันมะกอกหวาน", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["094-7050459"], parade: 41, type: "village", host: false },
  { no: 15, zh: "昌良村", th: "บ้านไชยา", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["084-8057411"], parade: 13, type: "village", host: false },
  { no: 16, zh: "萬養村", th: "บ้านยาง", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["084-4456667", "084-3785560"], parade: 29, type: "village", host: false },
  { no: 17, zh: "清邁雲南會館", th: "สมาคมยูนนานเชียงใหม่", provinceTh: "เชียงใหม่", provinceZh: "", phones: [], parade: null, type: "association", host: false },
  { no: 18, zh: "密窩", th: "บ้านรักไทย", provinceTh: "เชียงใหม่", provinceZh: "清邁", phones: ["085-6221185"], parade: 35, type: "village", host: false },
  { no: 19, zh: "美斯樂村", th: "แม่สลอง", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["064-9870036"], parade: 38, type: "village", host: false },
  { no: 20, zh: "茶房村", th: "บ้านวาวี", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["095-6472573"], parade: 16, type: "village", host: false },
  { no: 21, zh: "老象塘村", th: "บ้านห้วยไร่สามัคคี", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["080-2991919"], parade: 9, type: "village", host: false },
  { no: 22, zh: "永泰村", th: "บ้านสันติสุข", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["086-0262519"], parade: 6, type: "village", host: false },
  { no: 23, zh: "孟安村", th: "บ้านสุขฤทัย", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["087-1818666"], parade: 11, type: "village", host: false },
  { no: 24, zh: "美章村", th: "บ้านแม่จัน", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["086-8958388"], parade: null, type: "village", host: false },
  { no: 25, zh: "漂排村", th: "บ้านพญาไพร", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["080-1088016"], parade: 42, type: "village", host: true },
  { no: 26, zh: "民模村", th: "บ้านแม่หม้อ", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["087-1800478"], parade: null, type: "village", host: false },
  { no: 27, zh: "輝鵬村", th: "บ้านห้วยผึ้ง", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["065-1094236", "093-2787848"], parade: null, type: "village", host: false },
  { no: 28, zh: "聯華村", th: "บ้านเวียงหมอก", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["090-4757838"], parade: 37, type: "village", host: false },
  { no: 29, zh: "密額村", th: "บ้านแม่แอบ", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["088-9605955"], parade: 19, type: "village", host: false },
  { no: 30, zh: "明利村", th: "บ้านเลาลี", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["081-1695002"], parade: 14, type: "village", host: false },
  { no: 31, zh: "民養村", th: "บ้านห้วยน้ำขุ่น", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["061-4971711"], parade: 5, type: "village", host: false },
  { no: 32, zh: "帕黨村", th: "บ้านผาตั้ง", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["081-1627450"], parade: 12, type: "village", host: false },
  { no: 33, zh: "滿堂村", th: "บ้านถ้ำ", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["098-6010888"], parade: 31, type: "village", host: false },
  { no: 34, zh: "清萊雲南會館", th: "สมาคมยูนนานเชียงราย", provinceTh: "เชียงราย", provinceZh: "", phones: ["095-6472573"], parade: 21, type: "association", host: false },
  { no: 35, zh: "芒崗村", th: "บ้านกลาง", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["093-22117826"], parade: 10, type: "village", host: false },
  { no: 36, zh: "完塔村", th: "บ้านธาตุ", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["095-4755878"], parade: null, type: "village", host: false },
  { no: 37, zh: "蔣家寨", th: "บ้านเจียงจาใส", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["084-3525599"], parade: 18, type: "village", host: false },
  { no: 38, zh: "董家寨", th: "บ้านตงจาใส", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["0899543253"], parade: null, type: "village", host: false },
  { no: 39, zh: "美撒拉", th: "บ้านแม่สแลบ", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["0993165367"], parade: null, type: "village", host: false },
  { no: 40, zh: "回莫村", th: "บ้านห้วยหม้อ", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["081-5131318"], parade: null, type: "village", host: false },
  { no: 41, zh: "回興村", th: "บ้านห้วยซิง", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["087-1837995"], parade: null, type: "village", host: false },
  { no: 42, zh: "孟高浪", th: "บ้านม้งเก้าหลัง", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["085-7155723"], parade: null, type: "village", host: false },
  { no: 43, zh: "滿星疊村", th: "บ้านเทอดไทย", provinceTh: "เชียงราย", provinceZh: "清萊", phones: ["086-0029893"], parade: 39, type: "village", host: false },
  { no: 44, zh: "三民新村", th: "บ้านร่มเกล้าสหมิตร", provinceTh: "ตาก", provinceZh: "達府", phones: ["080-9491939"], parade: 1, type: "village", host: false },
  { no: 45, zh: "普吉雲南會館", th: "สมาคมยูนนานภูเก็ต", provinceTh: "ภูเก็ต", provinceZh: "", phones: [], parade: 23, type: "association", host: false },
  { no: 46, zh: "曼谷雲聯", th: "มิตรภาพกรุงเทพฯ", provinceTh: "กรุงเทพฯ", provinceZh: "", phones: [], parade: 20, type: "association", host: false },
  { no: 47, zh: "黎明新村", th: "บ้านรุ่งอรุณ", provinceTh: "แม่ฮ่องสอน", provinceZh: "", phones: [], parade: 34, type: "village", host: false },
  { no: 48, zh: "山地村", th: "สันติชล", provinceTh: "แม่ฮ่องสอน", provinceZh: "", phones: [], parade: 3, type: "village", host: false },
  { no: 49, zh: "回海村", th: "ห้วยไคร้", provinceTh: "เชียงราย", provinceZh: "", phones: [], parade: 7, type: "village", host: false },
  { no: 50, zh: "回恩村", th: "บ้านห้วยอื้น", provinceTh: "เชียงราย", provinceZh: "", phones: [], parade: null, type: "village", host: false },
];

export const VILLAGE_COUNT = VILLAGES.filter((v) => v.type === "village").length;
export const ASSOCIATION_COUNT = VILLAGES.filter((v) => v.type === "association").length;
export const PROVINCE_COUNT = PROVINCES.length;
export const HOST_VILLAGE = VILLAGES.find((v) => v.host) ?? null;
