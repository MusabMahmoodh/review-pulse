import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";
import { Class } from "./Class";

@Entity("student_feedback")
export class StudentFeedback {
  @PrimaryColumn()
  id!: string;

  @Column()
  teacherId!: string;

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
  @ManyToOne(() => Teacher, (teacher) => teacher.feedback)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;

  @ManyToOne(() => Class, (classEntity) => classEntity.feedback, { nullable: true })
  @JoinColumn({ name: "classId" })
  class?: Class;
}



