import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("external_reviews")
export class ExternalReview {
  @PrimaryColumn()
  id!: string;

  @Column()
  restaurantId!: string;

  @Column()
  platform!: "google" | "facebook" | "instagram";

  @Column()
  author!: string;

  @Column("int")
  rating!: number;

  @Column({ type: "text" })
  comment!: string;

  @Column()
  reviewDate!: Date;

  @CreateDateColumn()
  syncedAt!: Date;

  // Relations
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.externalReviews)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}

