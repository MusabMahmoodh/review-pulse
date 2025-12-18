import { Router } from "express";
import { AppDataSource } from "../data-source";
import { TeamMember, Restaurant } from "../models";
import { requireAuth } from "../middleware/auth";
import { isPremium } from "../utils/subscription";

const router = Router();

/**
 * @swagger
 * /api/team-members:
 *   get:
 *     summary: Get all team members for a restaurant
 *     tags: [TeamMembers]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: List of team members
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const members = await teamMemberRepo.find({
      where: { restaurantId },
      order: { createdAt: "DESC" },
    });

    return res.json({ members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return res.status(500).json({ error: "Failed to fetch team members" });
  }
});

/**
 * @swagger
 * /api/team-members:
 *   post:
 *     summary: Create a new team member
 *     tags: [TeamMembers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - name
 *             properties:
 *               restaurantId:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team member created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId || !name) {
      return res.status(400).json({ error: "Restaurant ID and name are required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    // Verify restaurant exists
    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const member = teamMemberRepo.create({
      id: `member_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      role: role || undefined,
    });

    await teamMemberRepo.save(member);

    return res.status(201).json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Error creating team member:", error);
    return res.status(500).json({ error: "Failed to create team member" });
  }
});

/**
 * @swagger
 * /api/team-members/{id}:
 *   patch:
 *     summary: Update a team member
 *     tags: [TeamMembers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team member updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Member not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const member = await teamMemberRepo.findOne({
      where: { id, restaurantId },
    });

    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    if (name !== undefined) member.name = name;
    if (email !== undefined) member.email = email;
    if (phone !== undefined) member.phone = phone;
    if (role !== undefined) member.role = role;

    await teamMemberRepo.save(member);

    return res.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    return res.status(500).json({ error: "Failed to update team member" });
  }
});

/**
 * @swagger
 * /api/team-members/{id}:
 *   delete:
 *     summary: Delete a team member
 *     tags: [TeamMembers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID
 *     responses:
 *       200:
 *         description: Team member deleted
 *       404:
 *         description: Member not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const member = await teamMemberRepo.findOne({
      where: { id, restaurantId },
    });

    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    await teamMemberRepo.remove(member);

    return res.json({
      success: true,
      message: "Team member deleted",
    });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return res.status(500).json({ error: "Failed to delete team member" });
  }
});

export default router;




