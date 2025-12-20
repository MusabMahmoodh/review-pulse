import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";
import { Organization } from "./Organization";
import { StudentFeedback } from "./StudentFeedback";

@Entity("classes")
export class Class {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string; // e.g., "Mathematics 101", "Physics Advanced", "Grade 5A"

  @Column({ nullable: true })
  description?: string;

  @Column()
  teacherId!: string; // Always belongs to a teacher

  @Column({ nullable: true })
  organizationId?: string; // Optional: if teacher belongs to an organization

  @Column()
  qrCode!: string; // Unique QR code identifier for this class

  @Column({ default: "active" })
  status!: "active" | "archived";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Teacher, (teacher) => teacher.classes)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;

  @ManyToOne(() => Organization, (org) => org.classes, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @OneToMany(() => StudentFeedback, (feedback) => feedback.class)
  feedback!: StudentFeedback[];
}

