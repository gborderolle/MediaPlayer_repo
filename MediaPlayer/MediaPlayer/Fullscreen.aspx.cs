using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MediaPlayer
{
    public partial class Fullscreen : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            string qs_segId = Request.QueryString["segId"];
            string qs_width = Request.QueryString["width"];
            string qs_height = Request.QueryString["height"];
            string qs_currentSecs = Request.QueryString["currentSecs"];

            if (!string.IsNullOrWhiteSpace(qs_segId) && !string.IsNullOrWhiteSpace(qs_width) && !string.IsNullOrWhiteSpace(qs_height) && !string.IsNullOrWhiteSpace(qs_currentSecs))
            {
                _hdnSegID.Value = qs_segId;
                _hdnWidth.Value = qs_width;
                _hdnHeight.Value = qs_height;
                _hdnCurrentSecs.Value = qs_currentSecs;

                // WS Oreka settings
                string WS_Oreka_Server = "192.168.10.31";
                if (ConfigurationManager.AppSettings != null)
                {
                    WS_Oreka_Server = ConfigurationManager.AppSettings["WS_Oreka_Server"].ToString();
                }
                _hdnWS_Oreka_Server.Value = WS_Oreka_Server;

                string WS_Oreka_Port = "8080";
                if (ConfigurationManager.AppSettings != null)
                {
                    WS_Oreka_Port = ConfigurationManager.AppSettings["WS_Oreka_Port"].ToString();
                }
                _hdnWS_Oreka_Port.Value = WS_Oreka_Port;

                string WS_Oreka_URL = "icweb/replay";
                if (ConfigurationManager.AppSettings != null)
                {
                    WS_Oreka_URL = ConfigurationManager.AppSettings["WS_Oreka_URL"].ToString();
                }
                _hdnWS_Oreka_URL.Value = WS_Oreka_URL;
            }
        }
    }
}