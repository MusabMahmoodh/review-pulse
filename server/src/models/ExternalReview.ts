import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";

@Entity("external_reviews")
export class ExternalReview {
  @PrimaryColumn()
  id!: string;

  @Column()
  teacherId!: string;

  @Column()
  platform!: "google" | "facebook" | "instagram";

  @Column()
  author!: string;

  @Column("int")
  rating!: number;

  @Column({ type: "text" })
  comment!: string;

  @Column()
  reviewDate!: Date;

  @CreateDateColumn()
  syncedAt!: Date;

  // Relations
  @ManyToOne(() => Teacher, (teacher) => teacher.externalReviews)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;
}
