# Backend design


## ``app.js``
This is the main app file. 

- Create app
- Load DB object (``get_db.js``)
- Inject routers with DB object and add to app
- Add other middleware
- Activate app


## ``get_db.js``
Inject MySQL pool connector into SqlDataHandler object and return as DB object.

## ``controllers/``
Contain definitions of high level functions for fetching and transforming app data to serve the front end.

## ``data_handlers/``
Contain class definitions for making queries to the database in the context of the app. 
Objects of this class are injected with objects
that handle direct interactions with the DB.

### ``SqlDataHandler.js``
Class containing SQL queries that are made by the app.

## ``db_connectors/``
Contain class definitions for handling direct interactions with DB. Currently only MySQL pool connection is supported.

### ``MySqlPool.js``
MySQL pool connection class.

