using Microsoft.Win32;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;

namespace MediaPlayer.Extras
{
    internal static class Logger
    {
        //Parametros para logs en el event viewer
        private const string eventLogSource = "PROMAD_MediaPlayer";

        private const string eventLogLog = "Application";
        private const string eventLogMachine = ".";

        //Ruta donde se va a dejar la carpeta de los (en caso que se quiera cambiar). En este caso quedarían en C:\inConcert\Logs
        private const string logCommonFolder = "C:\\";

        //Nombre de aplicacion con que se logueara en la carpeta de la LibBlogger
        private const string logApplicationId = "PROMAD_MediaPlayer";

        //Objeto que implementa las funciones de la libBlogger
        private static LibBlogger libBlogger;

        /* Funciones para log en el event viewer */

        public static void EventLogInfo(string msg, params string[] args)
        {
            if (!EventLog.SourceExists(eventLogSource, eventLogMachine))
                EventLog.CreateEventSource(eventLogSource, eventLogLog);

            //Formateo el string a loguear usando el array de parametros recibidos.
            msg = FormatString(msg, args);

            EventLog.WriteEntry(eventLogSource, msg, EventLogEntryType.Information);
        }

        public static void EventLogError(string msg, params string[] args)
        {
            if (!EventLog.SourceExists(eventLogSource, eventLogMachine))
                EventLog.CreateEventSource(eventLogSource, eventLogLog);

            //Formateo el string a loguear usando el array de parametros recibidos.
            msg = FormatString(msg, args);

            EventLog.WriteEntry(eventLogSource, msg, EventLogEntryType.Error);
        }

        /* Funciones para log de libBlogger */

        public static void LogDebug(string msg, params string[] args)
        {
            try
            {
                if (libBlogger == null)
                {
                    //Piso la carpeta del usuario para que todos los logs vayan a una carpeta unica, independientemente del usuario que lo ejecute
                    Environment.SetEnvironmentVariable("USERPROFILE", logCommonFolder);

                    libBlogger = new LibBlogger();
                    libBlogger.Init(logApplicationId);
                }

                libBlogger.LogDebug(msg, args);
            }
            catch (Exception ex)
            {
                EventLogError("No se pudo escribir mensaje en log de inConcert.\r\n\r\n" + msg + "\r\n\r\n" + ex.Message + "\r\n\r\n" + ex.StackTrace);
            }
        }

        public static void LogInfo(string msg, params string[] args)
        {
            try
            {
                if (libBlogger == null)
                {
                    //Piso la carpeta del usuario para que todos los logs vayan a una carpeta unica, independientemente del usuario que lo ejecute
                    Environment.SetEnvironmentVariable("USERPROFILE", logCommonFolder);

                    libBlogger = new LibBlogger();
                    libBlogger.Init(logApplicationId);
                }

                libBlogger.LogInfo(msg, args);
            }
            catch (Exception ex)
            {
                EventLogError("No se pudo escribir mensaje en log de inConcert.\r\n\r\n" + msg + "\r\n\r\n" + ex.Message + "\r\n\r\n" + ex.StackTrace);
            }
        }

        public static void LogWarning(string msg, params string[] args)
        {
            try
            {
                if (libBlogger == null)
                {
                    //Piso la carpeta del usuario para que todos los logs vayan a una carpeta unica, independientemente del usuario que lo ejecute
                    Environment.SetEnvironmentVariable("USERPROFILE", logCommonFolder);

                    libBlogger = new LibBlogger();
                    libBlogger.Init(logApplicationId);
                }

                libBlogger.LogWarning(msg, args);
            }
            catch (Exception ex)
            {
                EventLogError("No se pudo escribir mensaje en log de inConcert.\r\n\r\n" + msg + "\r\n\r\n" + ex.Message + "\r\n\r\n" + ex.StackTrace);
            }
        }

        public static void LogError(string msg, params string[] args)
        {
            try
            {
                if (libBlogger == null)
                {
                    //Piso la carpeta del usuario para que todos los logs vayan a una carpeta unica, independientemente del usuario que lo ejecute
                    Environment.SetEnvironmentVariable("USERPROFILE", logCommonFolder);

                    libBlogger = new LibBlogger();
                    libBlogger.Init(logApplicationId);
                }

                libBlogger.LogError(msg, args);
            }
            catch (Exception ex)
            {
                EventLogError("No se pudo escribir mensaje en log de inConcert.\r\n\r\n" + msg + "\r\n\r\n" + ex.Message + "\r\n\r\n" + ex.StackTrace);
            }
        }

        public static void LogFatal(string msg, params string[] args)
        {
            try
            {
                if (libBlogger == null)
                {
                    //Piso la carpeta del usuario para que todos los logs vayan a una carpeta unica, independientemente del usuario que lo ejecute
                    Environment.SetEnvironmentVariable("USERPROFILE", logCommonFolder);

                    libBlogger = new LibBlogger();
                    libBlogger.Init(logApplicationId);
                }

                libBlogger.LogFatal(msg, args);
            }
            catch (Exception ex)
            {
                EventLogError("No se pudo escribir mensaje en log de inConcert.\r\n\r\n" + msg + "\r\n\r\n" + ex.Message + "\r\n\r\n" + ex.StackTrace);
            }
        }

        public static void LogProfile(string msg, params string[] args)
        {
            try
            {
                if (libBlogger == null)
                {
                    //Piso la carpeta del usuario para que todos los logs vayan a una carpeta unica, independientemente del usuario que lo ejecute
                    Environment.SetEnvironmentVariable("USERPROFILE", logCommonFolder);

                    libBlogger = new LibBlogger();
                    libBlogger.Init(logApplicationId);
                }

                libBlogger.LogProfile(msg, args);
            }
            catch (Exception ex)
            {
                EventLogError("No se pudo escribir mensaje en log de inConcert.\r\n\r\n" + msg + "\r\n\r\n" + ex.Message + "\r\n\r\n" + ex.StackTrace);
            }
        }

        private static string FormatString(string msg, params string[] args)
        {
            try
            {
                //Reemplazo los %s del formatString por el tipo de parametros que usa el String.Format de .net
                for (int i = 0; i <= args.Length - 1; i++)
                {
                    msg = msg.Replace("%s", "{" + i.ToString() + "}");
                }

                //Borro cualquier otro %s que pueda haber quedado (si el formato esta mal armado).
                msg = msg.Replace("%s", "");

                //Ejecuto el String.Format para ya obtener el mensaje final a loguear
                return string.Format(msg, args);
            }
            catch
            {
                //Si hubo algun error, le quito todos los %s para que no falle en la libBlogger
                EventLogError("Se intento escribir log en libBlogger usando una cantidad de parametros incorrecta (" + args.Length.ToString() + " parametros): \r\n\r\n" + msg);
                return msg.Replace("%s", "");
            }
        }
    }
}