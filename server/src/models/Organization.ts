import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from "typeorm";
import { Teacher } from "./Teacher";
import { OrganizationAuth } from "./OrganizationAuth";
import { Subscription } from "./Subscription";

@Entity("organizations")
export class Organization {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ default: "active" })
  status!: "active" | "blocked";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToOne(() => OrganizationAuth, (auth) => auth.organization)
  auth!: OrganizationAuth;

  @OneToMany(() => Teacher, (teacher) => teacher.organization)
  teachers!: Teacher[];

  @OneToMany(() => Subscription, (subscription) => subscription.organization)
  subscriptions!: Subscription[];
}
