import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { Organization } from "./Organization";
import { StudentFeedback } from "./StudentFeedback";
import { TeacherAuth } from "./TeacherAuth";
import { AIInsight } from "./AIInsight";
import { ActionableItem } from "./ActionableItem";
import { ExternalReview } from "./ExternalReview";
import { ReviewPageSettings } from "./ReviewPageSettings";
import { Subscription } from "./Subscription";
import { TeamMember } from "./TeamMember";

@Entity("teachers")
export class Teacher {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  subject?: string; // e.g., "Mathematics", "Science", etc.

  @Column({ nullable: true })
  department?: string; // e.g., "Science Department", "Arts Department"

  @Column()
  qrCode!: string;

  @Column({ nullable: true })
  organizationId?: string; // null for standalone teachers

  @Column({ default: "active" })
  status!: "active" | "blocked";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.teachers, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;

  @OneToOne(() => TeacherAuth, (auth) => auth.teacher)
  auth!: TeacherAuth;

  @OneToMany(() => StudentFeedback, (feedback) => feedback.teacher)
  feedback!: StudentFeedback[];

  @OneToMany(() => ExternalReview, (review) => review.teacher)
  externalReviews!: ExternalReview[];

  @OneToMany(() => AIInsight, (insight) => insight.teacher)
  aiInsights!: AIInsight[];

  @OneToMany(() => ActionableItem, (item) => item.teacher)
  actionableItems!: ActionableItem[];

  @OneToOne(() => ReviewPageSettings, (settings) => settings.teacher)
  reviewPageSettings?: ReviewPageSettings;

  @OneToMany(() => Subscription, (subscription) => subscription.teacher)
  subscriptions!: Subscription[];

  @OneToMany(() => TeamMember, (member) => member.teacher)
  teamMembers!: TeamMember[];
}
