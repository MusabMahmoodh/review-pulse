import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("admins")
export class Admin {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  role!: "super_admin" | "admin";

  @CreateDateColumn()
  createdAt!: Date;
}







