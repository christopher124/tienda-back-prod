"use strict";

var Admin = require("../models/admin");
var Contacto = require("../models/contacto");
var Venta = require("../models/venta");
var Dventa = require("../models/dventa");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../helpers/jwt");
var fs = require("fs");
var handlebars = require("handlebars");
var ejs = require("ejs");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var path = require("path");
const registro_admin = async function (req, res) {
  //
  var data = req.body;
  var admin_arr = [];

  admin_arr = await Admin.find({ email: data.email });
  //registro
  if (admin_arr.length == 0) {
    //;

    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          var reg = await Admin.create(data);
          res.status(200).send({ data: reg });
        } else {
          res.status(200).send({ message: "Error Server", data: undefined });
        }
      });
    } else {
      res
        .status(200)
        .send({ message: "No hay una contraseña", data: undefined });
    }
  } else {
    res.status(200).send({ message: "El correo ya existe", data: undefined });
  }
};

const login_admin = async function (req, res) {
  var data = req.body;
  var admin_arr = [];

  admin_arr = await Admin.find({ email: data.email });

  if (admin_arr.length === 0) {
    res
      .status(200)
      .send({ message: "No se Encotro el correo", data: undefined });
  } else {
    //login
    let user = admin_arr[0];

    bcrypt.compare(data.password, user.password, async function (error, check) {
      if (check) {
        res.status(200).send({ data: user, token: jwt.createToken(user) });
      } else {
        res.status(200).send({
          message: "La contraseña o el usuario no coincide",
          data: undefined,
        });
      }
    });
  }
};
const obtener_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];

      try {
        var reg = await Cliente.findById({ _id: id });

        res.status(200).send({ data: reg });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else res.status(500).send({ message: "NoAccess" });
  } else res.status(500).send({ message: "NoAccess" });
};

const obtener_mensajes_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let reg = await Contacto.find().sort({ createdAt: -1 });
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};

const cerrar_mensajes_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];

      let reg = await Contacto.findByIdAndUpdate(
        { _id: id },
        { estado: "Cerrado" }
      );
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "Sin Acceso" });
    }
  } else {
    res.status(500).send({ message: "Sin Acceso" });
  }
};

