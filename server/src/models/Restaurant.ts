import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from "typeorm";
import { CustomerFeedback } from "./CustomerFeedback";
import { ExternalReview } from "./ExternalReview";
import { RestaurantAuth } from "./RestaurantAuth";
import { Subscription } from "./Subscription";

@Entity("restaurants")
export class Restaurant {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column()
  qrCode!: string;

  @Column("simple-array", { default: "" })
  socialKeywords!: string[];

  @Column({ default: "active" })
  status!: "active" | "blocked";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToOne(() => RestaurantAuth, (auth) => auth.restaurant)
  auth!: RestaurantAuth;

  @OneToMany(() => CustomerFeedback, (feedback) => feedback.restaurant)
  feedback!: CustomerFeedback[];

  @OneToMany(() => ExternalReview, (review) => review.restaurant)
  externalReviews!: ExternalReview[];

  @OneToMany(() => Subscription, (subscription) => subscription.restaurant)
  subscriptions!: Subscription[];
}

