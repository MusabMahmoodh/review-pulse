import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Teacher } from "./Teacher";
import { Organization } from "./Organization";
import { Class } from "./Class";
import { FeedbackTag } from "./FeedbackTag";

@Entity("student_feedback")
export class StudentFeedback {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  teacherId?: string; // Optional: feedback can be for a specific teacher or organization

  @Column({ nullable: true })
  organizationId?: string; // Optional: feedback can be for an organization

  @Column({ nullable: true })
  classId?: string; // Optional: feedback can be associated with a specific class

  @Column({ nullable: true })
  studentName?: string;

  @Column({ nullable: true })
  studentContact?: string;

  @Column({ nullable: true })
  studentId?: string; // Optional student ID

  @Column("int")
  teachingRating!: number; // 1-5

  @Column("int")
  communicationRating!: number; // 1-5

  @Column("int")
  materialRating!: number; // 1-5 (quality of teaching materials/content)

  @Column("int")
  overallRating!: number; // 1-5

  @Column({ type: "text", nullable: true })
  suggestions?: string;

  @Column({ type: "text", nullable: true })
  courseName?: string; // e.g., "Mathematics 101", "Physics"

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Teacher, (teacher) => teacher.feedback, { nullable: true })
  @JoinColumn({ name: "teacherId" })
  teacher?: Teacher;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @ManyToOne(() => Class, (classEntity) => classEntity.feedback, { nullable: true })
  @JoinColumn({ name: "classId" })
  class?: Class;

  @OneToMany(() => FeedbackTag, (feedbackTag) => feedbackTag.feedback)
  tags!: FeedbackTag[];
}



