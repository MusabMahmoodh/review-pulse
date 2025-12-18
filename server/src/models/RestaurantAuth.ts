import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("restaurant_auth")
export class RestaurantAuth {
  @PrimaryColumn()
  restaurantId!: string;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @OneToOne(() => Restaurant, (restaurant) => restaurant.auth)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}











