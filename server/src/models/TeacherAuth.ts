import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { Teacher } from "./Teacher";

@Entity("teacher_auth")
export class TeacherAuth {
  @PrimaryColumn()
  teacherId!: string;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @OneToOne(() => Teacher, (teacher) => teacher.auth)
  @JoinColumn({ name: "teacherId" })
  teacher!: Teacher;
}
