using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.UI;

namespace MediaPlayer.Extras
{
    /// <summary>
    /// Summary description for DownloadFile
    /// </summary>
    public class DownloadFile : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            System.Web.HttpRequest request = System.Web.HttpContext.Current.Request;
            string filePath = request.QueryString["filePath"];
            string fileName = request.QueryString["fileName"];

            System.Web.HttpResponse response = System.Web.HttpContext.Current.Response;
            response.ClearContent();
            response.Clear();
            response.ContentType = "text/plain";
            response.AddHeader("Content-Disposition", "attachment; filename=" + fileName + ";");

            // Repository path
            string localRepoPath = string.Empty;
            if (ConfigurationManager.AppSettings != null)
            {
                localRepoPath = ConfigurationManager.AppSettings["LocalRepoPath"].ToString();
            }

            bool IsLocalTest = false;
            if (ConfigurationManager.AppSettings != null)
            {
                IsLocalTest = Boolean.Parse(ConfigurationManager.AppSettings["IsLocalTest"].ToString());
            }

            string fullLocalPath = localRepoPath + filePath; // REAL // CHECK filePath no puede tener '/inConcert/Repository'!!

            if (!string.IsNullOrWhiteSpace(fullLocalPath))
            {
                response.TransmitFile(fullLocalPath);
                response.Flush();
                response.End();
            }

            // Source: http://stackoverflow.com/questions/18477398/asp-net-file-download-from-server
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}