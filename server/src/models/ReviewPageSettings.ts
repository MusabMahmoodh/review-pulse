import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Teacher } from "./Teacher";

@Entity("review_page_settings")
export class ReviewPageSettings {
  @PrimaryColumn()
  teacherId!: string;

  @Column({ type: "text", default: "We Value Your Feedback" })
  welcomeMessage!: string;

  @Column({ type: "varchar", length: 7, default: "#3b82f6" })
  primaryColor!: string; // Hex color

  @Column({ type: "varchar", length: 7, default: "#1e40af" })
  secondaryColor!: string; // Hex color

  @Column({ type: "varchar", length: 7, default: "#f3f4f6" })
  backgroundColor!: string; // Hex color

  @Column({ type: "varchar", length: 20, default: "default" })
  designVariation!: string; // "default", "modern", "minimal", "elegant", etc.

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToOne(() => Teacher, (teacher) => teacher.reviewPageSettings)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;
}








