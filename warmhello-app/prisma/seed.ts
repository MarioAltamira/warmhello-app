import { PrismaClient } from "@prisma/client";
import { addDays, addHours, subDays } from "../lib/dates";
import { createCheckInToken } from "../lib/tokens";

const prisma = new PrismaClient();

async function main() {
  const subscriberEmail = "caregiver@example.com";

  const existingSubscriber = await prisma.subscriber.findUnique({
    where: { email: subscriberEmail },
  });

  if (existingSubscriber) {
    await prisma.subscriber.delete({
      where: { id: existingSubscriber.id },
    });
  }

  const subscriber = await prisma.subscriber.create({
    data: {
      email: subscriberEmail,
      fullName: "Caregiver Demo",
      phoneNumber: "+15551230001",
      subscriptionStatus: "TRIAL",
    },
  });

  const senior = await prisma.senior.create({
    data: {
      subscriberId: subscriber.id,
      firstName: "Margaret",
      lastName: "Johnson",
      phoneNumber: "+15551230002",
      timezone: "America/New_York",
      checkInHour: 9,
    },
  });

  await prisma.contact.createMany({
    data: [
      {
        subscriberId: subscriber.id,
        seniorId: senior.id,
        fullName: "David Johnson",
        relationship: "Son",
        phoneNumber: "+15551230003",
        priority: 1,
      },
      {
        subscriberId: subscriber.id,
        seniorId: senior.id,
        fullName: "Angela Rivera",
        relationship: "Neighbor",
        phoneNumber: "+15551230004",
        priority: 2,
      },
    ],
  });

  const previousScheduledFor = subDays(new Date(), 1);
  const upcomingScheduledFor = addHours(new Date(), 1);

  await prisma.checkIn.create({
    data: {
      subscriberId: subscriber.id,
      seniorId: senior.id,
      token: createCheckInToken(),
      status: "CONFIRMED",
      scheduledFor: previousScheduledFor,
      reminderAt: addHours(previousScheduledFor, 3),
      escalationAt: addHours(previousScheduledFor, 4),
      confirmedAt: addHours(previousScheduledFor, 1),
    },
  });

  const activeCheckIn = await prisma.checkIn.create({
    data: {
      subscriberId: subscriber.id,
      seniorId: senior.id,
      token: "demo-token",
      status: "PENDING",
      scheduledFor: upcomingScheduledFor,
      reminderAt: addHours(upcomingScheduledFor, 3),
      escalationAt: addHours(upcomingScheduledFor, 4),
    },
  });

  await prisma.alertJob.create({
    data: {
      checkInId: activeCheckIn.id,
      kind: "scheduled_seed_preview",
      status: "PENDING",
      payload: {
        note: "Seeded reminder and escalation workflow preview.",
        nextWindowDate: addDays(new Date(), 1).toISOString(),
      },
      runAt: activeCheckIn.reminderAt,
    },
  });

  console.log("Seed complete");
  console.log(`Subscriber ID: ${subscriber.id}`);
  console.log(`Senior ID: ${senior.id}`);
  console.log(`Demo token: ${activeCheckIn.token}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
