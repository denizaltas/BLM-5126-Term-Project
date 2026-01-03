import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const Sepet = [
    { bookIsbn: "9780140430721", quantity: 1, price: 8.99 }
  ];

  const calculatedTotal = Sepet.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const order = await prisma.order.create({
    data: {     
      userFirstName: "Deniz",
      userLastName: "Altas",
      userEmail: "deniz@gmail.com",
      status: "PAID",
      total: calculatedTotal, 
      items: {
        create: Sepet
      }
    },
    include: { items: true }
  })

  console.log(`Seeded Order #${order.id} for ${order.userEmail}`)
  console.log(`Total Calculated: $${order.total}`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })