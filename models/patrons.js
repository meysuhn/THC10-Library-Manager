/* eslint-disable */

'use strict';
module.exports = (sequelize, DataTypes) => {
  var Patrons = sequelize.define('Patrons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "First Name is a required field"
        }
      }
    },
    last_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Last Name is a required field"
        }
      }
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Address is a required field"
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Email is a required field"
        }
      }
    },
    library_id: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Library ID is a required field"
        }
      }
    },
    zip_code: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Zip Code is a required field"
        }
      }
    },
  }, {
    timestamps: false,
    underscored: true
  });
  Patrons.associate = function(models) {
    // associations can be defined here
    //Patrons.hasMany(models.Loans);
    Patrons.hasMany(models.Loans, {foreignKey: 'patron_id'})
  };
  return Patrons;
};
