import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { Organization } from "./Organization";

@Entity("organization_auth")
export class OrganizationAuth {
  @PrimaryColumn()
  organizationId!: string;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @OneToOne(() => Organization, (organization) => organization.auth)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;
}
