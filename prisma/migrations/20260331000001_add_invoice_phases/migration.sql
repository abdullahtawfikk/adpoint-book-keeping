-- Add PARTIALLY_PAID to InvoiceStatus enum
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';

-- Add PaymentStructure enum
DO $$ BEGIN
  CREATE TYPE "PaymentStructure" AS ENUM ('FULL', 'PARTIAL', 'SCHEDULED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add PhaseStatus enum
DO $$ BEGIN
  CREATE TYPE "PhaseStatus" AS ENUM ('UNPAID', 'PAID');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add paymentStructure column to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentStructure" "PaymentStructure" NOT NULL DEFAULT 'FULL';

-- Create invoice_phases table
CREATE TABLE IF NOT EXISTS "invoice_phases" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "PhaseStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_phases_pkey" PRIMARY KEY ("id")
);

-- Add foreign key (safe to run multiple times via DO block)
DO $$ BEGIN
  ALTER TABLE "invoice_phases" ADD CONSTRAINT "invoice_phases_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
