
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
} = require("../controllers/subscriptionController");

// Create a subscription
router.post("/", protect, createSubscription);

// Get all subscriptions
router.get("/", protect, getSubscriptions);

// Update a subscription by ID
router.put("/:id", protect, updateSubscription);

// Delete a subscription by ID
router.delete("/:id", protect, deleteSubscription);

module.exports = router;
