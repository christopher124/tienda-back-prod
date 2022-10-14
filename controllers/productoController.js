"use strict";

var Producto = require("../models/producto");
var Inventario = require("../models/inventario");

var fs = require("fs");
var path = require("path");
const producto = require("../models/producto");
const registro_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let data = req.body;
      console.log(data);
      console.log(req.files);
      var img_path = req.files.portada.path;
      console.log(img_path);
      var name = img_path.split("\\");
      console.log(name);
      var portada_name = name[2];
      console.log(portada_name);

      data.slug = data.titulo
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      data.portada = portada_name;
      console.log(data);
      let reg = await Producto.create(data);

      let inventario = await Inventario.create({
        admin: req.user.sub,
        cantidad: data.stock,
        proveedor: "Primer registro",
        producto: reg._id,
      });

      res.status(200).send({ data: reg, inventario: inventario });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};

const listar_productos_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var filtro = req.params["filtro"];
      let reg = await Producto.find({ titulo: new RegExp(filtro, "i") });
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};

const obtener_portada = async function (req, res) {
  var img = req.params["img"];
  fs.stat("./uploads/productos/" + img, function (err) {
    if (!err) {
      let path_img = "./uploads/productos/" + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/default.jpg/";
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
  console.log(img);
};

const obtener_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];

      try {
        var reg = await Producto.findById({ _id: id });

        res.status(200).send({ data: reg });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else res.status(500).send({ message: "NoAccess" });
  } else res.status(500).send({ message: "NoAccess" });
};
const actulizar_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];
      let data = req.body;
      console.log(req.files);

      if (req.files) {
        // si hay imagen
        var img_path = req.files.portada.path;
        var name = img_path.split("\\");
        var portada_name = name[2];
        let reg = await Producto.findByIdAndUpdate(
          { _id: id },
          {
            titulo: data.titulo,
            stock: data.stock,
            precio: data.precio,
            categoria: data.categoria,
            descripcion: data.descripcion,
            contenido: data.contenido,
            portada: portada_name,
          }
        );
        fs.stat("./uploads/productos/" + reg.portada, function (err) {
          if (!err) {
            fs.unlink("./uploads/productos/" + reg.portada, (err) => {
              if (err) throw err;
            });
          }
        });
        res.status(200).send({ data: reg });
      } else {
        //nel
        let reg = await Producto.findByIdAndUpdate(
          { _id: id },
          {
            titulo: data.titulo,
            stock: data.stock,
            precio: data.precio,
            categoria: data.categoria,
            descripcion: data.descripcion,
            contenido: data.contenido,
          }
        );
        res.status(200).send({ data: reg });
      }
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};
const eliminar_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];

      let reg = await Producto.findByIdAndRemove({ _id: id });
      res.status(200).send({ data: reg });
    } else res.status(500).send({ message: "NoAccess" });
  } else res.status(500).send({ message: "NoAccess" });
};
const listar_inventario_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];

      var reg = await Inventario.find({ producto: id })
        .populate("admin")
        .sort({ createdAt: -1 });
      res.status(200).send({ data: reg });
    } else res.status(500).send({ message: "NoAccess" });
  } else res.status(500).send({ message: "NoAccess" });
};
const eliminar_inventario_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      // OBENETER ID DEL INVNERTARIO
      var id = req.params["id"];
      // ELIMINAR INVENTARIOO
      let reg = await Inventario.findByIdAndRemove({ _id: id });
      // OBETENER EL REGISTRO DE PROCUTO
      let prod = await Producto.findById({ _id: reg.producto });
      // CALCULAR EL NUEVO ESTOCK
      let nuevo_stock = parseInt(prod.stock) - parseInt(reg.cantidad);
      // ACTULIZAR EL NUEVO ESTOCK AL PRDUCTO
      let producto = await Producto.findByIdAndUpdate(
        { _id: reg.producto },
        {
          stock: nuevo_stock,
        }
      );

      res.status(200).send({ data: producto });
    } else res.status(500).send({ message: "NoAccess" });
  } else res.status(500).send({ message: "NoAccess" });
};

const registro_inventario_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let data = req.body;

      let reg = await Inventario.create(data);
      // OBETENER EL REGISTRO DE PROCUTO
      let prod = await Producto.findById({ _id: reg.producto });
      // CALCULAR EL NUEVO ESTOCK
      let nuevo_stock = parseInt(prod.stock) + parseInt(reg.cantidad);
      let producto = await Producto.findByIdAndUpdate(
        { _id: reg.producto },
        {
          stock: nuevo_stock,
        }
      );
      res.status(200).send({ data: reg });
    } else res.status(500).send({ message: "NoAccess" });
  } else res.status(500).send({ message: "NoAccess" });
};
const actulizar_producto_variedades_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];
      let data = req.body;
      console.log(req.files);

      let reg = await Producto.findByIdAndUpdate(
        { _id: id },
        {
          titulo_variedad: data.titulo_variedad,
          variedades: data.variedades,
        }
      );
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};
const agregar_imagen_galeria_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];
      let data = req.body;
      console.log(req.files);
      console.log(data);
      console.log(req.files);
      var img_path = req.files.imagen.path;
      console.log(img_path);
      var name = img_path.split("\\");
      console.log(name);
      var imagen_name = name[2];
      console.log(imagen_name);
      let reg = await Producto.findByIdAndUpdate(
        { _id: id },
        {
          $push: {
            galeria: {
              imagen: imagen_name,
              _id: data._id,
            },
          },
        }
      );

      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};
const eliminar_imagen_galeria_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];
      let data = req.body;

      let reg = await Producto.findByIdAndUpdate(
        { _id: id },
        {
          $pull: {
            galeria: {
              _id: data._id,
            },
          },
        }
      );

      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};
module.exports = {
  registro_producto_admin,
  listar_productos_admin,
  obtener_portada,
  obtener_producto_admin,
  actulizar_producto_admin,
  eliminar_producto_admin,
  listar_inventario_producto_admin,
  eliminar_inventario_producto_admin,
  registro_inventario_producto_admin,
  actulizar_producto_variedades_admin,
  agregar_imagen_galeria_admin,
  eliminar_imagen_galeria_admin,
};