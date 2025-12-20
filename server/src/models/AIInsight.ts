import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";

@Entity("ai_insights")
export class AIInsight {
  @PrimaryColumn()
  id!: string;

  @Column()
  teacherId!: string;

  @Column({ type: "text" })
  summary!: string;

  @Column("simple-array")
  recommendations!: string[];

  @Column()
  sentiment!: "positive" | "neutral" | "negative";

  @Column("simple-array")
  keyTopics!: string[];

  @CreateDateColumn()
  generatedAt!: Date;

  // Relations
  @ManyToOne(() => Teacher)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;
}