const obtener_ventas_admin = async function (req, res) {
  if (req.user) {
    let ventas = [];
    let desde = req.params["desde"];
    let hasta = req.params["hasta"];

    if (desde == "undefined" && hasta == "undefined") {
      ventas = await Venta.find()
        .populate("cliente")
        .populate("direccion")
        .sort({ createdAt: -1 });
      res.status(200).send({ data: ventas });
    } else {
      let tt_desde = Date.parse(new Date(desde + "T00:00:00")) / 1000;
      let tt_hasta = Date.parse(new Date(hasta + "T00:00:00")) / 1000;

      let tem_ventas = await Venta.find()
        .populate("cliente")
        .populate("direccion")
        .sort({ createdAt: -1 });

      for (var item of tem_ventas) {
        var tt_created = Date.parse(new Date(item.createdAt)) / 1000;
        if (tt_created >= tt_desde && tt_created <= tt_hasta) {
          ventas.push(item);
        }
      }
      res.status(200).send({ data: ventas });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const obtener_detalles_ordenes_cliente = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];

    try {
      let venta = await Venta.findById({ _id: id })
        .populate("direccion")
        .populate("cliente");
      let detalles = await Dventa.find({ venta: venta._id })
        .populate("producto")
        .populate("variedad");
      res.status(200).send({ data: venta, detalles: detalles });
    } catch (error) {
      console.log(error);
      res.status(200).send({ data: undefined });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};
const marcar_finalizado_orden = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];
    let data = req.body;

    var venta = await Venta.findByIdAndUpdate(
      { _id: id },
      {
        estado: "Finalizado",
      }
    );

    res.status(200).send({ data: venta });
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const eliminar_orden_admin = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];

    var venta = await Venta.findOneAndRemove({ _id: id });
    await Dventa.remove({ venta: id });

    res.status(200).send({ data: venta });
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const marcar_envio_orden = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];
    let data = req.body;

    var venta = await Venta.findByIdAndUpdate(
      { _id: id },
      {
        tracking: data.tracking,
        estado: "Enviado",
      }
    );

    mail_confirmar_envio(id);

    res.status(200).send({ data: venta });
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const mail_confirmar_envio = async function (venta) {
  try {
    var readHTMLFile = function (path, callback) {
      fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
        if (err) {
          throw err;
          callback(err);
        } else {
          callback(null, html);
        }
      });
    };

    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "urri740@gmail.com",
          pass: "imngplerntqgjepw",
        },
      })
    );

    var orden = await Venta.findById({ _id: venta })
      .populate("cliente")
      .populate("direccion");
    var dventa = await Dventa.find({ venta: venta })
      .populate("producto")
      .populate("variedad");

    readHTMLFile(process.cwd() + "/mails/email_enviado.html", (err, html) => {
      let rest_html = ejs.render(html, { orden: orden, dventa: dventa });

      var template = handlebars.compile(rest_html);
      var htmlToSend = template({ op: true });

      var mailOptions = {
        from: "urri740@gmail.com",
        to: orden.cliente.email,
        subject: "Tu pedido " + orden._id + " fué enviado",
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (!error) {
          console.log("Email sent: " + info.response);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};
const enviar_orden_compra = async function (venta) {
  try {
    var readHTMLFile = function (path, callback) {
      fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
        if (err) {
          throw err;
          callback(err);
        } else {
          callback(null, html);
        }
      });
    };

    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "urri740@gmail.com",
          pass: "imngplerntqgjepw",
        },
      })
    );

    var orden = await Venta.findById({ _id: venta })
      .populate("cliente")
      .populate("direccion");
    var dventa = await Dventa.find({ venta: venta })
      .populate("producto")
      .populate("variedad");

    readHTMLFile(process.cwd() + "/mails/email_compra.html", (err, html) => {
      let rest_html = ejs.render(html, { orden: orden, dventa: dventa });

      var template = handlebars.compile(rest_html);
      var htmlToSend = template({ op: true });

      var mailOptions = {
        from: "urri740@gmail.com",
        to: orden.cliente.email,
        subject: "Confirmación de compra " + orden._id,
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (!error) {
          console.log("Email sent: " + info.response);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

///KPI

const kpi_ganancias_mensaules_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var enero = 0;
      var febrero = 0;
      var marzo = 0;
      var abril = 0;
      var mayo = 0;
      var junio = 0;
      var julio = 0;
      var agosto = 0;
      var septiembre = 0;
      var octubre = 0;
      var noviembre = 0;
      var diciembre = 0;

      var total_ganancia = 0;
      var total_mes = 0;
      var count_ventas = 0;
      var total_mes_ant = 0;
      var reg = await Venta.find();
      let current_date = new Date();
      let current_year = current_date.getFullYear();
      let current_month = current_date.getMonth() + 1;
      for (let item of reg) {
        let createdAt_date = new Date(item.createdAt);
        let mes = createdAt_date.getMonth() + 1;
        if (createdAt_date.getUTCFullYear() == current_year) {
          total_ganancia = total_ganancia + item.subtotal;
          if (mes == current_month) {
            total_mes = total_mes + item.subtotal;
            count_ventas = count_ventas + 1;
          }
          if (mes == current_month - 1) {
            total_mes_ant = total_mes_ant + item.subtotal;
          }
          if (mes == 1) {
            enero = enero + item.subtotal;
          } else if (mes == 2) {
            febrero = febrero + item.subtotal;
          } else if (mes == 3) {
            marzo = marzo + item.subtotal;
          } else if (mes == 4) {
            abril = abril + item.subtotal;
          } else if (mes == 5) {
            mayo = mayo + item.subtotal;
          } else if (mes == 6) {
            junio = junio + item.subtotal;
          } else if (mes == 7) {
            julio = julio + item.subtotal;
          } else if (mes == 8) {
            agosto = agosto + item.subtotal;
          } else if (mes == 9) {
            septiembre = septiembre + item.subtotal;
          } else if (mes == 10) {
            octubre = octubre + item.subtotal;
          } else if (mes == 11) {
            noviembre = noviembre + item.subtotal;
          } else if (mes == 12) {
            diciembre = diciembre + item.subtotal;
          }
        }
      }
      res.status(200).send({
        enero: enero,
        febrero: febrero,
        marzo: marzo,
        abril: abril,
        mayo: mayo,
        junio: junio,
        julio: julio,
        agosto: agosto,
        septiembre: septiembre,
        octubre: octubre,
        noviembre: noviembre,
        diciembre: diciembre,
        total_ganancia: total_ganancia,
        total_mes: total_mes,
        count_ventas: count_ventas,
        total_mes_ant: total_mes_ant,
      });
    } else {
      res.status(500).send({ message: "NoAccess" });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

module.exports = {
  registro_admin,
  login_admin,
  obtener_admin,
  obtener_mensajes_admin,
  cerrar_mensajes_admin,
  obtener_ventas_admin,
  obtener_detalles_ordenes_cliente,
  marcar_finalizado_orden,
  eliminar_orden_admin,
  marcar_envio_orden,
  enviar_orden_compra,
  kpi_ganancias_mensaules_admin,
};
