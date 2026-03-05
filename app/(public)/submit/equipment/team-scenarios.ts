export interface Criterion {
  id: string;
  heroName: string;
  requirements: string;
}

export interface TeamScenario {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];
}

export const TEAM_SCENARIOS: TeamScenario[] = [
  {
    id: "team1-lipo",
    title: "1. ทีมบุก ลิโป้ที่ไม่มีเอมิเลีย",
    description: "ลิง/เกล/ธรูด (ใช้คารัม)",
    criteria: [
      {
        id: "t1-ling",
        heroName: "ลิง",
        requirements:
          "เซ็ตต้าน บลอค 85 ลดความเสียหาย 1-2 ตัว",
      },
      {
        id: "t1-gel",
        heroName: "เกลลิดัส",
        requirements:
          "เซ็ตต้าน บลอค 52 อาวุธ def% เสื้อลดความเสียหาย ป้องกันรวมให้ได้อย่างน้อย 1650",
      },
      {
        id: "t1-thrud",
        heroName: "ธรูด",
        requirements:
          "เซ็ตจุดอ่อน ใส่เสื้อลดความเสียหาย ทำสแตท บลอค 28 จุดอ่อน 100 โจมตี 3000+",
      },
    ],
  },
  {
    id: "team2-magic",
    title: "2. บุกทีมเวทย์",
    description:
      "พาลานอส อารากอน รีน่า (อารากอนต้องอัพตีธรรมดา ถ้ามันไม่มีมิเลีย ใส่เพลตันแทนรีน่าได้) สัตว์ ไพค์ เปิดสกิล อารากอน ล่างพาลานอส บนพาลานอส",
    criteria: [
      {
        id: "t2-palanos",
        heroName: "พาลานอส",
        requirements:
          "เซ็ตบอส ทำคริ 100 เกราะลดดาเมจ 2 ชิ้น atk กับ cri dmg เยอะๆ แหวนตายเกิด/ซอมบี้",
      },
      {
        id: "t2-aragon",
        heroName: "อารากอน",
        requirements:
          "เซ็ตบล็อค ทำบล็อค 100 อาวุธ def% เกราะลดดาเมจ 2 ตัว แหวนตายเกิด 5+",
      },
      {
        id: "t2-reena",
        heroName: "รีน่า",
        requirements:
          "เซ็ตบล็อค ทำบล็อค 100 อาวุธ hp% เกราะลดดาเมจ 2 ชิ้น แหวนตายเกิด 5+",
      },
    ],
  },
  {
    id: "team3-radgrid-solo",
    title: "3. บุกทีมแรดกริด",
    description:
      "ลิง เกล/เอลิเซีย สัตว์ไม่ยู และมันไม่ซ้อนเดท — ใช้แรดกริดตัวเดียว สัตว์ลู",
    criteria: [
      {
        id: "t3-radgrid",
        heroName: "แรดกริด",
        requirements:
          "เซ็ตบล็อค บล็อค 100 (รวมแหวน) อาวุธ def% 2 ชิ้น เกราะลดดาเมจ 2 ชิ้น แหวน block 10% ซ้อน def 10% ได้เลย ไว้เช็คของฝั่งนุ้นได้ ไม้แรกยอมให้แพ้เดทได้ ทำ def รวมให้ฮิวทีละ 2000+",
      },
    ],
  },
  {
    id: "team4-date",
    title: "4. บุก แรดกริด ลิง เอส",
    description: "ใช้ทีมเดท คริส น็อก พระแม่ สัตว์ เมลเปโร่",
    criteria: [
      {
        id: "t4-chris",
        heroName: "คริส",
        requirements:
          "เซ็ตหมอผี ทำบล็อค 50+ ต้าน 70+ ติดสปีด แหวนตายเกิด 4",
      },
      {
        id: "t4-nok",
        heroName: "น็อก",
        requirements:
          "เซ็ตหมอผี ทำบล็อค 60+ ต้าน 70+ ติดสปีด แหวนตายเกิด/ซอมบี้",
      },
      {
        id: "t4-goddess",
        heroName: "พระแม่",
        requirements:
          "เซ็ตบล็อค บล็อค 100 ลดดาเมจ 2 ชิ้น แหวนตายเกิด 5+",
      },
    ],
  },
  {
    id: "team5-radgrid-ling-s",
    title: "5. บุก แรดกริด ลิง เกล สัตว์ยู/สัตว์ปกติที่ซ้อนเดท",
    description:
      "ใช้ แรดกริด ลิง เอส สัตว์ยู ถ้าแหวนเหลือ ใส่ตายเกิดจัดเต็มทั้ง 3 ตัวเลย สกิล บนลิง ล่างเอส ล่างลิง (ถ้ารุ้สกิลฝั่งนุ้นแล้ว ให้ล่างเอสหลังลิงมันบน)",
    criteria: [
      {
        id: "t5-radgrid",
        heroName: "แรดกริด",
        requirements:
          "เซ็ตบล็อค บล็อค 100 อาวุธ def% เกราะลดดาเมจ 2 ชิ้น",
      },
      {
        id: "t5-ling",
        heroName: "ลิง",
        requirements:
          "เซ็ตจุดอ่อน บล็อค 100 อาวุธ atk% เกราะลดดาเมจ 2 ชิ้น จุดอ่อนสัก 50 ได้ก็ดี",
      },
      {
        id: "t5-s",
        heroName: "เอส",
        requirements: "เซ็ตบล็อค บล็อค 100 ลดดาเมจ 2 ชิ้น",
      },
    ],
  },
  {
    id: "team6-ryan",
    title: "6. บุก พาลานอส โรซี่ น็อก",
    description:
      "ใช้ ไรอัน เตียวเสี้ยน ไพร์ สัตว์ดาเมจอะไรก็ได้ (อีรีน รีเชล เดลโล่) *เงื่อนไขหลักคือต้องได้เปิดก่อนเท่านั้น สกิล บนไรอัน บนเตียว ล่างไรอัน",
    criteria: [
      {
        id: "t6-ryan",
        heroName: "ไรอัน",
        requirements:
          "เซ็ตจุดอ่อน ทำจุดอ่อน 100 คริ 90+ ติดสปีด แหวนซอมบี้/ตายเกิด",
      },
      {
        id: "t6-pyre",
        heroName: "ไพร์",
        requirements:
          "เซ็ตจุดอ่อน จุดอ่อน 100 คริเยอะๆ ติดสปีด แหวนซอมบี้",
      },
      {
        id: "t6-tiao",
        heroName: "เตียว",
        requirements: "เซ็ตบล็อค บล็อค 100 ติดสปีด",
      },
    ],
  },
  {
    id: "team7-emilia",
    title: "7. บุก แรดกริด ลิง เอลิเซีย สัตว์ยู/มันซ้อนเดท",
    description:
      "ใช้ โป้ แฝด เอมิเลีย สัตว์อีรีน *เปิดก่อน เปิดบนเอมิเลีย บนแฝด ล่างโป้",
    criteria: [
      {
        id: "t7-po",
        heroName: "โป้",
        requirements: "เซ็ตจุดอ่อน จุดอ่อน 100 คริ 100 ติดสปีด",
      },
      {
        id: "t7-twins",
        heroName: "แฝด",
        requirements:
          "เซ็ตต้าน จุดอ่อน 100 คริ 90+ atk เยอะๆ สปีดต่ำสุดในทีม",
      },
      {
        id: "t7-emilia",
        heroName: "เอมิเลีย",
        requirements: "เข้าเป้า 51% ยำสปีด แหวนซอมบี้",
      },
    ],
  },
];

export const ALL_CRITERIA = TEAM_SCENARIOS.flatMap((s) =>
  s.criteria.map((c) => ({ ...c, scenarioId: s.id, scenarioTitle: s.title })),
);

export const TOTAL_CRITERIA = ALL_CRITERIA.length;
