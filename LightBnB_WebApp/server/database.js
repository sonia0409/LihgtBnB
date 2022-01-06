const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

//set connection with database
const pool = new Pool({
  user: 'vagrant',
  password: 'vagrant',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function(email) {
  const usersQuery = `
  SELECT *
  FROM users
  WHERE email = $1;`;
  
 return  pool.query(usersQuery, [email])
            .then(result => result.rows[0])
            .catch(err => console.error('query error', err.stack));


 /*  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user); */
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const usersQuery = `
  SELECT *
  FROM users
  WHERE id = $1;`;
  
 return  pool.query(usersQuery, [id])
            .then(result => result.rows[0])
            .catch(err => console.error('query error', err.stack));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  
  const values = [user.name, user.email, user.password]
/* INSERT NEW USER TO USERS */
  const insertNewUserQuery =`
  INSERT INTO users
  (name, email, password)
  VALUES
  ($1, $2, $3)
  RETURNING *;`

  return pool
            .query(insertNewUserQuery, values)
            .then(result => console.log(result.rows[0]))
            .catch(err => console.error('addUser error',err.stack))

  /* const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user); */
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const values = [guest_id, limit]
  const reservationsQuery = `
  SELECT reservations.*, properties.title as title, properties.number_of_bedrooms as number_of_bedrooms,
  properties.number_of_bathrooms as number_of_bathrooms, properties.parking_spaces as parking_spaces,
  properties.thumbnail_photo_url as thumbnail_photo_url, properties.cover_photo_url as cover_photo_url 
  FROM reservations
  JOIN properties ON properties.id = property_id
  WHERE guest_id = $1
  AND start_date < NOW()::DATE
  LIMIT $2;`

  return pool 
            .query(reservationsQuery, values)
            .then(result => result.rows)
            .catch(err => console.error("reservations error--",err.stack))

  /* return getAllProperties(null, 2); */
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryProperty = `
  SELECT *
  FROM properties LIMIT $1;`;

  return pool.query(queryProperty, [limit])
      .then(result => result.rows)
      .catch(err => console.error('query error', err.stack));
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
