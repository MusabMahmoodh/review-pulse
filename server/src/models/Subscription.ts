import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("subscriptions")
export class Subscription {
  @PrimaryColumn()
  id!: string;

  @Column()
  restaurantId!: string;

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

  // Relations
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.subscriptions)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}







