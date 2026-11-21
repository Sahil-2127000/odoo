const express = require("express");
const router = express.Router();

const { createKit, getKits, deleteKit } = require("../controllers/kit.controller");
const { auth, isAdmin, isStaff } = require("../middlewares/auth.middleware");

router.post("/", auth, isAdmin, createKit);
router.get("/", auth, isStaff, getKits);
router.delete("/:id", auth, isAdmin, deleteKit);

module.exports = router;