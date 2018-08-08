/* eslint-disable */

'use strict';
module.exports = (sequelize, DataTypes) => {
  var Loans = sequelize.define('Loans', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    book_id: DataTypes.INTEGER,
    patron_id: DataTypes.INTEGER,
    loaned_on: {
      type: DataTypes.DATE,
      validate: {
        notEmpty: {
          msg: "Please enter a valid date (YYYY-MM-DD)"
        }
      }
    },
    return_by: {
      type: DataTypes.DATE,
      validate: {
        notEmpty: {
          msg: "Please enter a valid date (YYYY-MM-DD)"
        }
      }
    },
    returned_on: {
      type: DataTypes.DATE,
      validate: {
        notEmpty: {
          msg: "A 'Returned On' date must be entered (YYYY-MM-DD)"
        }
      }
    },
  }, {
    timestamps: false,
    underscored: true
  });
  // http://docs.sequelizejs.com/manual/tutorial/models-definition.html#timestamps
  Loans.associate = function(models) {
    // associations can be defined here
    Loans.belongsTo(models.Books, { foreignKey: "book_id" });
    Loans.belongsTo(models.Patrons, { foreignKey: "patron_id" });
  };
  return Loans;
};
