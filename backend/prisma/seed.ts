import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  const acme = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: { isAdminCompany: true },
    create: { name: "Acme Corp", slug: "acme", isAdminCompany: true },
  });

  const techstart = await prisma.organization.upsert({
    where: { slug: "techstart" },
    update: {},
    create: { name: "TechStart", slug: "techstart", isAdminCompany: false },
  });

  const adminAcme = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      password: await bcrypt.hash("Admin123!", BCRYPT_ROUNDS),
      firstName: "Admin",
      lastName: "Acme",
      role: "ADMIN",
      organizationId: acme.id,
    },
  });

  const userAcme = await prisma.user.upsert({
    where: { email: "user@acme.com" },
    update: {},
    create: {
      email: "user@acme.com",
      password: await bcrypt.hash("User123!", BCRYPT_ROUNDS),
      firstName: "User",
      lastName: "Acme",
      role: "MEMBER",
      organizationId: acme.id,
    },
  });

  const adminTechstart = await prisma.user.upsert({
    where: { email: "admin@techstart.com" },
    update: {},
    create: {
      email: "admin@techstart.com",
      password: await bcrypt.hash("Admin123!", BCRYPT_ROUNDS),
      firstName: "Admin",
      lastName: "TechStart",
      role: "ADMIN",
      organizationId: techstart.id,
    },
  });

  const userTechstart = await prisma.user.upsert({
    where: { email: "user@techstart.com" },
    update: {},
    create: {
      email: "user@techstart.com",
      password: await bcrypt.hash("User123!", BCRYPT_ROUNDS),
      firstName: "User",
      lastName: "TechStart",
      role: "MEMBER",
      organizationId: techstart.id,
    },
  });

  // Nettoyer les conversations existantes (cascade supprime les messages)
  await prisma.conversation.deleteMany({});

  // B2B : TechStart (client) parle à Acme (entreprise admin) - Conv "Demande partenaire"
  const convB2B1 = await prisma.conversation.create({
    data: {
      title: "Demande partenaire",
      organizationId: techstart.id,
      partnerOrganizationId: acme.id,
    },
  });

  await prisma.message.createMany({
    data: [
      { content: "Bonjour, nous souhaiterions devenir partenaire. Comment procéder ?", conversationId: convB2B1.id, senderId: adminTechstart.id },
      { content: "Bonjour ! Merci pour votre intérêt. Je vous envoie notre plaquette et un rendez-vous.", conversationId: convB2B1.id, senderId: adminAcme.id },
      { content: "Parfait, nous sommes disponibles la semaine prochaine.", conversationId: convB2B1.id, senderId: userTechstart.id },
    ],
  });

  // B2B : Autre conversation Acme <-> TechStart (Support)
  const convB2B2 = await prisma.conversation.create({
    data: {
      title: "Support technique",
      organizationId: techstart.id,
      partnerOrganizationId: acme.id,
    },
  });

  await prisma.message.createMany({
    data: [
      { content: "Nous avons un souci avec l'intégration API.", conversationId: convB2B2.id, senderId: userTechstart.id },
      { content: "Notre équipe regarde et vous recontacte sous 24h.", conversationId: convB2B2.id, senderId: adminAcme.id },
    ],
  });

  // Conversation interne Acme (sans partenaire)
  const convAcmeInternal = await prisma.conversation.create({
    data: {
      title: "Discussion interne Acme",
      organizationId: acme.id,
    },
  });

  await prisma.message.createMany({
    data: [
      { content: "Point équipe : bienvenue sur le chat B2B.", conversationId: convAcmeInternal.id, senderId: adminAcme.id },
      { content: "Merci !", conversationId: convAcmeInternal.id, senderId: userAcme.id },
    ],
  });

  console.log("Seed OK:", {
    organizations: [
      { slug: acme.slug, isAdminCompany: true },
      { slug: techstart.slug, isAdminCompany: false },
    ],
    users: [
      adminAcme.email,
      userAcme.email,
      adminTechstart.email,
      userTechstart.email,
    ],
    conversations: [
      convB2B1.title,
      convB2B2.title,
      convAcmeInternal.title,
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
