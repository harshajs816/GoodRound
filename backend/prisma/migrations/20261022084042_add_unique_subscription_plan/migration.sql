/*
  Warnings:

  - A unique constraint covering the columns `[name,billingInterval]` on the table `SubscriptionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_billingInterval_key" ON "SubscriptionPlan"("name", "billingInterval");
