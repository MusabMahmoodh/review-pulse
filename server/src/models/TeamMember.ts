import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("team_members")
export class TeamMember {
  @PrimaryColumn()
  id!: string;

  @Column()
  restaurantId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  role?: string; // e.g., "Manager", "Chef", "Server", etc.

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}




