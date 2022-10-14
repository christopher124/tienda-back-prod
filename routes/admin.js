"use strict";

var express = require("express");
var adminController = require("../controllers/AdminController");
var auth = require("../middlewares/authenticate");

var api = express.Router();

api.post("/registro_admin", adminController.registro_admin);
api.post("/login_admin", adminController.login_admin);
api.get("/obtener_admin/:id", auth.auth, adminController.obtener_admin);

module.exports = api;
