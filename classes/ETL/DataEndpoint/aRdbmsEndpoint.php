<?php
/* ==========================================================================================
 * Helper class providing common functionality for all RDBMS DataEndpoints.
 *
 * @author Steve Gallo <smgallo@buffalo.edu>
 * @data 2015-11-12
 * ==========================================================================================
 */

// Access the config options parser

namespace ETL\DataEndpoint;

use ETL\DataEndpoint\DataEndpointOptions;
use CCR\DB;
use \Log;
use \xd_utilities;
use Exception;
use PDOException;

abstract class aRdbmsEndpoint extends aDataEndpoint
{
    // The database schema for this endpoint
    protected $schema = null;

    // The configuration section identifier that contains database connection info
    protected $config = null;

    // The character used to escape system identifiers
    protected $systemQuoteChar = '`';

    // Database hostname
    protected $hostname = null;

    // Database port
    protected $port = null;

    // User used to connect to the database
    protected $username = null;

    protected $createSchemaIfNotExists = false;

    /* ------------------------------------------------------------------------------------------
     * @see iDataEndpoint::__construct()
     * ------------------------------------------------------------------------------------------
     */

    public function __construct(DataEndpointOptions $options, Log $logger = null)
    {
        parent::__construct($options, $logger);

        // Check for required properties

        $requiredKeys = array("schema", "config");
        $this->verifyRequiredConfigKeys($requiredKeys, $options);

        $this->schema = $options->schema;
        $this->config = $options->config;
        $this->createSchemaIfNotExists = $options->create_schema_if_not_exists;

        try {
            $section = xd_utilities\getConfigurationSection($this->config);
            if ( array_key_exists("host", $section) ) {
                $this->hostname = $section["host"];
            }
            if ( array_key_exists("port", $section) ) {
                $this->port = $section["port"];
            }
            if ( array_key_exists("user", $section) ) {
                $this->username = $section["user"];
            }
        } catch (\Exception $e) {
            $msg = "Database '{$this->config}' not defined in configuration";
            $this->logAndThrowException($msg);
        }

        // Since the name is arbitrary, do not use it for the unique key
        $this->key = md5(implode($this->keySeparator, array($this->type, $this->config, $this->schema)));

    }  // __construct()

    /* ------------------------------------------------------------------------------------------
     * @see iDataEndpoint::verify()
     * ------------------------------------------------------------------------------------------
     */

    public function verify($dryrun = false, $leaveConnected = false)
    {
        // The first time a connection is made the endpoint handle should be set.

        if ( false === $this->schemaExists($this->schema) ) {
            $msg = "Schema '{$this->schema}' does not exist"
                . (null !== $this->username ? " for user '{$this->username}'" : "" );
            if ( $this->createSchemaIfNotExists ) {
                $this->logger->notice($msg . ", creating");
                if ( ! $dryrun ) {
                    $this->createSchema($this->schema);
                }
            } else {
                $this->logAndThrowException($msg);
            }
        }

        if ( ! $leaveConnected ) {
            $this->disconnect();
        }

        return true;
    }  // verify()

    /* ------------------------------------------------------------------------------------------
     * @see iRdbmsEndpoint::getSchema()
     * ------------------------------------------------------------------------------------------
     */

    public function getSchema($quote = false)
    {
        return ( $quote ? $this->quoteSystemIdentifier($this->schema) : $this->schema );
    }  // getSchema()

    /* ------------------------------------------------------------------------------------------
     * @see aDataEndpoint::connect()
     * ------------------------------------------------------------------------------------------
     */

    public function connect()
    {
        // The first time a connection is made the endpoint handle should be set.  Note the current
        // DB::factory() does not support connecting to an alternate schema and needs a separate entry
        // in the config file. You can, however, explicitly reference a schema in your query.

        try {
            $this->handle = DB::factory($this->config);
        } catch (Exception $e) {
            $msg = "Error connecting to data endpoint '" . $this->name . "'. " . $e->getMessage();
            $this->logAndThrowException($msg);
        }

        return $this->handle;

    }  // connect()

    /* ------------------------------------------------------------------------------------------
     * @see aDataEndpoint::disconnect()
     * ------------------------------------------------------------------------------------------
     */

    public function disconnect()
    {
        $this->handle = null;
        return true;
    }  // disconnect()

    /* ------------------------------------------------------------------------------------------
     * @see iDataEndpoint::quote()
     * ------------------------------------------------------------------------------------------
     */

    public function quote($str)
    {
        return $this->getHandle()->quote($str);
    }  // quote()

    /* ------------------------------------------------------------------------------------------
     * @see iRdbmsEndpoint::quoteSystemIdentifier()
     * ------------------------------------------------------------------------------------------
     */

    public function quoteSystemIdentifier($identifier)
    {
        return $this->systemQuoteChar . $identifier . $this->systemQuoteChar;
    }  // quoteSystemIdentifier()

