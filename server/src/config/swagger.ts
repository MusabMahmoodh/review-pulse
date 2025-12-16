import swaggerJsdoc from "swagger-jsdoc";
import { SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Review Pulse API",
    version: "1.0.0",
    description: "API documentation for Review Pulse - Restaurant feedback management platform",
    contact: {
      name: "Review Pulse Support",
    },
  },
  servers: [
    {
      url: process.env.API_URL || "http://localhost:3001",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Restaurant: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          qrCode: { type: "string" },
          socialKeywords: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["active", "blocked"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CustomerFeedback: {
        type: "object",
        properties: {
          id: { type: "string" },
          restaurantId: { type: "string" },
          customerName: { type: "string" },
          customerContact: { type: "string" },
          foodRating: { type: "number", minimum: 1, maximum: 5 },
          staffRating: { type: "number", minimum: 1, maximum: 5 },
          ambienceRating: { type: "number", minimum: 1, maximum: 5 },
          overallRating: { type: "number", minimum: 1, maximum: 5 },
          suggestions: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ExternalReview: {
        type: "object",
        properties: {
          id: { type: "string" },
          restaurantId: { type: "string" },
          platform: { type: "string", enum: ["google", "facebook", "instagram"] },
          author: { type: "string" },
          rating: { type: "number" },
          comment: { type: "string" },
          reviewDate: { type: "string", format: "date-time" },
          syncedAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);







