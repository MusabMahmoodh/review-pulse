import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";
import { Organization } from "./Organization";
import { FormTag } from "./FormTag";

@Entity("forms")
export class Form {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string; // Form name (e.g., "General Feedback Form", "Course Evaluation")

  @Column({ type: "text", nullable: true })
  description?: string; // Optional description

  @Column({ default: false })
  isGeneral!: boolean; // true for the special general form (unarchivable), false for custom forms

  @Column({ nullable: true })
  teacherId?: string; // null for organization-level forms

  @Column({ nullable: true })
  organizationId?: string; // null for teacher-level forms

  @Column({ default: true })
  isActive!: boolean; // Allow soft deletion (but general form cannot be archived)

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

  @OneToMany(() => FormTag, (formTag) => formTag.form, { cascade: true })
  tags!: FormTag[];
}

