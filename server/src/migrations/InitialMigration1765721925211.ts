import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class InitialMigration1765721925211 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create restaurants table
    await queryRunner.createTable(
      new Table({
        name: "restaurants",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "email",
            type: "varchar",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "phone",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "address",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "qrCode",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "socialKeywords",
            type: "text",
            isNullable: true,
            default: "''",
          },
          {
            name: "status",
            type: "varchar",
            default: "'active'",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create restaurant_auth table
    await queryRunner.createTable(
      new Table({
        name: "restaurant_auth",
        columns: [
          {
            name: "restaurantId",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "email",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "passwordHash",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add foreign key for restaurant_auth
    await queryRunner.createForeignKey(
      "restaurant_auth",
      new TableForeignKey({
        columnNames: ["restaurantId"],
        referencedColumnNames: ["id"],
        referencedTableName: "restaurants",
        onDelete: "CASCADE",
      })
    );

    // Create customer_feedback table
    await queryRunner.createTable(
      new Table({
        name: "customer_feedback",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "restaurantId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "customerName",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "customerContact",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "foodRating",
            type: "int",
            isNullable: false,
          },
          {
            name: "staffRating",
            type: "int",
            isNullable: false,
          },
          {
            name: "ambienceRating",
            type: "int",
            isNullable: false,
          },
          {
            name: "overallRating",
            type: "int",
            isNullable: false,
          },
          {
            name: "suggestions",
            type: "text",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add foreign key for customer_feedback
    await queryRunner.createForeignKey(
      "customer_feedback",
      new TableForeignKey({
        columnNames: ["restaurantId"],
        referencedColumnNames: ["id"],
        referencedTableName: "restaurants",
        onDelete: "CASCADE",
      })
    );

    // Create external_reviews table
    await queryRunner.createTable(
      new Table({
        name: "external_reviews",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "restaurantId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "platform",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "author",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "rating",
            type: "int",
            isNullable: false,
          },
          {
            name: "comment",
            type: "text",
            isNullable: false,
          },
          {
            name: "reviewDate",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "syncedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add foreign key for external_reviews
    await queryRunner.createForeignKey(
      "external_reviews",
      new TableForeignKey({
        columnNames: ["restaurantId"],
        referencedColumnNames: ["id"],
        referencedTableName: "restaurants",
        onDelete: "CASCADE",
      })
    );

    // Create ai_insights table
    await queryRunner.createTable(
      new Table({
        name: "ai_insights",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "restaurantId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "summary",
            type: "text",
            isNullable: false,
          },
          {
            name: "recommendations",
            type: "text",
            isNullable: true,
            default: "''",
          },
          {
            name: "sentiment",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "keyTopics",
            type: "text",
            isNullable: true,
            default: "''",
          },
          {
            name: "generatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add foreign key for ai_insights
    await queryRunner.createForeignKey(
      "ai_insights",
      new TableForeignKey({
        columnNames: ["restaurantId"],
        referencedColumnNames: ["id"],
        referencedTableName: "restaurants",
        onDelete: "CASCADE",
      })
    );

    // Create admins table
    await queryRunner.createTable(
      new Table({
        name: "admins",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "email",
            type: "varchar",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "passwordHash",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "role",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create subscriptions table
    await queryRunner.createTable(
      new Table({
        name: "subscriptions",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "restaurantId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "plan",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "startDate",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "endDate",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "monthlyPrice",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Add foreign key for subscriptions
    await queryRunner.createForeignKey(
      "subscriptions",
      new TableForeignKey({
        columnNames: ["restaurantId"],
        referencedColumnNames: ["id"],
        referencedTableName: "restaurants",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable("subscriptions");
    await queryRunner.dropTable("admins");
    await queryRunner.dropTable("ai_insights");
    await queryRunner.dropTable("external_reviews");
    await queryRunner.dropTable("customer_feedback");
    await queryRunner.dropTable("restaurant_auth");
    await queryRunner.dropTable("restaurants");
  }
}

