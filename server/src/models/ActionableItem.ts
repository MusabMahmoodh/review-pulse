import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";

@Entity("actionable_items")
export class ActionableItem {
  @PrimaryColumn()
  id!: string;

  @Column()
  teacherId!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ default: false })
  completed!: boolean;

  @Column()
  sourceType!: "comment" | "ai_suggestion";

  @Column()
  sourceId!: string; // ID of StudentFeedback, ExternalReview, or AIInsight

  @Column({ nullable: true })
  sourceText?: string; // Store the original text for reference

  @Column({ nullable: true })
  assignedTo?: string; // ID of TeamMember

  @Column({ type: "timestamp", nullable: true })
  deadline?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Teacher)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;
}

