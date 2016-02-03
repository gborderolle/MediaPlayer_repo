using MySql.Data;
using MySql.Data.MySqlClient;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Text;

namespace MediaPlayer.Data_Generic
{
    public class DataAccessContext_MySQL : IDisposable
    {
        #region Fields

        protected bool _IsOpenConnection;
        protected MySqlConnection _SqlConnection;
        protected MySqlCommand _SqlCommand;
        protected string _StoredProcedureName;
        protected int _TimeOutSeconds;
        private const int c_DefaultTimeOutSeconds = 60;

        #endregion Fields

        #region Properties

        /// <summary>
        /// The default ConnectionString setup in Web.Config file for the application.
        /// </summary>
        public string ConnectionString
        {
            get { return DataAccessContext_MySQL.GetConnectionString(); }
        }

        /// <summary>
        /// Pulls the connection string from HttpContext if exists. Otherwise, it pulls from web config (DBConnectionString or InsalaCon)
        /// </summary>
        /// <returns>Connection string unencrypted</returns>
        internal static string GetConnectionString()
        {
            string connectionString = string.Empty;
            if (ConfigurationManager.AppSettings != null)
            {
                string server = ConfigurationManager.AppSettings["DB_Server"].ToString();
                string database = ConfigurationManager.AppSettings["DB_Name"].ToString();
                string uid = ConfigurationManager.AppSettings["DB_User"].ToString();
                string password = ConfigurationManager.AppSettings["DB_Password"].ToString();
                connectionString = "SERVER=" + server + ";" + "DATABASE=" + database + ";" + "UID=" + uid + ";" + "PASSWORD=" + password + ";";
            }
            return connectionString;
        }

        public bool IsOpenConnection
        {
            get { return _IsOpenConnection; }
            set { _IsOpenConnection = value; }
        }

        public int TimeOutSeconds
        {
            get { return _TimeOutSeconds; }
            set { _TimeOutSeconds = value; }
        }

        #endregion Properties

        #region Constructor

        public DataAccessContext_MySQL()
        {
            _IsOpenConnection = false;
            _SqlConnection = null;
            _SqlCommand = null;
            _StoredProcedureName = string.Empty;
            _TimeOutSeconds = c_DefaultTimeOutSeconds;
        }

        #endregion Constructor

        #region Instance Methods

        /// <summary>
        /// Opens a connection with the databse and sets the value of IsOpenConnection property to true.
        /// </summary>
        private void OpenConnection()
        {
            if (_IsOpenConnection)
            {
                CloseConnection();
            }
            _SqlConnection = new MySqlConnection(this.ConnectionString);

            _SqlConnection.Open();
            IsOpenConnection = true;
        }

        /// <summary>
        /// Closes the connection with the database and sets the value of IsOpenConnection to false.
        /// </summary>
        private void CloseConnection()
        {
            if (_SqlConnection != null)
            {
                _SqlConnection.Close();
            }
            IsOpenConnection = false;
        }

        #endregion Instance Methods

        #region Static Methods

