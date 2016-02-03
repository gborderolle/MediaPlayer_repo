using MediaPlayer.Domain;
using MediaPlayer.Extras;
using MediaPlayer.Security;
using MySql.Data.MySqlClient;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;

namespace MediaPlayer.Data_Objects
{
    internal class ExternalsMethodDAO : Data_Generic.DataAccessObject
    {
        public ExternalsMethodDAO()
        {
        }

        public string CheckLogin(string username, string password, bool isPasswordInput_hashed, bool isTokenLogin = false)
        {
            string result = string.Empty;
            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                User user = new User("", username);
                if (user != null && !string.IsNullOrWhiteSpace(user.id) && user.deleted != 1 && user.disabled != 1)
                {
                    if (!isTokenLogin)
                    {
                        // If is hashed in DB, then get my input password hashed
                        string password_hash = password;
                        if (!isPasswordInput_hashed)
                        {
                            password_hash = BCrypt.HashPassword(password, user.password);
                        }

                        if (user.password.Equals(password_hash))
                        {
                            result = user.id;
                        }
                    }
                    else
                    {
                        result = user.id;
                    }
                }
            }
            return result;
        }

        public List<Folio> GetAllFolios(string folio_textID = "")
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            List<Folio> result = new List<Folio>();

            string query = "SELECT ";
            query += "	ifnull(tag.text, '') as 'folioID', ";
            query += "	tape.id as 'tapeID', ";
            query += "	seg.id as 'segmentID', ";
            query += "	ifnull(user.groupName, '') as 'groupName', ";
            query += "	ifnull(user.userName, '') as 'userName', ";
            query += "	seg.localparty as 'localparty', ";
            query += "	seg.remoteParty as 'remoteParty', ";
            query += "	seg.timestamp as 'timestamp', ";
            query += "	seg.duration as 'duration', ";
            query += "	tape.mediaType 'mediaType', ";
            query += "	tape.deleted as 'deleted', ";
            query += "	tape.filename as 'fileName', ";
            query += "	'' as 'filePath', ";
            query += "	'OK' as 'fileStatus', ";
            query += "	'0' as 'isExtra' ";

            query += "FROM orksegment as seg ";
            query += "JOIN orktape as tape ";
            query += "	on seg.tape_id = tape.id ";
            query += "JOIN ( ";
            query += "	SELECT taggedSegment_id, t.text ";
            query += "	FROM orktag as t JOIN orktagtype as tt ON t.tagType_id = tt.id ";
            query += "	AND tt.name = 'folio' AND t.text = '" + folio_textID + "' ";
            query += "	) as tag ";
            query += "	ON seg.id = tag.taggedSegment_id ";
            query += "LEFT JOIN ( ";
            query += "	SELECT taggedSegment_id, t.text ";
            query += "	FROM orktag as t JOIN orktagtype as tt ON t.tagType_id = tt.id ";
            query += "	AND tt.name = 'usuario' ";
            query += "	) as segUser ";
            query += "	ON seg.id = segUser.taggedSegment_id ";
            query += "LEFT JOIN incuser as user ";
            query += "	ON segUser.text = user.id  ";
            query += "WHERE tape.deleted = 0 ";

            query += "UNION ALL  ";

            query += "SELECT ";
            query += "	extras.folio as 'folioID', ";
            query += "	extras.id as 'tapeID', ";
            query += "	extras.id as 'segmentID', ";
            query += "	ifnull(user.groupName, '') as 'groupName',  ";
            query += "	ifnull(user.userName, '') as 'userName', ";
            query += "	extras.localparty as 'localparty', ";
            query += "	extras.remoteParty as 'remoteparty', ";
            query += "	extras.timestamp as 'timestamp', ";
            query += "	extras.duration as 'duration', ";
            query += "	extras.mediaType 'mediaType', ";
            query += "	extras.deleted as 'deleted', ";
            query += "	extras.filename as 'fileName', ";
            query += "	extras.filePath as 'filePath', ";
            query += "	extras.fileStatus as 'fileStatus', ";
            query += "	'1' as 'isExtra' ";

            query += "FROM incextras as extras  ";
            query += "LEFT JOIN incuser as user ";
            query += "	ON extras.userId = user.id ";
            query += "WHERE extras.folio = '" + folio_textID + "' ";
            query += "AND extras.deleted = 0 ";

            query += "ORDER BY timeStamp ASC; ";

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para obtener todos los folios. QUERY: %s", className, methodName, query);

            Hashtable param = new Hashtable();
            param.Add("@folioID", folio_textID);
            using (DataTable dt = ExecuteDataTableQuery(query, param))
            {
                if (dt != null && dt.Rows.Count > 0)
                {
                    // #3- Logger post query
                    Logger.LogDebug("Row count: %s", dt.Rows.Count.ToString());

                    foreach (DataRow row in dt.Rows)
                    {
                        Folio folio = new Folio();
                        folio.folio_textID = (row["folioID"] != DBNull.Value) ? row["folioID"].ToString() : string.Empty;
                        folio.tapeID = (row["tapeID"] != DBNull.Value) ? int.Parse(row["tapeID"].ToString()) : 0;
                        folio.segmentID = (row["segmentID"] != DBNull.Value) ? int.Parse(row["segmentID"].ToString()) : 0;
                        folio.groupName = (row["groupName"] != DBNull.Value) ? row["groupName"].ToString() : string.Empty;
                        folio.userName = (row["userName"] != DBNull.Value) ? row["userName"].ToString() : string.Empty;
                        folio.localParty = (row["localParty"] != DBNull.Value) ? row["localParty"].ToString() : string.Empty;
                        folio.remoteParty = (row["remoteParty"] != DBNull.Value) ? row["remoteParty"].ToString() : string.Empty;
                        folio.timestamp = (row["timestamp"] != DBNull.Value) ? DateTime.Parse(row["timestamp"].ToString()) : DateTime.Now;
                        folio.duration = (row["duration"] != DBNull.Value) ? int.Parse(row["duration"].ToString()) : 0;
                        folio.mediaType = (row["mediaType"] != DBNull.Value) ? row["mediaType"].ToString() : string.Empty;
                        folio.deleted = (row["deleted"] != DBNull.Value) ? int.Parse(row["deleted"].ToString()) : 0;
                        folio.fileName = (row["fileName"] != DBNull.Value) ? row["fileName"].ToString() : string.Empty;
                        folio.filePath = (row["filePath"] != DBNull.Value) ? row["filePath"].ToString() : string.Empty;
                        folio.fileStatus = (row["fileStatus"] != DBNull.Value) ? row["fileStatus"].ToString() : string.Empty;

                        switch (folio.mediaType)
                        {
                            case "A":
                                {
                                    folio.TapeType_code = Folio.EnumTapeType_code.Audio;
                                    break;
                                }
                            case "S":
                                {
                                    folio.TapeType_code = Folio.EnumTapeType_code.Grabacion;
                                    break;
                                }
                            case "V":
                                {
                                    folio.TapeType_code = Folio.EnumTapeType_code.Video;
                                    break;
                                }
                            case "D":
                                {
                                    folio.TapeType_code = Folio.EnumTapeType_code.Documento;
                                    break;
                                }
                            case "C":
                                {
                                    folio.TapeType_code = Folio.EnumTapeType_code.Comentario;
                                    break;
                                }
                        }

                        result.Add(folio);
                    }
                }
            }

