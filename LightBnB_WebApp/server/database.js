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

const getUserWithEmail = function (email) {
  const usersQuery = `
  SELECT *
  FROM users
  WHERE email = $1;`;

  return pool.query(usersQuery, [email])
    .then(result => result.rows[0])
    .catch(err => console.error('query error', err.stack));
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const usersQuery = `
  SELECT *
  FROM users
  WHERE id = $1;`;

  return pool.query(usersQuery, [id])
    .then(result => result.rows[0])
    .catch(err => console.error('query error', err.stack));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  const values = [user.name, user.email, user.password]
  /* INSERT NEW USER TO USERS */
  // if user already exists
  const checkNewUser =`
  SELECT *
  FROM users
  WHERE users.email = $1`;

  return pool
            .query(checkNewUser, [user.email])
            .then(result => {
              if(!result.rows[0]){
                const insertNewUserQuery = `
                INSERT INTO users
                (name, email, password)
                VALUES
                ($1, $2, $3)
                RETURNING *;`
              
              pool
                  .query(insertNewUserQuery, values)
                  .then(result => console.log(result.rows[0]))
                  .catch(err => console.error('addUser error', err.stack))
              }
            })
            .catch(err => console.error('user already exist error',err.stack))

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
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
    .catch(err => console.error("reservations error--", err.stack))
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
  let propertyParams = [];
  let propertyQuery = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if(options.city) {
    propertyParams.push(`%${options.city}%`);
    propertyQuery += `WHERE city LIKE $${propertyParams.length} `;
  }

  if(options.owner_id) {
    propertyParams.push(options.owner_id);
    propertyQuery += `
    AND owner_id = $${propertyParams.length}
    `
  }

  if(options.minimum_price_per_night) {
    propertyParams.push(options.minimum_price_per_night * 100)

    //multiplication by 100-> convert user's input as dollars to cents
    propertyQuery += `
    AND properties.cost_per_night > $${propertyParams.length}
    `;
  }

  if(options.maximum_price_per_night) {
    propertyParams.push(options.maximum_price_per_night * 100)

    //multiplication by 100-> convert user's input as dollars to cents
    propertyQuery += `
    AND properties.cost_per_night < $${propertyParams.length}
    `;
  }
  if(options.minimum_rating){
    propertyParams.push(options.minimum_rating)

    propertyQuery += `
    AND property_reviews.rating >= $${propertyParams.length}
    `;
  }


  propertyParams.push(limit);
  propertyQuery += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${propertyParams.length};
  `;

  console.log(propertyQuery, propertyParams);

  return pool.query(propertyQuery, propertyParams)
    .then(result => result.rows)
    .catch(err => console.error('query error', err.stack));
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryParams =[property.owner_id, property.title, property.description, property.thumbnail_photo_url,
    property.cover_photo_url, property.cost_per_night, property.street, 
    property.city, property.province, property.post_code,property.country,
    property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms]
  const queryString = `
  INSERT INTO properties(owner_id, title, description, thumbnail_photo_url,
    cover_photo_url, cost_per_night, street, city, province, post_code, country,
    parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;`

  return pool
            .query(queryString,queryParams)
            .then(result => { 
              console.log(result);
              return result
             })
            .catch(err => console.error(err.stack))
}
exports.addProperty = addProperty;
