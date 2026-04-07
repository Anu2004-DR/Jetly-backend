const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateKey = (from, to, date) => {
  return `${from}-${to}-${date}`;
};

async function main() {
  const date = "2026-04-10";
  const searchKey = generateKey("BLR", "DEL", date);


  await prisma.flight.createMany({
    data: [
      {
        flightNo: "6E101",
        airline: "IndiGo",
        fromCity: "BLR",
        toCity: "DEL",
        departure: new Date("2026-04-10T06:30:00"),
        arrival: new Date("2026-04-10T11:50:00"),
        duration: "5h 20m",
        stops: 1,
        price: 5980,
        seats: 300,
        searchKey,
        cachedAt: new Date()
      },
      {
        flightNo: "AI202",
        airline: "Air India",
        fromCity: "BLR",
        toCity: "DEL",
        departure: new Date("2026-04-10T10:15:00"),
        arrival: new Date("2026-04-10T13:25:00"),
        duration: "3h 10m",
        stops: 0,
        price: 6450,
        seats: 220,
        searchKey,
        cachedAt: new Date()
      },
      {
        flightNo: "UK303",
        airline: "Vistara",
        fromCity: "BLR",
        toCity: "DEL",
        departure: new Date("2026-04-10T08:10:00"),
        arrival: new Date("2026-04-10T10:55:00"),
        duration: "2h 45m",
        stops: 0,
        price: 7200,
        seats: 180,
        searchKey,
        cachedAt: new Date()
      }
    ],
    skipDuplicates: true
  });

  await prisma.bus.createMany({
    data: [
      {
        busName: "KSRTC",
        fromCity: "BLR",   // ✅ FIXED
        toCity: "HYD",
        departure: "21:30",
        arrival: "06:30",
        price: 1200,
        seats: 30
      },
      {
        busName: "Orange Travels",
        fromCity: "BLR",
        toCity: "MAA",
        departure: "22:00",
        arrival: "05:30",
        price: 1000,
        seats: 30
      }
    ],
    skipDuplicates: true
  });

  
  await prisma.train.createMany({
  data: [
    {
      trainNumber: "12627",
      trainName: "Karnataka Express",
      fromCity: "Bangalore",
      toCity: "Hyderabad",
      departure: "19:20",
      arrival: "07:00",
      price: 900,
      seats: 120
    },
    {
      trainNumber: "12007",
      trainName: "Shatabdi Express",
      fromCity: "Bangalore",
      toCity: "Chennai",
      departure: "06:00",
      arrival: "10:45",
      price: 1100,
      seats: 100
    }
  ],skipDuplicates: true
});

  console.log("🌱 Database seeded successfully!");
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });