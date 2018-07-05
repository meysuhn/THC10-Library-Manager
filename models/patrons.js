/* eslint-disable */

'use strict';
module.exports = (sequelize, DataTypes) => {
  var Patrons = sequelize.define('Patrons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    address: DataTypes.STRING,
    email: DataTypes.STRING,
    library_id: DataTypes.STRING,
    zip_code: DataTypes.STRING
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
