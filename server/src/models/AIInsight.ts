import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";
import { Organization } from "./Organization";
import { Form } from "./Form";

@Entity("ai_insights")
export class AIInsight {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  teacherId?: string; // Optional: insight can be for a teacher or organization

  @Column({ nullable: true })
  organizationId?: string; // Optional: insight can be for an organization

  @Column({ nullable: true })
  formId?: string; // Optional: insight can be for a specific form (form-wise) or null (global)

  @Column({ type: "text" })
  summary!: string;

  @Column("simple-array")
  recommendations!: string[];

  @Column()
  sentiment!: "positive" | "neutral" | "negative";

  @Column("simple-array")
  keyTopics!: string[];

  // Enhanced insight fields
  @Column({ type: "jsonb", nullable: true })
  executiveSummary?: {
    positiveSentiment?: string;
    overallRating?: number;
    totalFeedback?: number;
    trend?: "improving" | "declining" | "stable";
  };

  @Column({ type: "jsonb", nullable: true })
  performanceMetrics?: {
    teaching: number;
    communication: number;
    material: number;
  };

  @Column({ type: "jsonb", nullable: true })
  keyStrengths?: Array<{
    title: string;
    description: string;
    rating: number;
  }>;

  @Column({ type: "jsonb", nullable: true })
  areasForImprovement?: Array<{
    title: string;
    description: string;
    supportingReviews?: string[];
  }>;

  @Column({ type: "jsonb", nullable: true })
  studentStruggles?: Array<{
    topic: string;
    description: string;
    frequency?: number;
  }>;

  @CreateDateColumn()
  generatedAt!: Date;

  // Relations
  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: "teacherId" })
  teacher?: Teacher;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @ManyToOne(() => Form, { nullable: true })
  @JoinColumn({ name: "formId" })
  form?: Form;
}