            return result;
        }

        public int AddFolioComment(string userID, string folioID, string comment, DateTime date, int duration)
        {
            Logger.LogDebug("Log Test ExternalMethodsDAO.cs");

            int res = 0;
            if (!string.IsNullOrWhiteSpace(userID) && !string.IsNullOrWhiteSpace(folioID) && !string.IsNullOrWhiteSpace(comment))
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                string query = "INSERT INTO incextras (duration, expiryTimestamp, filename, filePath, localParty, mediaType, ";
                query += "remoteParty, timestamp, userId, folio, deleted, fileStatus) ";
                query += "VALUES (@duration, @expiryTimestamp, @filename, @filePath, @localParty, @mediaType, ";
                query += "@remoteParty, @timestamp, @userId, @folio, @deleted, @fileStatus); ";

                Hashtable param = new Hashtable();
                param.Add("@duration", duration);
                param.Add("@expiryTimestamp", "");
                param.Add("@filename", comment); // Comentario acá
                param.Add("@filePath", "");
                param.Add("@localParty", userID);
                param.Add("@mediaType", "C");
                param.Add("@remoteParty", "");
                param.Add("@timestamp", date);
                param.Add("@userId", userID); // "id" de orkuser
                param.Add("@folio", folioID);
                param.Add("@deleted", 0);
                param.Add("@fileStatus", "OK");

                // #2- Logger pre query
                Logger.LogDebug("(%s) (%s) -- Ejecuta query para agregar un comentario al folio y retorna el ID insertado. QUERY: %s", className, methodName, query);
                res = ExecuteNonQuery(query, param);

                if (res > 0)
                {
                    query = "SELECT LAST_INSERT_ID() as ID;";
                    using (MySqlDataReader reader = ExecuteReaderQuery(query, param))
                    {
                        DataTable dt = new DataTable();
                        dt.Load(reader);
                        if (dt.Rows.Count > 0 && dt.Rows[0] != null && dt.Rows[0].ItemArray.Length > 0 && dt.Rows[0].ItemArray[0] != null)
                        {
                            string ID_str = dt.Rows[0].ItemArray[0].ToString();
                            if (!int.TryParse(ID_str, out res))
                            {
                                res = 0;
                            }
                        }
                    }
                }

                //res = ExecuteNonQuery(query, param);
            }
            return res;
        }

        public bool RemoveTimelineElement(int tapeID, bool isExtra)
        {
            int res = 0;
            if (tapeID > 0)
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                string table = isExtra ? "incextras" : "orktape";
                string query = "UPDATE " + table + " SET deleted = 1 WHERE id = @tapeID";

                Hashtable param = new Hashtable();
                param.Add("@tapeID", tapeID);

                // #2- Logger pre query
                Logger.LogDebug("(%s) (%s) -- Ejecuta query para eliminar un elemento. QUERY: %s", className, methodName, query);
                res = ExecuteNonQuery(query, param);
            }
            return res > 0;
        }

        public bool AddFolioFile(string userID, string folioID, string fileName, DateTime date, int duration, string mediaType, string relativeLocalPath)
        {
            int res = 0;
            if (!string.IsNullOrWhiteSpace(userID) && !string.IsNullOrWhiteSpace(folioID) && !string.IsNullOrWhiteSpace(fileName) && !string.IsNullOrWhiteSpace(mediaType))
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                string query = "INSERT INTO incextras (duration, expiryTimestamp, filename, filePath, localParty, mediaType, ";
                query += "remoteParty, timestamp, userId, folio, deleted, fileStatus) ";
                query += "VALUES (@duration, @expiryTimestamp, @filename, @filePath, @localParty, @mediaType, ";
                query += "@remoteParty, @timestamp, @userId, @folio, @deleted, @fileStatus) ";

                Hashtable param = new Hashtable();
                param.Add("@duration", duration);
                param.Add("@expiryTimestamp", "");
                param.Add("@filename", fileName); // Comentario acá
                param.Add("@filePath", relativeLocalPath);
                param.Add("@localParty", "");
                param.Add("@mediaType", mediaType);
                param.Add("@remoteParty", "");
                param.Add("@timestamp", date);
                param.Add("@userId", userID); // "id" de orkuser
                param.Add("@folio", folioID);
                param.Add("@deleted", 0);
                param.Add("@fileStatus", "OK");

                // #2- Logger pre query
                Logger.LogDebug("(%s) (%s) -- Ejecuta query para agregar un archivo al folio. QUERY: %s", className, methodName, query);
                res = ExecuteNonQuery(query, param);
            }
            return res > 0;
        }

        public List<string> GetMediaTypes()
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            List<string> result = new List<string>();
            Hashtable param = new Hashtable();
            string query = "SELECT DISTINCT(mediaType) FROM (SELECT mediaType FROM orktape WHERE deleted = 0 UNION ALL SELECT mediaType FROM incextras WHERE deleted = 0) Q";

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para obtener todos los distintos media types. QUERY: %s", className, methodName, query);

            using (DataTable dt = ExecuteDataTableQuery(query, param))
            {
                if (dt != null && dt.Rows.Count > 0)
                {
                    // #3- Logger post query
                    Logger.LogDebug("Row count: %s", dt.Rows.Count.ToString());

                    foreach (DataRow dr in dt.Rows)
                    {
                        result.Add(dr["mediaType"].ToString());
                    }
                }
            }
            return result;
        }

        public UserToken GetUserToken(string token)
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            UserToken userToken = null;

            string query = "SELECT userName, password FROM incuser WHERE token = @token";

            Hashtable param = new Hashtable();
            param.Add("@token", token);

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para obtener un usuario por el token y en caso de encontrarlo lo limpia. QUERY: %s", className, methodName, query);

            using (DataTable dt = ExecuteDataTableQuery(query, param))
            {
                if (dt != null && dt.Rows.Count > 0)
                {
                    userToken = new UserToken();
                    userToken.Token = token;

                    // #3- Logger post query
                    Logger.LogDebug("Row count: %s", dt.Rows.Count.ToString());

                    foreach (DataRow dr in dt.Rows)
                    {
                        userToken.User = dr["userName"].ToString();
                        userToken.Password = dr["password"].ToString();
                    }

                    // Clear user token
                    ExecuteDataTableQuery("UPDATE incuser SET token = '' WHERE token = @token; ", param);
                }
            }
            return userToken;
        }

        internal void AddUserToken(UserToken userToken)
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            string query = "INSERT INTO incuser(userName,password,token)";
            query += "VALUES (@userName, @password, @token) ";

            Hashtable param = new Hashtable();
            param.Add("@userName", userToken.User);
            param.Add("@password", userToken.Password);
            param.Add("@token", userToken.Token); // Comentario acá

            // #2- Logger pre query
            Logger.LogDebug("(%s) (%s) -- Ejecuta query para agregar un comentario al folio. QUERY: %s", className, methodName, query);
        }
    }
}