/* eslint-disable */

'use strict';

module.exports = (sequelize, DataTypes) => {
  var Books = sequelize.define('Books', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Title is a required field"
        }
      }
    },
    author: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Author is a required field"
        }
      }
    },
    genre: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Genre is a required field"
        },
        len: {
          args: [4, 64],
          msg: 'Genre must be at least 4 characters'
        }
      }
    },
    first_published: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "Required Field (YYYY)"
        },
        isNumeric: {
          msg: "Date should be numeric only (YYYY)."
        },
        len: {
          args: [4, 4],
          msg: 'Please enter a valid date (YYYY)'
        }
      },
    }
  }, {
    timestamps: false,
    underscored: true
  });
  Books.associate = function(models) {
    // associations can be defined here
    //Books.hasOne(models.Loans);
    Books.hasMany(models.Loans, {foreignKey: 'book_id'})
  };
  return Books;
};
