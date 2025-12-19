import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("ai_insights")
export class AIInsight {
  @PrimaryColumn()
  id!: string;

  @Column()
  restaurantId!: string;

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
  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}













