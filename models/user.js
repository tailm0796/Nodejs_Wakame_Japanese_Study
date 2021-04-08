'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class USER extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            this.hasMany(models.BLOG, { as: 'baidang' });
            this.hasMany(models.COMMENT, { as: 'binhluan' });
            this.hasMany(models.TKB_DU_KIEN, { as: 'user_tkb' });
            this.hasMany(models.DS_MON_DA_HOC, { as: 'user_mondahoc' });
        }
    };
    USER.init({
        fullName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING
    }, {
            sequelize,
            modelName: 'USER',
            freezeTableName: true,
        });
    return USER;
};