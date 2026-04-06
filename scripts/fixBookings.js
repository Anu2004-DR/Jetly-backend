const prisma = require("../src/config/prisma");


async function fixBookings() {
  try {
    console.log("🔧 Fixing bookings with NULL userId...");

    // 1. Get a valid user
    const user = await prisma.user.findFirst();

    if (!user) {
      console.log("❌ No users found. Create a user first.");
      return;
    }

    console.log("✅ Using userId:", user.id);

    // 2. Find broken bookings
    const brokenBookings = await prisma.booking.findMany({
      where: {
        userId: null,
      },
    });

    console.log(`🔍 Found ${brokenBookings.length} broken bookings`);

    if (brokenBookings.length === 0) {
      console.log("✅ No fixes needed");
      return;
    }

    // 3. Update all
    const result = await prisma.booking.updateMany({
      where: {
        userId: null,
      },
      data: {
        userId: user.id,
      },
    });

    console.log(`🎉 Fixed ${result.count} bookings`);

  } catch (error) {
    console.error("❌ Error fixing bookings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBookings();