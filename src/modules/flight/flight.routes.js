const router = require("express").Router();
const { searchFlightsController } = require("./flight.controller");

//router.post("/search", searchFlightsController);
router.get("/search", searchFlightsController);


module.exports = router;