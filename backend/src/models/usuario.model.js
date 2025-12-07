import { DataTypes } from "sequelize";
import { db } from "../db.js";

const Usuario = db.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    google_id: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    nombre: {
      type: DataTypes.STRING(100),
    },

    apellido: {
      type: DataTypes.STRING(100),
    },

    genero: {
      type: DataTypes.STRING(20),
    },

    fecha_nacimiento: {
      type: DataTypes.DATE,
    },

    provincia: {
      type: DataTypes.STRING(100),
    },

    ciudad: {
      type: DataTypes.STRING(100),
    },

    domicilio: {
      type: DataTypes.STRING(200),
    },

    codigo_postal: {
      type: DataTypes.STRING(20),
    },

    foto: {
      type: DataTypes.STRING(300),
    },

    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  }
);

export default Usuario;
