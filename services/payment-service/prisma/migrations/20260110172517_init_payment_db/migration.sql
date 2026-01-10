-- CreateTable
CREATE TABLE "ValidCard" (
    "id" SERIAL NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "cardHolder" TEXT NOT NULL,
    "cvv" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,

    CONSTRAINT "ValidCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValidCard_cardNumber_key" ON "ValidCard"("cardNumber");
