"use strict";

var express = require("express");
var CarritoController = require("../controllers/CarritoController");

var api = express.Router();
var auth = require("../middlewares/authenticate");

api.post(
  "/agregar_carrito_cliente",
  auth.auth,
  CarritoController.agregar_carrito_cliente
);
api.get(
  "/obtener_carrito_cliente/:id",
  auth.auth,
  CarritoController.obtener_carrito_cliente
);
api.delete(
  "/eliminar_carrito_cliente/:id",
  auth.auth,
  CarritoController.eliminar_carrito_cliente
);
module.exports = api;
