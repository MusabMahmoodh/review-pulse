import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddMetaIntegration1765867003269 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create meta_integrations table
    await queryRunner.createTable(
      new Table({
        name: "meta_integrations",
        columns: [
          {
            name: "restaurantId",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "pageId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "instagramBusinessAccountId",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "accessToken",
            type: "text",
            isNullable: false,
          },
          {
            name: "userAccessToken",
            type: "text",
            isNullable: true,
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

    // Add foreign key for meta_integrations
    await queryRunner.createForeignKey(
      "meta_integrations",
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
    const table = await queryRunner.getTable("meta_integrations");
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("restaurantId") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("meta_integrations", foreignKey);
    }

    // Drop table
    await queryRunner.dropTable("meta_integrations");
  }
}


