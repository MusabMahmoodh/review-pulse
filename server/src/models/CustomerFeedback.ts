import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("customer_feedback")
export class CustomerFeedback {
  @PrimaryColumn()
  id!: string;

  @Column()
  restaurantId!: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerContact?: string;

  @Column("int")
  foodRating!: number; // 1-5

  @Column("int")
  staffRating!: number; // 1-5

  @Column("int")
  ambienceRating!: number; // 1-5

  @Column("int")
  overallRating!: number; // 1-5

  @Column({ type: "text", nullable: true })
  suggestions?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.feedback)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}














