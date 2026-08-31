<?php
/*
* @author Amin Ghadersohi
* @date 2010-Jul-07
*
* The top interface for mysql dbs using pdo driver
*
* Changelog
*
* 2015-12-15 Steve Gallo <smgallo@buffalo.edu>
* - Now implements iDatabase
*/

namespace CCR\DB;

use Exception;

class MySQLDB extends PDODB implements iDatabase
{
    // ------------------------------------------------------------------------------------------
    // TEMPORARY - remove before merging.
    //
    // Forces strict mode on each session so compliance can be tested without changing the
    // shared dev server's global sql_mode. This is the measured MariaDB 10.6-12.3 default
    // plus ONLY_FULL_GROUP_BY.
    // ------------------------------------------------------------------------------------------

    const TEMP_SESSION_SQL_MODE = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,'
        . 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY';

    // ------------------------------------------------------------------------------------------
    // @see iDatabase::__construct()
    // ------------------------------------------------------------------------------------------

    public function __construct($db_host, $db_port, $db_name, $db_username, $db_password, $dsn_extra = null)
    {
        if ( null == $db_host || null === $db_name || null === $db_username ) {
            $msg = "Database engine " . __CLASS__ . " requires (host, database, username)";
            throw new Exception($msg);
        }
        parent::__construct("mysql", $db_host, $db_port, $db_name, $db_username, $db_password, 'charset=utf8');
    }

    // ------------------------------------------------------------------------------------------
    // @see iDatabase::connect()
    //
    // TEMPORARY - remove along with TEMP_SESSION_SQL_MODE.
    // ------------------------------------------------------------------------------------------

    public function connect()
    {
        $isNewConnection = ( null === $this->_dbh );
        $dbh = parent::connect();

        if ( $isNewConnection ) {
            $dbh->exec('SET SESSION sql_mode = ' . $dbh->quote(self::TEMP_SESSION_SQL_MODE));
        }

        return $dbh;
    }
}  // class MySQLDB
