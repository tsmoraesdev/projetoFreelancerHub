const knex = require('knex');
const cfg = require('../knexfile');
const env = process.env.NODE_ENV || 'development';
const db = knex(cfg[env]);
module.exports = db;
