import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Form } from "./Form";
import { Tag } from "./Tag";

@Entity("form_tags")
export class FormTag {
  @PrimaryColumn()
  id!: string;

  @Column()
  formId!: string;

  @Column()
  tagId!: string;

  // Relations
  @ManyToOne(() => Form, (form) => form.tags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "formId" })
  form!: Form;

  @ManyToOne(() => Tag, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tagId" })
  tag!: Tag;
}




