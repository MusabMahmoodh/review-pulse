import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { StudentFeedback } from "./StudentFeedback";
import { Tag } from "./Tag";

@Entity("feedback_tags")
export class FeedbackTag {
  @PrimaryColumn()
  id!: string;

  @Column()
  feedbackId!: string;

  @Column()
  tagId!: string;

  // Relations
  @ManyToOne(() => StudentFeedback, (feedback) => feedback.tags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "feedbackId" })
  feedback!: StudentFeedback;

  @ManyToOne(() => Tag, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tagId" })
  tag!: Tag;
}

