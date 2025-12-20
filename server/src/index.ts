import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth";
import feedbackRoutes from "./routes/feedback";
import adminRoutes from "./routes/admin";
import aiRoutes from "./routes/ai";
import actionableItemsRoutes from "./routes/actionable-items";
import teamMembersRoutes from "./routes/team-members";
import classesRoutes from "./routes/classes";

// Load environment variables 222
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/actionable-items", actionableItemsRoutes);
app.use("/api/team-members", teamMembersRoutes);
app.use("/api/classes", classesRoutes);

// Health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error during database initialization:", error);
    process.exit(1);
  });

