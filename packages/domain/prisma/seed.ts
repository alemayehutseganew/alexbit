import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const shareholderPassword = "Primehorizon@2026";
const superAdminPassword = "SuperAdmin@2026";
const clientPassword = "Client@2026";

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
];

async function main() {
  const shareholderPasswordHash = await bcrypt.hash(shareholderPassword, 10);
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 10);
  const clientPasswordHash = await bcrypt.hash(clientPassword, 10);

  await prisma.$transaction(async (transaction) => {
    // 🛑 PROPER WIPE ORDER (Children first, Parents last) 🛑
    console.log("Wiping old data...");
    await transaction.project.deleteMany();
    await transaction.rfpRequest.deleteMany();
    await transaction.shareholderDocument.deleteMany();
    await transaction.shareholderProfile.deleteMany();
    await transaction.user.deleteMany();
    await transaction.tenant.deleteMany();
    console.log("Database wiped.");

    // 1. Seed the 17 Shareholder Profiles
    console.log("Seeding 17 shareholders...");
    for (const shareholder of shareholders) {
      const tenant = await transaction.tenant.create({
        data: { name: shareholder.name, type: "SHAREHOLDER" },
      });

      await transaction.shareholderProfile.create({
        data: {
          tenantId: tenant.id,
          contactNo: shareholder.contact || null,
          tinNumber: shareholder.tin || null,
          numberOfShares: shareholder.shares,
          totalContribution: shareholder.contribution,
          datePaid: new Date(`${shareholder.date}T00:00:00.000Z`),
        },
      });
    }

    // 2. Create ONE Shared Shareholder User
    console.log("Creating shared shareholder user...");
    const sharedShareholderTenant = await transaction.tenant.create({
      data: { name: "PrimeHorizon Shareholders", type: "SHAREHOLDER" },
    });

    await transaction.user.create({
      data: {
        tenantId: sharedShareholderTenant.id,
        email: "shareholder@primehorizon.com",
        firstName: "All",
        lastName: "Shareholders",
        passwordHash: shareholderPasswordHash,
        role: "SHAREHOLDER",
      },
    });

    // 3. Create Superadmin User
    console.log("Creating superadmin user...");
    const adminTenant = await transaction.tenant.create({
      data: { name: "PrimeHorizon Admin", type: "INTERNAL" },
    });

    await transaction.user.create({
      data: {
        tenantId: adminTenant.id,
        email: "superadmin@primehorizon.com",
        firstName: "Super",
        lastName: "Admin",
        passwordHash: superAdminPasswordHash,
        role: "ADMIN",
      },
    });

    // 4. Create dummy Client user
    console.log("Creating client user...");
    const clientTenant = await transaction.tenant.create({
      data: { name: "Example Client", type: "CLIENT" },
    });

    await transaction.user.create({
      data: {
        tenantId: clientTenant.id,
        email: "client@example.com",
        firstName: "Alemayehu",
        lastName: "Client",
        passwordHash: clientPasswordHash,
        role: "CLIENT",
      },
    });

    // 5. Create RFP and Project for the CLIENT
    console.log("Creating dummy project...");
    await transaction.rfpRequest.create({
      data: {
        tenantId: clientTenant.id,
        organization: "Example Client",
        contactName: "Alemayehu Client",
        contactEmail: "client@example.com",
        phone: "+919078260731",
        sector: "IT Support and Networking",
        projectDetails: "Enterprise-wide network infrastructure upgrade including routers, switches, and security appliances across all branch offices.",
        budgetRange: "$50,000 - $100,000",
        timeline: "6 months",
        status: "ACCEPTED",
      },
    });

    await transaction.project.create({
      data: {
        tenantId: clientTenant.id,
        title: "Enterprise Network Upgrade",
        description: "Enterprise-wide network infrastructure upgrade including routers, switches, and security appliances across all branch offices.",
        status: "IN_PROGRESS",
        startDate: new Date("2026-11-01T00:00:00.000Z"),
        endDate: new Date("2027-04-30T00:00:00.000Z"),
      },
    });
  });
  console.log("Seed completed successfully!");
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });