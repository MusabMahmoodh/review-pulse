import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";
import { Organization } from "./Organization";

@Entity("ai_insights")
export class AIInsight {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  teacherId?: string; // Optional: insight can be for a teacher or organization

  @Column({ nullable: true })
  organizationId?: string; // Optional: insight can be for an organization

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
  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: "teacherId" })
  teacher?: Teacher;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;
}