        /// <summary>
        /// Returns a DataTable with stored procedure return values
        /// </summary>
        /// <param name="storedProcedureName">The stored procedure name</param>
        /// <param name="param">The stored procedure parameter</param>
        /// <returns>DataTable</returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataTable GetDataTable(string storedProcedureName, MySqlParameter param)
        {
            DataTable dt = new DataTable();
            if (!string.IsNullOrWhiteSpace(storedProcedureName))
            {
                this.OpenConnection();
                this._StoredProcedureName = storedProcedureName;
                this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);
                this._SqlCommand.CommandType = CommandType.StoredProcedure;
                this._SqlCommand.Parameters.Add(param);
                try
                {
                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                    {
                        adapter.Fill(dt);
                    }
                }
                catch (Exception)
                {
                    this.CloseConnection();
                    throw;
                }
                this.CloseConnection();
            }
            return dt;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataTable GetDataTableQuery(string query)
        {
            DataTable dt = new DataTable();
            if (!string.IsNullOrWhiteSpace(query))
            {
                this.OpenConnection();
                this._SqlCommand = new MySqlCommand(query, this._SqlConnection);
                try
                {
                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                    {
                        adapter.Fill(dt);
                    }
                }
                catch (Exception)
                {
                    this.CloseConnection();
                    throw;
                }
                this.CloseConnection();
            }
            return dt;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataTable GetDataTableQuery(string query, Hashtable param, int timeout = 0)
        {
            DataTable dt = new DataTable();
            if (!string.IsNullOrWhiteSpace(query))
            {
                this.OpenConnection();
                this._SqlCommand = new MySqlCommand(query, this._SqlConnection);
                if (param != null)
                {
                    foreach (DictionaryEntry d in param)
                    {
                        object paramValue = d.Value;
                        if (paramValue == null)
                        {
                            paramValue = DBNull.Value;
                        }
                        this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), paramValue));
                    }
                }
                if (timeout > 0)
                {
                    this._SqlCommand.CommandTimeout = timeout;
                }
                try
                {
                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                    {
                        adapter.Fill(dt);
                    }
                }
                catch (Exception)
                {
                    this.CloseConnection();
                    throw;
                }
                this.CloseConnection();
            }
            return dt;
        }

        /// <summary>
        /// Returns a DataTable with rows from stored procedure
        /// </summary>
        /// <param name="storedProcedureName">The stored procedure name</param>
        /// <param name="param">The stored procedure parameter(s) name and value as a key->value pair hashtable.</param>
        /// <remarks>Consumming this function: Hashtable s = new Hashtable(); s.Add("@UserID", DBNull.Value); DataAccessObject.GetDataTable("dbo.GetUserByID", s);</remarks>
        /// <returns>DataTable</returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataTable GetDataTable(string storedProcedureName, Hashtable param)
        {
            if (string.IsNullOrWhiteSpace(storedProcedureName))
            {
                throw new Exception("The query is empty!");
            }
            this.OpenConnection();
            this._StoredProcedureName = storedProcedureName;
            this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);
            this._SqlCommand.CommandType = CommandType.StoredProcedure;
            if (param != null)
            {
                foreach (DictionaryEntry d in param)
                {
                    object paramValue = d.Value;
                    if (paramValue == null)
                    {
                        paramValue = DBNull.Value;
                    }
                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), paramValue));
                }
            }
            DataTable dt = new DataTable();
            try
            {
                using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                {
                    adapter.Fill(dt);
                }
                this.CloseConnection();
                return dt;
            }
            catch (Exception)
            {
                this.CloseConnection();
                throw;
            }
        }

        /// <summary>
        /// Returns a DataTable with rows from stored procedure
        /// </summary>
        /// <param name="storedProcedureName">The stored procedure name</param>
        /// <param name="param">The stored procedure parameter(s) name and value as a key->value pair hashtable.</param>
        /// <param name="timeOut">The time in seconds to wait for the command to execute. If value is zero, use default timeout.</param>
        /// <remarks>Consumming this function: Hashtable s = new Hashtable(); s.Add("@UserID", DBNull.Value); DataAccessObject.GetDataTable("dbo.GetUserByID", s);</remarks>
        /// <returns>DataTable</returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataTable GetDataTable(string storedProcedureName, Hashtable param, int timeOut)
        {
            if (string.IsNullOrWhiteSpace(storedProcedureName))
            {
                throw new Exception("The query is empty!");
            }
            this.OpenConnection();
            this._StoredProcedureName = storedProcedureName;
            this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);

            //apply the timeout
            if (timeOut > 0)
            {
                this._SqlCommand.CommandTimeout = timeOut;
            }
            this._SqlCommand.CommandType = CommandType.StoredProcedure;
            if (param != null)
            {
                foreach (DictionaryEntry d in param)
                {
                    object paramValue = d.Value;
                    if (paramValue == null)
                    {
                        paramValue = DBNull.Value;
                    }
                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), d.Value));
                }
            }
            DataTable dt = new DataTable();
            try
            {
                using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                {
                    adapter.Fill(dt);
                }
                this.CloseConnection();
                return dt;
            }
            catch (Exception)
            {
                this.CloseConnection();
                throw;
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected int ExecuteNonQueryFromQuery(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                throw new Exception("The query is empty!");
            }
            this.OpenConnection();
            this._SqlCommand = new MySqlCommand(query, this._SqlConnection);
            int affected = 0;
            try
            {
                affected = this._SqlCommand.ExecuteNonQuery();
                this.CloseConnection();
                return affected;
            }
            catch (Exception)
            {
                this.CloseConnection();
                throw;
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected int ExecuteNonQueryFromQuery(string query, Hashtable param)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                throw new Exception("The query is empty!");
            }
            this.OpenConnection();
            this._SqlCommand = new MySqlCommand(query, this._SqlConnection);
            if (param != null)
            {
                foreach (DictionaryEntry d in param)
                {
                    object value = d.Value;
                    if (value == null)
                    {
                        value = DBNull.Value;
                    }
                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), value));
                }
            }
            int affected = 0;
            try
            {
                affected = this._SqlCommand.ExecuteNonQuery();
            }
            catch (Exception)
            {
                this.CloseConnection();
                throw;
            }
            this.CloseConnection();
            return affected;
        }

        /// <summary>
        /// Executes a sql statement and returns the OUTPUT parameter in the stored procedure.
        /// </summary>
        protected int ExecuteNonQueryFromSproc(string storedProcedureName, Hashtable param, string idParam)
        {
            return ExecuteNonQueryFromSproc(storedProcedureName, param, idParam, false);
        }

        /// <summary>
        /// Insert/Update procedures
        /// </summary>
        /// <param name="storedProcedureName">stored procedure name</param>
        /// <param name="param">The stored procedure parameter(s) name and value as a key->value pair hashtable.</param>
        /// <param name="idParam">the name of the ID parameter set as "output" in the sproc</param>
        /// <param name="executeScalar"></param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected int ExecuteNonQueryFromSproc(string storedProcedureName, Hashtable param, string idParam, bool executeScalar)
        {
            int id = 0;
            this.OpenConnection();
            this._StoredProcedureName = storedProcedureName;
            this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);

            //apply the timeout
            if (this._TimeOutSeconds > c_DefaultTimeOutSeconds)
            {
                this._SqlCommand.CommandTimeout = _TimeOutSeconds;
            }
            this._SqlCommand.CommandType = CommandType.StoredProcedure;
            if (param != null)
            {
                foreach (DictionaryEntry d in param)
                {
                    object nullValue = d.Value;
                    if (nullValue == null)
                    {
                        nullValue = DBNull.Value;
                    }

                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), nullValue));

                    //for sprocs that return an incremental ID as integer
                    if (!string.IsNullOrWhiteSpace(idParam))
                    {
                        if (d.Key.ToString() == idParam)
                        {
                            if (nullValue == DBNull.Value)
                            {
                                if (!executeScalar)
                                {
                                    this._SqlCommand.Parameters[idParam].Direction = ParameterDirection.Output;
                                    this._SqlCommand.Parameters[idParam].MySqlDbType = MySqlDbType.Int16;
                                }
                            }
                        }
                    }
                }
            }
            if (executeScalar)
            {
                try
                {
                    id = int.Parse(this._SqlCommand.ExecuteScalar().ToString());
                }
                catch (Exception)
                {
                    this.CloseConnection();
                    throw;
                }
            }
            else
            {
                try
                {
                    id = this._SqlCommand.ExecuteNonQuery();
                    if (!string.IsNullOrWhiteSpace(idParam))
                    {
                        id = Convert.ToInt32(this._SqlCommand.Parameters[idParam].Value);
                    }
                }
                catch (Exception)
                {
                    this.CloseConnection();
                    throw;
                }
            }
            this.CloseConnection();
            return id;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected object ExecuteScalarQuery(bool IsStoredProcedure, string query, Hashtable param)
        {
            this.OpenConnection();
            this._StoredProcedureName = query;
            this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);

            //apply the timeout
            if (this._TimeOutSeconds > c_DefaultTimeOutSeconds)
            {
                this._SqlCommand.CommandTimeout = _TimeOutSeconds;
            }
            if (IsStoredProcedure)
            {
                this._SqlCommand.CommandType = CommandType.StoredProcedure;
            }
            else
            {
                this._SqlCommand.CommandType = CommandType.Text;
            }
            if (param != null)
            {
                foreach (DictionaryEntry d in param)
                {
                    object nullValue = d.Value;
                    if (nullValue == null)
                    {
                        nullValue = DBNull.Value;
                    }

                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), nullValue));
                }
            }
            object retValue = null;
            try
            {
                retValue = this._SqlCommand.ExecuteScalar().ToString();
            }
            catch (Exception)
            {
                this.CloseConnection();
                throw;
            }
            this.CloseConnection();
            return retValue;
        }

        #endregion Static Methods

        #region DataSets

        /// <summary>
        /// Execute a Stored Procedure and returns the result as a DataSet
        /// </summary>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataSet GetDataSet(string storedProcedureName, Hashtable param, int timeout = 0)
        {
            if (param == null || param.Count == 0)
            {
                throw new Exception("Parameter hashtable is empty!");
            }
            this.OpenConnection();
            this._StoredProcedureName = storedProcedureName;
            this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);
            this._SqlCommand.CommandType = CommandType.StoredProcedure;
            if (timeout > 0)
            {
                this._SqlCommand.CommandTimeout = timeout;
            }
            foreach (DictionaryEntry d in param)
            {
                object paramValue = d.Value;
                if (paramValue == null)
                {
                    paramValue = DBNull.Value;
                }

                this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), d.Value));
            }
            DataSet ds = new DataSet();
            try
            {
                using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                {
                    adapter.Fill(ds);
                }
            }
            catch
            {
                this.CloseConnection();
                throw;
            }
            this.CloseConnection();
            return ds;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected DataSet GetDataSet(string query)
        {
            DataSet ds = new DataSet();
            if (!string.IsNullOrWhiteSpace(query))
            {
                this.OpenConnection();
                this._SqlCommand = new MySqlCommand(query, this._SqlConnection);
                try
                {
                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(this._SqlCommand))
                    {
                        adapter.Fill(ds);
                    }
                }
                catch (Exception)
                {
                    this.CloseConnection();
                    throw;
                }
                this.CloseConnection();
            }
            return ds;
        }

        #endregion DataSets

        /// <summary>
        /// Execute a proc and return the results as a data reader.
        /// The reader and connection must be closed by the calling function!
        /// </summary>
        /// <remarks>
        /// For speed optimisations.
        /// </remarks>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected MySqlDataReader ExecuteReader(string storedProcedureName, Hashtable param)
        {
            _SqlConnection = new MySqlConnection(this.ConnectionString);
            this._IsOpenConnection = true;
            _SqlConnection.Open();
            this._StoredProcedureName = storedProcedureName;
            this._SqlCommand = new MySqlCommand(this._StoredProcedureName, this._SqlConnection);
            this._SqlCommand.CommandType = CommandType.StoredProcedure;

            //apply the timeout
            if (this._TimeOutSeconds > c_DefaultTimeOutSeconds)
            {
                this._SqlCommand.CommandTimeout = _TimeOutSeconds;
            }
            if (param != null)
            {
                //add the parameters
                foreach (DictionaryEntry d in param)
                {
                    object paramValue = d.Value;
                    if (paramValue == null)
                    {
                        paramValue = DBNull.Value;
                    }

                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), d.Value));
                }
            }
            return _SqlCommand.ExecuteReader();
        }

        /// <summary>
        /// Execute a proc and return the results as a data reader.
        /// The reader and connection must be closed by the calling function!
        /// </summary>
        /// <remarks>
        /// For speed optimisations.
        /// </remarks>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Security", "CA2100:Review MySql queries for security vulnerabilities")]
        protected MySqlDataReader ExecuteReaderQuery(string query, Hashtable param)
        {
            _SqlConnection = new MySqlConnection(this.ConnectionString);
            this._IsOpenConnection = true;
            _SqlConnection.Open();
            this._SqlCommand = new MySqlCommand(query, this._SqlConnection);

            //apply the timeout
            if (this._TimeOutSeconds > c_DefaultTimeOutSeconds)
            {
                this._SqlCommand.CommandTimeout = _TimeOutSeconds;
            }
            if (param != null)
            {
                //add the parameters
                foreach (DictionaryEntry d in param)
                {
                    object paramValue = d.Value;
                    if (paramValue == null)
                    {
                        paramValue = DBNull.Value;
                    }

                    this._SqlCommand.Parameters.Add(new MySqlParameter(d.Key.ToString(), d.Value));
                }
            }
            return _SqlCommand.ExecuteReader();
        }

        protected virtual void Dispose(bool dispose)
        {
            if (dispose)
            {
                if (_SqlConnection != null)
                {
                    if (_SqlConnection.State != ConnectionState.Closed)
                        _SqlConnection.Close();
                    _SqlConnection.Dispose();
                }
                if (_SqlCommand != null)
                {
                    _SqlCommand.Dispose();
                }
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}