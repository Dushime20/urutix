const { Client } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const client = new Client({
    host: process