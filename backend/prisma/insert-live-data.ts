import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shareholders = [
  { name: "Samson Wallelign Tesfaye", contact: "251943385166", tin: "0095395079", shares: 500, contribution: 500000, date: "2026-08-18" },
  { name: "Yunas Yigezu Mekonin", contact: "251913347252", tin: "0091562183", shares: 270, contribution: 270000, date: "2026-08-18" },
  { name: "Kenaw Nuru Muhabe", contact: "918122687509", tin: "0111225481", shares: 270, contribution: 270000, date: "2026-08-18" },
  { name: "Tesfahun Gashaw Ashagrie", contact: "251996739637", tin: "0095395079", shares: 260, contribution: 260000, date: "2026-08-22" },
  { name: "Alebachew Molalign Alemie", contact: "251935828132", tin: "0076923559", shares: 250, contribution: 250000, date: "2026-08-24" },
  { name: "Lemma Getachew Zenebe", contact: "251930507412", tin: "0095468236", shares: 270, contribution: 270000, date: "2026-08-26" },
  { name: "Meaza Sileshi G/Silassie", contact: "", tin: "", shares: 250, contribution: 250000, date: "2026-08-27" },
  { name: "Netsanet Desalegn Miskir", contact: "", tin: "", shares: 520, contribution: 520000, date: "2026-08-27" },
  { name: "Misgana Tewelebirhan Tekile", contact: "+251914934043", tin: "", shares: 265, contribution: 265000, date: "2026-08-27" },
  { name: "Binyam Bokrey Geday", contact: "+251 95 303 1469", tin: "0112675492", shares: 270, contribution: 270000, date: "2026-08-27" },
  { name: "Birhanu Dessie Ayalew", contact: "+251 92 729 3016", tin: "0087687465", shares: 520, contribution: 520000, date: "2026-08-28" },
  { name: "Alemayehu Tseganew Tadesse", contact: "+919078260731", tin: "0077500919", shares: 270, contribution: 270000, date: "2026-10-09" },
  { name: "Eyayew Dessie Afework", contact: "+251 96 293 6441", tin: "0106796149", shares: 250, contribution: 250000, date: "2026-09-15" },
  { name: "Desalegn Tegegn Belay", contact: "+251 91 767 6655", tin: "0112034348", shares: 270, contribution: 270000, date: "2026-09-16" },
  { name: "Aymen Telsem Ahmed", contact: "+251 97 805 5490", tin: "0097083455", shares: 270, contribution: 270000, date: "2026-09-17" },
  { name: "Etefie Tsegaw Aboneh", contact: "+251 91 864 5601", tin: "0077881191", shares: 270, contribution: 270000, date: "2026-09-24" },
  { name: "Dagmawi Geta Tefera", contact: "251943413159", tin: "00971350", shares: 135, contribution: 135000, date: "2026-10-26" },
  { name: "Kassahun Molla Kebede", contact: "+251 92 243 3096", tin: "", shares: 270, contribution: 270000, date: "2026-11-23" },
];

async function main() {
  console.log("Connecting to database...");
  
  // 1. Create 18 Shareholders
  for (const s of shareholders) {
    const tenant = await prisma.tenant.create({ data: { name: s.name, type: "SHAREHOLDER" } });
    await prisma.shareholderProfile.create({
      data: {
        tenantId: tenant.id,
        contactNo: s.contact || null,
        tinNumber: s.tin || null,
        numberOfShares: s.shares,
        totalContribution: s.contribution,
        datePaid: new Date(`${s.date}T00:00:00.000Z`),
      },
    });
    console.log(`Inserted: ${s.name}`);
  }

  // 2. Create Superadmin
  const adminHash = await bcrypt.hash("SuperAdmin@2026", 10);
  const adminTenant = await prisma.tenant.create({ data: { name: "PrimeHorizon Admin", type: "INTERNAL" } });
  await prisma.user.create({
    data: {
      tenantId: adminTenant.id,
      email: "superadmin@primehorizon.com",
      firstName: "Super",
      lastName: "Admin",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Inserted Superadmin");

  // 3. Create Shareholder User
  const shHash = await bcrypt.hash("Primehorizon@2026", 10);
  const shTenant = await prisma.tenant.create({ data: { name: "PrimeHorizon Shareholders", type: "SHAREHOLDER" } });
  await prisma.user.create({
    data: {
      tenantId: shTenant.id,
      email: "shareholder@primehorizon.com",
      firstName: "All",
      lastName: "Shareholders",
      passwordHash: shHash,
      role: "SHAREHOLDER",
    },
  });
  console.log("Inserted Shareholder User");

  console.log("✅ All data inserted successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });