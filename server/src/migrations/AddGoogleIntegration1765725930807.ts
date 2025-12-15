import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddGoogleIntegration1765725930807 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create google_integrations table
    await queryRunner.createTable(
      new Table({
        name: "google_integrations",
        columns: [
          {
            name: "restaurantId",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "googleAccountId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "locationId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "accessToken",
            type: "text",
            isNullable: false,
          },
          {
            name: "refreshToken",
            type: "text",
            isNullable: false,
          },
          {
            name: "tokenExpiry",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "lastSyncedAt",
            type: "timestamp",
            isNullable: true,
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

    // Add foreign key for google_integrations
    await queryRunner.createForeignKey(
      "google_integrations",
      new TableForeignKey({
        columnNames: ["restaurantId"],
        referencedColumnNames: ["id"],
        referencedTableName: "restaurants",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const table = await queryRunner.getTable("google_integrations");
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("restaurantId") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("google_integrations", foreignKey);
    }

    // Drop table
    await queryRunner.dropTable("google_integrations");
  }
}




