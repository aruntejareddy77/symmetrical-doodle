import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding Neon cloud database...');

  const hash = await bcrypt.hash('password123', 10);

  // Create users
  const users = [
    { name: 'VizagOps Admin', email: 'admin@vizagops.gov.in', passwordHash: hash, role: 'ADMIN' as const },
    { name: 'GVMC Admin', email: 'admin@gvmc.gov.in', passwordHash: hash, role: 'ADMIN' as const },
    { name: 'Visakhapatnam Citizen', email: 'citizen@gmail.com', passwordHash: hash, role: 'CITIZEN' as const },
    { name: 'Dispatch Operator', email: 'operator@gvmc.gov.in', passwordHash: hash, role: 'ADMIN' as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log(`  ✅ User: ${u.email} (${u.role})`);
  }

  // Create field teams
  const teams = [
    { name: 'Alpha Response Unit', members: ['Rajesh K', 'Suresh P'], currentLat: 17.7231, currentLng: 83.3012 },
    { name: 'Bravo Infra Team', members: ['Venkat R', 'Priya S'], currentLat: 17.6868, currentLng: 83.2185 },
    { name: 'Charlie Water Works', members: ['Lakshmi N', 'Ravi T'], currentLat: 17.7100, currentLng: 83.2950 },
    { name: 'Delta Electrical Crew', members: ['Srinivas M', 'Anil K'], currentLat: 17.7350, currentLng: 83.3200 },
    { name: 'Echo Sanitation Squad', members: ['Ramesh B', 'Gopi V'], currentLat: 17.6950, currentLng: 83.2400 },
  ];

  for (const t of teams) {
    const existing = await prisma.fieldTeam.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.fieldTeam.create({ data: t });
      console.log(`  ✅ Team: ${t.name}`);
    }
  }

  console.log('\n🎉 Neon cloud database seeded successfully!');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
