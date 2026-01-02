import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.book.create({
    data: {
      isbn: "9780545582889",
      title: "Harry Potter and the Philosopher's Stone",
      author: "J. K. Rowling",
      genre: "Fantasy",
      price: 10.99,
      stock: 50
    }
  })
  
  await prisma.book.create({
    data: {
      isbn: "9780155658110",
      title: "1984",
      author: "George Orwell",
      genre: "Classics",
      price: 8.99,
      stock: 100
    }
  })
  
    await prisma.book.create({
    data: {
      isbn: "9780140430721",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      genre: "Classics",
      price: 12.50,
      stock: 25
    }
  })

  console.log("Kitaplar veritabanına başarıyla eklendi!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })