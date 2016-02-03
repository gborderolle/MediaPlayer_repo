using MediaPlayer.Data_Objects;
using MediaPlayer.Domain;
using MediaPlayer.Extras;
using MySql.Data.MySqlClient;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MediaPlayer.Global
{
    public static class GlobalMethods
    {
        public static string CheckLogin(string user, string password, bool isPasswordInput_hashed = false, bool isTokenLogin = false)
        {
            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.CheckLogin(user, password, isPasswordInput_hashed, isTokenLogin);
        }

        internal static List<Folio> GetAllFolios(string text_search = "")
        {
            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.GetAllFolios(text_search);
        }

        public static int AddFolioComment(string userID, string folioID, string comment, DateTime date, int duration)
        {
            Logger.LogDebug("Log Test AddFolioComment.aspx.cs");

            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.AddFolioComment(userID, folioID, comment, date, duration);
        }

        public static bool RemoveTimelineElement(int tapeID, bool isExtra)
        {
            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.RemoveTimelineElement(tapeID, isExtra);
        }

        public static bool AddFolioFile(string userID, string folioID, string fileName, DateTime date, int duration, string mediaType, string relativeLocalPath)
        {
            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.AddFolioFile(userID, folioID, fileName, date, duration, mediaType, relativeLocalPath);
        }

        public static List<string> GetMediaTypes()
        {
            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.GetMediaTypes();
        }
    }
}