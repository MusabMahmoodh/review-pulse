import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Organization } from "./Organization";
import { Teacher } from "./Teacher";

@Entity("subscriptions")
export class Subscription {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  organizationId?: string; // For organization subscriptions

  @Column({ nullable: true })
  teacherId?: string; // For individual teacher subscriptions

  @Column()
  plan!: "free" | "basic" | "premium" | "enterprise";

  @Column()
  status!: "active" | "cancelled" | "expired" | "trial";

  @Column()
  startDate!: Date;

  @Column({ type: "timestamp", nullable: true })
  endDate?: Date; // null/undefined means forever

  @Column("decimal", { precision: 10, scale: 2 })
  monthlyPrice!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 15000 })
  defaultPrice!: number; // Default monthly price (LKR 15,000) - will be set in code

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  discount?: number; // Discount amount

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  finalPrice?: number; // Final price after discount

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  amountPaid?: number; // Amount actually paid

  // Relations
  @ManyToOne(() => Organization, (org) => org.subscriptions, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @ManyToOne(() => Teacher, (teacher) => teacher.subscriptions, { nullable: true })
  @JoinColumn({ name: "teacherId" })
  teacher?: Teacher;
}







