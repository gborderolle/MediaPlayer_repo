using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MediaPlayer.Global
{
    public static class GlobalVariables
    {
        #region Paths

        public static string MyDocumentsPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);

        public static string PathData = GlobalVariables.MyDocumentsPath + @"\MediaPlayer\logs\";

        public static string PathErrorLog_server = GlobalVariables.PathData + "ErrorLog_server.txt";

        public static string PathErrorLog_client = GlobalVariables.PathData + "ErrorLog_client.txt";

        public static string PathExports = GlobalVariables.PathData + @"exports\";

        #endregion Paths
    }
}