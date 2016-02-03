using MediaPlayer.Domain;
using MediaPlayer.Extras;
using MediaPlayer.Global;
using MySql.Data.MySqlClient;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;

namespace MediaPlayer.Data_Objects
{
    internal class UserDAO : Data_Generic.DataAccessObject
    {
        public UserDAO()
        {
        }

        internal static void Fill(User user)
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            string query = "SELECT userName,groupName,password,passwordDate,deleted,disabled,dateCreated,dateDeleted,dateDisabled FROM incuser WHERE id = @id";
            Hashtable param = new Hashtable();
            param.Add("@id", user.id);

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para obtener todos los folios. QUERY: %s", className, methodName, query);

            using (DataTable dt = ExecuteDataTableQuery(query, param))
            {
                if (dt != null && dt.Rows.Count > 0)
                {
                    // #3- Logger post query
                    Logger.LogDebug("Row count: %s", dt.Rows.Count.ToString());

                    DataRow row = dt.Rows[0];
                    user.id = user.id;
                    user.userName = (row["userName"] != DBNull.Value) ? row["userName"].ToString() : string.Empty;
                    user.groupName = (row["groupName"] != DBNull.Value) ? row["groupName"].ToString() : string.Empty;
                    user.password = (row["password"] != DBNull.Value) ? row["password"].ToString() : string.Empty;
                    user.passwordDate = (row["passwordDate"] != DBNull.Value) ? DateTime.Parse(row["passwordDate"].ToString()) : DateTime.Now;
                    user.deleted = (row["deleted"] != DBNull.Value) ? int.Parse(row["deleted"].ToString()) : 0;
                    user.disabled = (row["disabled"] != DBNull.Value) ? int.Parse(row["disabled"].ToString()) : 0;
                    user.dateCreated = (row["dateCreated"] != DBNull.Value) ? DateTime.Parse(row["dateCreated"].ToString()) : DateTime.Now;
                    user.dateDeleted = (row["dateDeleted"] != DBNull.Value) ? DateTime.Parse(row["dateDeleted"].ToString()) : DateTime.Now;
                    user.dateDisabled = (row["dateDisabled"] != DBNull.Value) ? DateTime.Parse(row["dateDisabled"].ToString()) : DateTime.Now;
                }
            }
        }

        internal static void FillByUserName(User user)
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            string query = "SELECT id, groupName,password,passwordDate,deleted,disabled,dateCreated,dateDeleted,dateDisabled FROM incuser WHERE userName = @userName";
            Hashtable param = new Hashtable();
            param.Add("@userName", user.userName);

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para obtener todos los folios. QUERY: %s", className, methodName, query);

            using (DataTable dt = ExecuteDataTableQuery(query, param))
            {
                if (dt != null && dt.Rows.Count > 0)
                {
                    // #3- Logger post query
                    Logger.LogDebug("Row count: %s", dt.Rows.Count.ToString());

                    DataRow row = dt.Rows[0];
                    user.userName = user.userName;
                    user.id = (row["id"] != DBNull.Value) ? row["id"].ToString() : string.Empty;
                    user.groupName = (row["groupName"] != DBNull.Value) ? row["groupName"].ToString() : string.Empty;
                    user.password = (row["password"] != DBNull.Value) ? row["password"].ToString() : string.Empty;
                    user.passwordDate = (row["passwordDate"] != DBNull.Value) ? DateTime.Parse(row["passwordDate"].ToString()) : DateTime.Now;
                    user.deleted = (row["deleted"] != DBNull.Value) ? int.Parse(row["deleted"].ToString()) : 0;
                    user.disabled = (row["disabled"] != DBNull.Value) ? int.Parse(row["disabled"].ToString()) : 0;
                    user.dateCreated = (row["dateCreated"] != DBNull.Value) ? DateTime.Parse(row["dateCreated"].ToString()) : DateTime.Now;
                    user.dateDeleted = (row["dateDeleted"] != DBNull.Value) ? DateTime.Parse(row["dateDeleted"].ToString()) : DateTime.Now;
                    user.dateDisabled = (row["dateDisabled"] != DBNull.Value) ? DateTime.Parse(row["dateDisabled"].ToString()) : DateTime.Now;
                }
            }
        }

        #region Static Methods

        /// <summary>
        /// Retrieve role groups from DB
        /// </summary>
        /// <returns></returns>
        internal static List<Tuple<int, string>> GetUserGroups()
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            List<Tuple<int, string>> result = new List<Tuple<int, string>>();
            Hashtable param = new Hashtable();
            string query = "SELECT id,groupName FROM orkgroup WHERE securityGroup = 0";

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para obtener todos los folios. QUERY: %s", className, methodName, query);

            using (DataTable dt = ExecuteDataTableQuery(query, param))
            {
                if (dt != null && dt.Rows.Count > 0)
                {
                    // #3- Logger post query
                    Logger.LogDebug("Row count: %s", dt.Rows.Count.ToString());

                    Tuple<int, string> tupla = null;
                    foreach (DataRow dr in dt.Rows)
                    {
                        tupla = new Tuple<int, string>(int.Parse(dr["id"].ToString()), dr["groupName"].ToString());
                        result.Add(tupla);
                    }
                }
            }
            return result;
        }

        /// <summary>
        /// Retrieve role groups from folio results
        /// </summary>
        /// <param name="list"></param>
        /// <returns></returns>
        internal static List<string> GetUserGroups(List<Folio> list)
        {
            List<string> ret = new List<string>();
            if (list != null && list.Count > 0)
            {
                var distinct_list = list.GroupBy(item => item.groupName);
                if (distinct_list != null)
                {
                    var sublist = distinct_list.Select(grp => grp.OrderBy(item => item.timestamp).First());
                    if (sublist != null)
                    {
                        List<Folio> filtered_list = sublist.Where(item => item.groupName != "").ToList();
                        if (filtered_list != null && filtered_list.Count > 0)
                        {
                            foreach (Folio folio in filtered_list)
                            {
                                ret.Add(folio.groupName);
                            }
                        }
                    }
                }
            }
            return ret;
        }

        #endregion Static Methods
    }
}