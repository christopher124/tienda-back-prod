"use strict";

var express = require("express");
var adminController = require("../controllers/AdminController");
var auth = require("../middlewares/authenticate");

var api = express.Router();

api.post("/registro_admin", adminController.registro_admin);
api.post("/login_admin", adminController.login_admin);
api.get("/obtener_admin/:id", auth.auth, adminController.obtener_admin);
api.get(
  "/obtener_mensajes_admin",
  auth.auth,
  adminController.obtener_mensajes_admin
);
api.put(
  "/cerrar_mensajes_admin/:id",
  auth.auth,
  adminController.cerrar_mensajes_admin
);
api.get(
  "/obtener_ventas_admin/:desde?/:hasta?",
  auth.auth,
  adminController.obtener_ventas_admin
);
api.get(
  "/obtener_detalles_ordenes_cliente/:id",
  auth.auth,
  adminController.obtener_detalles_ordenes_cliente
);
api.put(
  "/marcar_finalizado_orden/:id",
  auth.auth,
  adminController.marcar_finalizado_orden
);
api.delete(
  "/eliminar_orden_admin/:id",
  auth.auth,
  adminController.eliminar_orden_admin
);
api.put(
  "/marcar_envio_orden/:id",
  auth.auth,
  adminController.marcar_envio_orden
);
api.get(
  "/kpi_ganancias_mensaules_admin",
  auth.auth,
  adminController.kpi_ganancias_mensaules_admin
);
module.exports = api;
