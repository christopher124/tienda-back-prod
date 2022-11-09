"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var DireccionSchema = Schema({
  cliente: { type: Schema.ObjectId, ref: "cliente", required: true },
  destinatario: { type: String, require: true },
  //   dni: { type: String, require: true },
  zip: { type: String, require: true },
  direccion: { type: String, require: true },
  pais: { type: String, require: true },
  region: { type: String, require: true },
  provincia: { type: String, require: true },
  distrito: { type: String, require: true },
  telefono: { type: String, require: true },
  principal: { type: Boolean, require: true },

  createdAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("direccion", DireccionSchema);
