import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ExternalReview } from "./ExternalReview";
import { Tag } from "./Tag";

@Entity("external_review_tags")
export class ExternalReviewTag {
  @PrimaryColumn()
  id!: string;

  @Column()
  reviewId!: string;

  @Column()
  tagId!: string;

  // Relations
  @ManyToOne(() => ExternalReview, (review) => review.tags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reviewId" })
  review!: ExternalReview;

  @ManyToOne(() => Tag, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tagId" })
  tag!: Tag;
}

