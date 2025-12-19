import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("meta_integrations")
export class MetaIntegration {
  @PrimaryColumn()
  restaurantId!: string;

  @Column()
  pageId!: string; // Facebook Page ID

  @Column({ nullable: true })
  instagramBusinessAccountId?: string; // Instagram Business Account ID (optional)

  @Column({ type: "text" })
  accessToken!: string; // Encrypted Page Access Token

  @Column({ type: "text", nullable: true })
  userAccessToken?: string; // Encrypted User Access Token (for initial auth)

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
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.metaIntegration)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}