    /* ------------------------------------------------------------------------------------------
     * @see iRdbmsEndpoint::getSystemQuoteChar()
     * ------------------------------------------------------------------------------------------
     */

    public function getSystemQuoteChar()
    {
        return $this->systemQuoteChar;
    }  // getSystemQuoteChar()

    /* ------------------------------------------------------------------------------------------
     * @see iRdbmsEndpoint::tableExists()
     * ------------------------------------------------------------------------------------------
     */

    public function tableExists($tableName, $schemaName = null)
    {
        if ( empty($tableName) ) {
            $msg = "Table name cannot be empty";
            $this->logAndThrowException($msg);
        }

        $sql = "SELECT
table_name as name, table_type as type
FROM information_schema.tables
WHERE table_schema = :schema
AND table_name = :tablename";

        if ( null === $schemaName ) {
            $schemaName = $this->getSchema();
        }

        $params = array(
            ":schema" => $schemaName,
            ":tablename"  => $tableName
            );

        try {
            $dbh = $this->getHandle();
            $result = $dbh->query($sql, $params);
            if ( 0 == count($result) ) {
                return false;
            }
        } catch (PDOException $e) {
            $this->logAndThrowException(
                "Error querying for table '$schema'.'$tableName':",
                array('exception' => $e, 'sql' => $sql, 'endpoint' => $this)
            );
        }

        return true;

    }  // tableExists()

    /* ------------------------------------------------------------------------------------------
     * @see iRdbmsEndpoint::getTableColumnNames()
     * ------------------------------------------------------------------------------------------
     */

    public function getTableColumnNames($tableName, $schemaName = null)
    {
        if ( empty($tableName) ) {
            $msg = "Table name cannot be empty";
            $this->logAndThrowException($msg);
        }

        $sql = "SELECT
column_name as name, data_type as type
FROM information_schema.columns
WHERE table_schema = :schema
AND table_name = :tablename
ORDER BY ordinal_position ASC";

        if ( null === $schemaName ) {
            $schemaName = $this->getSchema();
        }

        $params = array(":schema" => $schemaName,
                        ":tablename"  => $tableName);

        try {
            $dbh = $this->getHandle();
            $result = $dbh->query($sql, $params);
            if ( 0 == count($result) ) {
                $msg = "No columns returned";
                $this->logAndThrowException($msg);
            }
        } catch (PDOException $e) {
            $this->logAndThrowException(
                "Error retrieving column names from '$schemaName'.'$tableName' ",
                array('exception' => $e, 'sql' => $sql, 'endpoint' => $this)
            );
        }

        $columnNames = array();
        foreach ( $result as $row ) {
            $columnNames[] = $row['name'];
        }

        return $columnNames;

    }  // getTableColumnNames()

    /* ------------------------------------------------------------------------------------------
     * Helper function used by specific data endpoint drivers to query the underlying
     * database to check if a schema exists.
     *
     * @param $sql The SQL statement used to query for the schema
     * @param $schemaName The name of the schema, or NULL to use the default schema for
     *    this endpoint
     * @param $sqlParameters An array of additional parameters for the SQL
     *   statement. Parameters here will override local parameters with the same key
     *
     * @return TRUE if the schema exists, FALSE if it does not
     * @throw Exception If an empty and non-NULL schema was provided
     * @throw Exception If tehre was an errir querying the database
     * ------------------------------------------------------------------------------------------
     */

    protected function executeSchemaExistsQuery($sql, $schemaName = null, array $sqlParameters = array())
    {
        if ( null === $schemaName ) {
            $schemaName = $this->getSchema();
        } elseif ( empty($schemaName) ) {
            $msg = "Schema name cannot be empty";
            $this->logAndThrowException($msg);
        }

        $localSqlParameters = array(":schema" => $schemaName);
        $localSqlParameters = array_merge($localSqlParameters, $sqlParameters);

        try {
            $dbh = $this->getHandle();
            $result = $dbh->query($sql, $localSqlParameters);
            if ( 0 == count($result) ) {
                return false;
            }
        } catch (\PdoException $e) {
            $this->logAndThrowException(
                "Error querying for schema '$schemaName'",
                array('exception' => $e, 'sql' => $sql, 'endpoint' => $this)
            );
        }

        return true;
    }  // executeSchemaExistsQuery()

    /* ------------------------------------------------------------------------------------------
     * @see aDataEndpoint::__toString()
     * ------------------------------------------------------------------------------------------
     */

    public function __toString()
    {
        return "('" . $this->name . "', class=" . get_class($this) . ", config={$this->config}, schema={$this->schema}" .
            (null !== $this->hostname ? ", host={$this->hostname}" : "" ) .
            (null !== $this->port ? ":{$this->port}" : "" ) .
            (null !== $this->username ? ", user={$this->username}" : "" ) .
            ")";
    }  // __toString()
}  // class aRdbmsEndpoint
