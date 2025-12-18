import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGooglePlaceIdToRestaurant1766078319662 implements MigrationInterface {
    name = 'AddGooglePlaceIdToRestaurant1766078319662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurants" ADD "googlePlaceId" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "googlePlaceId"`);
    }
}

