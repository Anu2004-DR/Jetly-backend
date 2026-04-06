const router = require("express").Router();
const { searchController } = require("./search.controller");

router.get("/", searchController);

module.exports = router;