using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace MediaPlayer.Extras
{
    public class LibBlogger
    {
        private Int32 m_opaqueData = 0;

        //Levanto funciones de la libBlogger, leyendo directamente la dll

        //logger_instance LIBBLOGGER2_API liblogger_CreateLogger(const char* applicationName);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_CreateLogger", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern Int32 liblogger_CreateLoggerV(
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string applicationName
                                                    );

        //void LIBBLOGGER2_API liblogger_DeleteLogger(logger_instance logger);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_DeleteLogger", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern void liblogger_DeleteLoggerV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData
                                                    );

        //void LIBBLOGGER2_API liblogger_DebugV(logger_instance logger, const char* format, va_list vargs);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_DebugV", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern void liblogger_DebugV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData,
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string formatString, params Int32[] args
                                                    );

        //void LIBBLOGGER2_API liblogger_InfoV(logger_instance logger, const char* format, va_list vargs);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_InfoV", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern void liblogger_InfoV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData,
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string formatString, params Int32[] args
                                                    );

        //void LIBBLOGGER2_API liblogger_WarningV(logger_instance logger, const char* format, va_list vargs);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_WarningV", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern void liblogger_WarningV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData,
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string formatString, params Int32[] args
                                                    );

        //void LIBBLOGGER2_API liblogger_ErrorV(logger_instance logger, const char* format, va_list vargs);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_ErrorV", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern void liblogger_ErrorV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData,
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string formatString, params Int32[] args
                                                    );

        //void LIBBLOGGER2_API liblogger_FatalV(logger_instance logger, const char* format, va_list vargs);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_FatalV", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.Cdecl)]
        public static extern void liblogger_FatalV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData,
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string formatString, params Int32[] args
                                                    );

        //void LIBBLOGGER2_API liblogger_ProfileV(logger_instance logger, const char* format, va_list vargs);
        [DllImport("libBlogger2.dll", EntryPoint = "liblogger_ProfileV", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true)]
        public static extern void liblogger_ProfileV(
                                                    [MarshalAs(UnmanagedType.I4)] Int32 opaqueData,
                                                    [MarshalAs(UnmanagedType.AnsiBStr)] string formatString, params Int32[] args
                                                    );

        public LibBlogger()
        {
            m_opaqueData = 0;
        }

        public void Dispose()
        {
            if (m_opaqueData != 0)
            {
                liblogger_DeleteLoggerV(m_opaqueData);
            }
        }

        public void Init(string applicationName)
        {
            m_opaqueData = liblogger_CreateLoggerV(applicationName);
        }

        public void Free()
        {
            if (m_opaqueData != 0)
            {
                liblogger_DeleteLoggerV(m_opaqueData);
            }
        }

        public void LogDebug(string formatString, params string[] args)
        {
            //Obtengo la cantidad de parametros que recibi
            int length = args.Length;

            //Defino el array de punteros a enviar
            Int32[] ptr = new Int32[length + 1];

            //Obtengo los punteros de todos los parametros a enviarle a la dll
            for (int i = 0; i <= length - 1; i++)
            {
                ptr[i] = Marshal.StringToCoTaskMemAnsi(args[i].ToString()).ToInt32();
            }

            //Chequeo que formato del mensaje a loguear sea correcto.
            if (CheckFormatString(formatString, args.Length))
            {
                //Ejecuto la funcion Delegate de la dll con todos los parametros.
                liblogger_DebugV(m_opaqueData, formatString, ptr);
            }

            //Libero los punteros a memoria usados.
            for (int i = 0; i <= length - 1; i++)
            {
                Marshal.FreeCoTaskMem(new IntPtr(ptr[i]));
            }
        }

        public void LogInfo(string formatString, params string[] args)
        {
            //Obtengo la cantidad de parametros que recibi
            int length = args.Length;

            //Defino el array de punteros a enviar
            Int32[] ptr = new Int32[length + 1];

            //Obtengo los punteros de todos los parametros a enviarle a la dll
            for (int i = 0; i <= length - 1; i++)
            {
                ptr[i] = Marshal.StringToCoTaskMemAnsi(args[i].ToString()).ToInt32();
            }

            //Chequeo que formato del mensaje a loguear sea correcto.
            if (CheckFormatString(formatString, args.Length))
            {
                //Ejecuto la funcion Delegate de la dll con todos los parametros.
                liblogger_InfoV(m_opaqueData, formatString, ptr);
            }

            //Libero los punteros a memoria usados.
            for (int i = 0; i <= length - 1; i++)
            {
                Marshal.FreeCoTaskMem(new IntPtr(ptr[i]));
            }
        }

        public void LogWarning(string formatString, params string[] args)
        {
            //Obtengo la cantidad de parametros que recibi
            int length = args.Length;

            //Defino el array de punteros a enviar
            Int32[] ptr = new Int32[length + 1];

            //Obtengo los punteros de todos los parametros a enviarle a la dll
            for (int i = 0; i <= length - 1; i++)
            {
                ptr[i] = Marshal.StringToCoTaskMemAnsi(args[i].ToString()).ToInt32();
            }

            //Chequeo que formato del mensaje a loguear sea correcto.
            if (CheckFormatString(formatString, args.Length))
            {
                //Ejecuto la funcion Delegate de la dll con todos los parametros.
                liblogger_WarningV(m_opaqueData, formatString, ptr);
            }

            //Libero los punteros a memoria usados.
            for (int i = 0; i <= length - 1; i++)
            {
                Marshal.FreeCoTaskMem(new IntPtr(ptr[i]));
            }
        }

        public void LogError(string formatString, params string[] args)
        {
            //Obtengo la cantidad de parametros que recibi
            int length = args.Length;

            //Defino el array de punteros a enviar
            Int32[] ptr = new Int32[length + 1];

            //Obtengo los punteros de todos los parametros a enviarle a la dll
            for (int i = 0; i <= length - 1; i++)
            {
                ptr[i] = Marshal.StringToCoTaskMemAnsi(args[i].ToString()).ToInt32();
            }

            //Chequeo que formato del mensaje a loguear sea correcto.
            if (CheckFormatString(formatString, args.Length))
            {
                //Ejecuto la funcion Delegate de la dll con todos los parametros.
                liblogger_ErrorV(m_opaqueData, formatString, ptr);
            }

            //Libero los punteros a memoria usados.
            for (int i = 0; i <= length - 1; i++)
            {
                Marshal.FreeCoTaskMem(new IntPtr(ptr[i]));
            }
        }

        public void LogFatal(string formatString, params string[] args)
        {
            //Obtengo la cantidad de parametros que recibi
            int length = args.Length;

            //Defino el array de punteros a enviar
            Int32[] ptr = new Int32[length + 1];

            //Obtengo los punteros de todos los parametros a enviarle a la dll
            for (int i = 0; i <= length - 1; i++)
            {
                ptr[i] = Marshal.StringToCoTaskMemAnsi(args[i].ToString()).ToInt32();
            }

            //Chequeo que formato del mensaje a loguear sea correcto.
            if (CheckFormatString(formatString, args.Length))
            {
                //Ejecuto la funcion Delegate de la dll con todos los parametros.
                liblogger_FatalV(m_opaqueData, formatString, ptr);
            }

            //Libero los punteros a memoria usados.
            for (int i = 0; i <= length - 1; i++)
            {
                Marshal.FreeCoTaskMem(new IntPtr(ptr[i]));
            }
        }

        public void LogProfile(string formatString, params string[] args)
        {
            //Obtengo la cantidad de parametros que recibi
            int length = args.Length;

            //Defino el array de punteros a enviar
            Int32[] ptr = new Int32[length + 1];

            //Obtengo los punteros de todos los parametros a enviarle a la dll
            for (int i = 0; i <= length - 1; i++)
            {
                ptr[i] = Marshal.StringToCoTaskMemAnsi(args[i].ToString()).ToInt32();
            }

            //Chequeo que formato del mensaje a loguear sea correcto.
            if (CheckFormatString(formatString, args.Length))
            {
                //Ejecuto la funcion Delegate de la dll con todos los parametros.
                liblogger_ProfileV(m_opaqueData, formatString, ptr);
            }

            //Libero los punteros a memoria usados.
            for (int i = 0; i <= length - 1; i++)
            {
                Marshal.FreeCoTaskMem(new IntPtr(ptr[i]));
            }
        }

        private bool CheckFormatString(string formatString, int cantParams)
        {
            int pos = -1;
            int cantidad = 0;

            while (true)
            {
                pos = formatString.IndexOf("%", pos + 1, StringComparison.InvariantCultureIgnoreCase);
                if (pos >= 0)
                {
                    cantidad = cantidad + 1;
                    if (cantidad > cantParams)
                        break;
                }
                else
                {
                    break;
                }
            }

            if (cantidad > cantParams)
            {
                formatString = formatString.Replace("%", "#");
                Logger.EventLogError("Se intento escribir log en libBlogger usando una cantidad de parametros incorrecta (" + cantParams.ToString() + " parametros): \r\n\r\n" + formatString);
                return false;
            }

            return true;
        }
    }
}