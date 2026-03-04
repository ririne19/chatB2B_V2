import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  // Une seule "société" : ENTREPRISE DEMO — côté support (vendeur) et côté client
  const supportOrg = await prisma.organization.upsert({
    where: { slug: "entreprise-demo-support" },
    update: { name: "ENTREPRISE DEMO SUPPORT", isAdminCompany: true },
    create: { name: "ENTREPRISE DEMO SUPPORT", slug: "entreprise-demo-support", isAdminCompany: true },
  });

  const clientOrg = await prisma.organization.upsert({
    where: { slug: "entreprise-demo-client" },
    update: { name: "ENTREPRISE DEMO CLIENT" },
    create: { name: "ENTREPRISE DEMO CLIENT", slug: "entreprise-demo-client", isAdminCompany: false },
  });

  const adminSupport = await prisma.user.upsert({
    where: { email: "admin@entreprise-demo.com" },
    update: {},
    create: {
      email: "admin@entreprise-demo.com",
      password: await bcrypt.hash("Admin123!", BCRYPT_ROUNDS),
      firstName: "Admin",
      lastName: "Support",
      role: "ADMIN",
      organizationId: supportOrg.id,
    },
  });

  const userSupport = await prisma.user.upsert({
    where: { email: "user@entreprise-demo.com" },
    update: {},
    create: {
      email: "user@entreprise-demo.com",
      password: await bcrypt.hash("User123!", BCRYPT_ROUNDS),
      firstName: "User",
      lastName: "Support",
      role: "MEMBER",
      organizationId: supportOrg.id,
    },
  });

  const adminClient = await prisma.user.upsert({
    where: { email: "client@entreprise-demo.com" },
    update: {},
    create: {
      email: "client@entreprise-demo.com",
      password: await bcrypt.hash("Admin123!", BCRYPT_ROUNDS),
      firstName: "Client",
      lastName: "Demo",
      role: "ADMIN",
      organizationId: clientOrg.id,
    },
  });

  const userClient = await prisma.user.upsert({
    where: { email: "user@client-demo.com" },
    update: {},
    create: {
      email: "user@client-demo.com",
      password: await bcrypt.hash("User123!", BCRYPT_ROUNDS),
      firstName: "User",
      lastName: "Client",
      role: "MEMBER",
      organizationId: clientOrg.id,
    },
  });

  // Nettoyer les conversations existantes (cascade supprime les messages)
  await prisma.conversation.deleteMany({});

  // Client (ENTREPRISE DEMO CLIENT) parle au support (ENTREPRISE DEMO SUPPORT)
  const conv1 = await prisma.conversation.create({
    data: {
      title: "Demande support",
      organizationId: clientOrg.id,
      partnerOrganizationId: supportOrg.id,
    },
  });

  await prisma.message.createMany({
    data: [
      { content: "Bonjour, j'ai une question sur ma commande.", conversationId: conv1.id, senderId: adminClient.id },
      { content: "Bonjour ! Je vous réponds sous peu.", conversationId: conv1.id, senderId: adminSupport.id },
      { content: "Parfait, merci.", conversationId: conv1.id, senderId: userClient.id },
    ],
  });

  const conv2 = await prisma.conversation.create({
    data: {
      title: "Support technique",
      organizationId: clientOrg.id,
      partnerOrganizationId: supportOrg.id,
    },
  });

  await prisma.message.createMany({
    data: [
      { content: "Nous avons un souci avec l'intégration.", conversationId: conv2.id, senderId: userClient.id },
      { content: "Notre équipe regarde et vous recontacte sous 24h.", conversationId: conv2.id, senderId: adminSupport.id },
    ],
  });

  // Conversation interne Support (sans partenaire)
  const convInternal = await prisma.conversation.create({
    data: {
      title: "Discussion interne",
      organizationId: supportOrg.id,
    },
  });

  await prisma.message.createMany({
    data: [
      { content: "Bienvenue sur le chat ENTREPRISE DEMO.", conversationId: convInternal.id, senderId: adminSupport.id },
      { content: "Merci !", conversationId: convInternal.id, senderId: userSupport.id },
    ],
  });

  console.log("Seed OK:", {
    organizations: [
      { slug: supportOrg.slug, name: supportOrg.name, isAdminCompany: true },
      { slug: clientOrg.slug, name: clientOrg.name, isAdminCompany: false },
    ],
    users: [
      adminSupport.email,
      userSupport.email,
      adminClient.email,
      userClient.email,
    ],
    conversations: [conv1.title, conv2.title, convInternal.title],
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
