import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";
import { Organization } from "./Organization";

@Entity("tags")
export class Tag {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string; // e.g., "Clear Explanations", "Engaging", "Too Fast", "Helpful Materials"

  @Column({ nullable: true })
  description?: string; // Optional description for the tag

  @Column({ nullable: true })
  color?: string; // Hex color code for UI display (e.g., "#3b82f6")

  @Column({ nullable: true })
  teacherId?: string; // null for organization-level tags

  @Column({ nullable: true })
  organizationId?: string; // null for teacher-level tags

  @Column({ default: true })
  isActive!: boolean; // Allow soft deletion

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Teacher, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "teacherId" })
  teacher?: Teacher;

  @ManyToOne(() => Organization, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;
}

