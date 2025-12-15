import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("google_integrations")
export class GoogleIntegration {
  @PrimaryColumn()
  restaurantId!: string;

  @Column()
  googleAccountId!: string; // The Google account that owns the business (e.g., "accounts/123456789")

  @Column()
  locationId!: string; // Google Business Profile location ID (e.g., "locations/987654321")

  @Column({ type: "text" })
  accessToken!: string; // Encrypted access token

  @Column({ type: "text" })
  refreshToken!: string; // Encrypted refresh token

  @Column()
  tokenExpiry!: Date;

  @Column({ nullable: true, type: "timestamp" })
  lastSyncedAt?: Date; // For incremental sync

  @Column({ default: "active" })
  status!: "active" | "expired" | "revoked";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.googleIntegration)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}


