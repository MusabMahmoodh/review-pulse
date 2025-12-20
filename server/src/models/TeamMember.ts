import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Organization } from "./Organization";
import { Teacher } from "./Teacher";

@Entity("team_members")
export class TeamMember {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  organizationId?: string; // For organization team members

  @Column()
  teacherId!: string; // For teacher's team members (always required)

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  role?: string; // e.g., "Teaching Assistant", "Coordinator", etc.

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;
}








