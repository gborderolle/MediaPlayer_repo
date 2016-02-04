using MediaPlayer.Domain;
using MediaPlayer.Extras;
using MediaPlayer.Global;
using Microsoft.WindowsAPICodePack.Shell;
using NAudio.Wave;
using Newtonsoft.Json;
using Shell32;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.IO;
using System.Linq;
using System.Reflection;
using System.ServiceModel;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;

namespace MediaPlayer
{
    public partial class Dashboard : System.Web.UI.Page
    {
        #region Properties

        private List<Folio> folio_list;

        private List<Folio> folio_filteredList;

        #endregion Properties

        #region Events

        protected void Page_Load(object sender, EventArgs e)
        {
            string qs_folio = Request.QueryString["folioID"];
            string qs_loginToken = Request.QueryString["loginToken"];

            if (Session["UserID"] != null && Session["UserName"] != null)
            {
                if (!IsPostBack)
                {
                    string search = string.Empty;
                    if (!string.IsNullOrWhiteSpace(qs_folio))
                    {
                        search = qs_folio;
                        txbSearchBox1.Text = qs_folio;
                    }

                    SearchFolioElements(search);
                    LoadConfigurationValues();
                }
                else
                {
                    // Get saved folio
                    this.folio_list = (ViewState["folio_list"] != null) ? ViewState["folio_list"] as List<Folio> : this.folio_list;
                    if (HttpContext.Current.Session["folio_filteredList"] != null) // Has priority
                    {
                        this.folio_filteredList = HttpContext.Current.Session["folio_filteredList"] as List<Folio>;
                    }
                    else
                    {
                        this.folio_filteredList = (ViewState["folio_filteredList"] != null) ? ViewState["folio_filteredList"] as List<Folio> : this.folio_filteredList;
                    }

                    if (_hdnIsUpdateNeeded.Value == "true")
                    {
                        SearchFolioElements();
                    }
                }

                // Load Element Roles
                LoadRoles();

                // Load Element Types
                LoadTypes();
            }
            else
            {
                string returnURL = !string.IsNullOrWhiteSpace(qs_folio) ? "Login.aspx?folioID=" + qs_folio : "Login.aspx";
                if (!string.IsNullOrWhiteSpace(qs_loginToken))
                {
                    returnURL += "&loginToken=" + qs_loginToken;
                }
                Response.Redirect(returnURL);
            }
        }

        protected void btnDownload_Click(object sender, EventArgs e)
        {
            Response.Redirect("Extras/DownloadFile.ashx?fileName=fileName");
        }

        protected void btn_close_ServerClick(object sender, EventArgs e)
        {
            Logout();
        }

        protected void btnSearch_ServerClick(object sender, EventArgs e)
        {
            SearchFolioElements();
        }

        protected void btnConfirmUploadElement_ServerClick(object sender, EventArgs e)
        {
            UploadFile();
        }

        protected void btnSearchCandidate_Click(object sender, EventArgs e)
        {
            SearchFolioElements();
        }

        protected void Timer1_Tick(object sender, EventArgs e)
        {
            SearchFolioElements();
        }

        #endregion Events

        #region Private Methods

        private void UploadFile()
        {
            if (HttpContext.Current.Session["UserID"] != null && ViewState["FolioID"] != null)
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                // Source: http://stackoverflow.com/questions/1998452/accessing-input-type-file-at-server-side-in-asp-net

                /* ******** Get file extension ******** */
                string fileName = MyFileUpload.PostedFile.FileName;
                string file_extension = string.Empty;

                if (!string.IsNullOrWhiteSpace(fileName))
                {
                    string[] extensionArray = fileName.Split('.');
                    if (extensionArray.Length > 0)
                    {
                        file_extension = extensionArray[1];
                    }
                }

                /* ******** Global variables ******** */
                string userID = HttpContext.Current.Session["UserID"].ToString();
                string folioID = ViewState["FolioID"].ToString();
                string repoFilename = "", repoFilenameAUX = "", fullLocalPath = "", relativeLocalPath = "";
                bool ok = true, isFileAUX_created = false;

                // File ID
                string guid = Guid.NewGuid().ToString();

                // Get datetime 1
                DateTime datetime_final = DateTime.Now;
                string datetimeStr = DateTime.Now.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                if (uploadDate != null && !string.IsNullOrWhiteSpace(uploadDate.Value))
                {
                    datetimeStr = uploadDate.Value;
                    Logger.LogDebug("(%s) (%s) -- Get datetime1: Intentando convertir a datetime. Formato: dd-MM-yyyy HH:mm:ss. Dato: " + uploadDate.Value.ToString(), className, methodName);
                    if (!DateTime.TryParseExact(uploadDate.Value, "dd-MM-yyyy HH:mm:ss", null, System.Globalization.DateTimeStyles.None, out datetime_final))
                    //if (!DateTime.TryParse(uploadDate.Value.ToString(), out datetime_final))
                    {
                        datetime_final = DateTime.Now;

                        // #2- Logger exception
                        Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a datetime.", className, methodName);
                        Logger.LogError("(%s) (%s) -- Dato: " + uploadDate.Value, className, methodName);
                    }
                }

                // Get datetime 2
                DateTime datetime2_a = DateTime.Now;
                string datetimeStr_a = DateTime.Now.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                if (camarasDate1 != null && !string.IsNullOrWhiteSpace(camarasDate1.Value))
                {
                    datetimeStr_a = camarasDate1.Value;
                    Logger.LogDebug("(%s) (%s) -- Get datetime2_a: Intentando convertir a datetime. Formato: dd-MM-yyyy HH:mm. Dato: " + camarasDate1.Value.ToString(), className, methodName);
                    if (!DateTime.TryParseExact(camarasDate1.Value, "dd-MM-yyyy HH:mm", null, System.Globalization.DateTimeStyles.None, out datetime2_a))
                    //if (!DateTime.TryParse(camarasDate1.Value.ToString(), out datetime2_a))
                    {
                        datetime2_a = DateTime.Now;

                        // #2- Logger exception
                        Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a datetime.", className, methodName);
                        Logger.LogError("(%s) (%s) -- Dato: " + camarasDate1.Value, className, methodName);
                    }
                }

                DateTime datetime2_b = DateTime.Now;
                string datetimeStr_b = DateTime.Now.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                if (camarasDate2 != null && !string.IsNullOrWhiteSpace(camarasDate2.Value))
                {
                    datetimeStr_b = camarasDate2.Value;
                    Logger.LogDebug("(%s) (%s) -- Get datetime2_b: Intentando convertir a datetime. Formato: dd-MM-yyyy HH:mm. Dato: " + camarasDate2.Value.ToString(), className, methodName);
                    if (!DateTime.TryParseExact(camarasDate2.Value, "dd-MM-yyyy HH:mm", null, System.Globalization.DateTimeStyles.None, out datetime2_b))
                    //if (!DateTime.TryParse(camarasDate2.Value.ToString(), out datetime2_b))
                    {
                        datetime2_b = DateTime.Now;

                        // #2- Logger exception
                        Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a datetime.", className, methodName);
                        Logger.LogError("(%s) (%s) -- Dato: " + camarasDate2.Value, className, methodName);
                    }
                }

                if (string.IsNullOrWhiteSpace(txbInputCameraNumber.Value))
                {
                    if (MyFileUpload != null && MyFileUpload.PostedFile != null && MyFileUpload.PostedFile.FileName.Length > 0)
                    {
                        /* ******** Configuration variables ******** */

                        // Repository path
                        string localRepoPath = string.Empty;
                        if (ConfigurationManager.AppSettings != null)
                        {
                            localRepoPath = ConfigurationManager.AppSettings["LocalRepoPath"].ToString();
                        }

                        string server = string.Empty;
                        if (ConfigurationManager.AppSettings != null)
                        {
                            server = ConfigurationManager.AppSettings["DB_Server"].ToString();
                        }

                        // File name
                        repoFilename = guid + ".bin";

                        // File name auxiliar with real extension
                        repoFilenameAUX = guid + "." + file_extension;

                        // Repository relative path
                        relativeLocalPath = datetime_final.Year.ToString("D4") + "\\" + datetime_final.Month.ToString("D2") + "\\" + datetime_final.Day.ToString("D2") + "\\" + datetime_final.Hour.ToString("D2") + "\\";

                        fullLocalPath = localRepoPath + relativeLocalPath; // REAL

                        if (!string.IsNullOrWhiteSpace(fullLocalPath) && !string.IsNullOrWhiteSpace(repoFilename))
                        {
                            try
                            {
                                if (!Directory.Exists(Path.GetDirectoryName(fullLocalPath)))
                                {
                                    Directory.CreateDirectory(Path.GetDirectoryName(fullLocalPath));
                                }
                                MyFileUpload.PostedFile.SaveAs(fullLocalPath + repoFilename);
                                MyFileUpload.PostedFile.SaveAs(fullLocalPath + repoFilenameAUX);
                                isFileAUX_created = true;
                            }
                            catch (Exception e)
                            {
                                // #2- Logger exception
                                Logger.LogError("(%s) (%s) -- Excepcion. Subiendo archivo con local test. ERROR: %s", className, methodName, e.Message);
                                ok = false;
                            }
                        }
                    }
                }
                else
                {
                    // IS CAMERA SYSTEM ****************************************************
                    ok = false;

                    string cameraNumber_str = txbInputCameraNumber.Value;

                    // WS InConcert Operaciones grabación settings
                    string WS_InConcert_Server = "192.168.10.31";
                    if (ConfigurationManager.AppSettings != null)
                    {
                        WS_InConcert_Server = ConfigurationManager.AppSettings["WS_InConcert_Server"].ToString();
                    }

                    string WS_InConcert_Port = "8081";
                    if (ConfigurationManager.AppSettings != null)
                    {
                        WS_InConcert_Port = ConfigurationManager.AppSettings["WS_InConcert_Port"].ToString();
                    }

                    string WS_InConcert_URL_operacionesGrabacion = "RecordingIntegration/WebServices/OperacionesGrabacion.asmx";
                    if (ConfigurationManager.AppSettings != null)
                    {
                        WS_InConcert_URL_operacionesGrabacion = ConfigurationManager.AppSettings["WS_InConcert_URL_operacionesGrabacion"].ToString();
                    }

                    // WS Endpoint
                    EndpointAddress endpointUser = new EndpointAddress(new Uri("http://" + WS_InConcert_Server + ":" + WS_InConcert_Port + "/" + WS_InConcert_URL_operacionesGrabacion));

                    // WS client
                    var wsClient = new RecordingIntegration.OperacionesGrabacionSoapBindingClient("OperacionesGrabacionSoapBinding", endpointUser);

                    // Call WS operation
                    wsClient.videoAsociado(folioID, userID, cameraNumber_str, datetime2_a.ToString("dd'/'MM'/'yyyy HH':'mm"), datetime2_b.ToString("dd'/'MM'/'yyyy HH':'mm"));
                }

                /* ******** Save in DB ******** */

                if (ok && !string.IsNullOrWhiteSpace(file_extension) && !string.IsNullOrWhiteSpace(fileName)
                    && !string.IsNullOrWhiteSpace(relativeLocalPath) && !string.IsNullOrWhiteSpace(repoFilename))
                {
                    // Get file MediaType
                    string mediaType = GetFileMediaType(file_extension);

                    // Get file Duration
                    // Source: http://stackoverflow.com/questions/1256841/c-sharp-get-video-file-duration-from-metadata
                    //int real_duration = GetFileDuration(fullLocalPath + repoFilename, mediaType);

                    //Source: http://www.codeproject.com/Articles/43208/How-to-get-the-length-duration-of-a-media-File-in-.aspx
                    // http://forums.asp.net/t/1679210.aspx?Get+Video+duration+after+uploading+asp+net+C+

                    try
                    {
                        double seconds = 0;
                        ShellFile so = ShellFile.FromFilePath(fullLocalPath + repoFilenameAUX);
                        double nanoseconds;
                        double.TryParse(so.Properties.System.Media.Duration.Value.ToString(), out nanoseconds);
                        if (nanoseconds > 0)
                        {
                            seconds = Convert100NanosecondsToMilliseconds(nanoseconds) / 1000;
                        }

                        string bd_path = relativeLocalPath.Replace("\\", "/") + repoFilename;

                        Global.GlobalMethods.AddFolioFile(userID, folioID, fileName, datetime_final, Convert.ToInt32(seconds), mediaType, bd_path);
                    }
                    catch (Exception e)
                    {
                        // #2- Logger exception
                        Logger.LogError("(%s) (%s) -- Excepcion. Obteniendo duración de archivo a subir y guardando en BD. ERROR: %s", className, methodName, e.Message);
                        ok = false;
                    }
                }

                if (isFileAUX_created)
                {
                    try
                    {
                        if (File.Exists(fullLocalPath + repoFilenameAUX))
                        {
                            File.Delete(fullLocalPath + repoFilenameAUX);
                        }
                    }
                    catch (Exception e)
                    {
                        // #2- Logger exception
                        Logger.LogError("(%s) (%s) -- Excepcion. Borrando archivo subido auxiliar para obtener duracion. ERROR: %s", className, methodName, e.Message);
                    }
                }

                // Reload elements
                SearchFolioElements();
            }
        }

        private string GetFileMediaType(string file_extension)
        {
            string mediaType = "D";
            switch (file_extension.ToLowerInvariant())
            {
                case "fbs":
                    {
                        mediaType = "S";
                        break;
                    }
                case "wav":
                case "mp3":
                case "wma":
                case "m4a":
                case "oga":
                    {
                        mediaType = "A";
                        break;
                    }
                case "avi":
                case "wmv":
                    {
                        mediaType = "V";
                        break;
                    }
                case "png":
                case "jpg":
                case "jepg":
                case "bmp":
                    {
                        mediaType = "I";
                        break;
                    }
            }
            return mediaType;
        }

        private int GetFileDuration(string path, string mediaType)
        {
            int real_duration = 0;
            if (mediaType == "A" || mediaType == "V")
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                // Getting the Audio length
                // fullLocalPath + repoFilename
                try
                {
                    using (var wfr = new WaveFileReader(path))
                    {
                        real_duration = (int)wfr.TotalTime.TotalSeconds;
                    }
                }
                catch (Exception e)
                {
                    // #2- Logger exception
                    Logger.LogError("(%s) (%s) -- Excepcion. Obteniendo duracion de archivo a subir. ERROR: %s", className, methodName, e.Message);
                }
            }
            return real_duration;
        }

        private void LoadConfigurationValues()
        {
            string repo = "/inConcert/Repository/";
            if (ConfigurationManager.AppSettings != null)
            {
                repo = ConfigurationManager.AppSettings["LocalRepoPath"].ToString().Replace("\\", "/");
            }
            _hdnLocalRepository.Value = repo;

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

            // WS InConcert settings
            string WS_InConcert_Server = "192.168.10.31";
            if (ConfigurationManager.AppSettings != null)
            {
                WS_InConcert_Server = ConfigurationManager.AppSettings["WS_InConcert_Server"].ToString();
            }
            _hdnWS_InConcert_Server.Value = WS_InConcert_Server;

            string WS_InConcert_Port = "8081";
            if (ConfigurationManager.AppSettings != null)
            {
                WS_InConcert_Port = ConfigurationManager.AppSettings["WS_InConcert_Port"].ToString();
            }
            _hdnWS_InConcert_Port.Value = WS_InConcert_Port;

            string WS_InConcert_URL_download = "RecordingIntegration/WebServices/Download.aspx";
            if (ConfigurationManager.AppSettings != null)
            {
                WS_InConcert_URL_download = ConfigurationManager.AppSettings["WS_InConcert_URL_download"].ToString();
            }
            _hdnWS_InConcert_URL_download.Value = WS_InConcert_URL_download;

            // FBS player settings ----
            // Player default size
            string fbs_width = "557px";
            if (ConfigurationManager.AppSettings != null)
            {
                fbs_width = ConfigurationManager.AppSettings["PlayerFBS_width"].ToString();
            }
            _hdnFbs_width.Value = fbs_width;

            string fbs_height = "390px";
            if (ConfigurationManager.AppSettings != null)
            {
                fbs_height = ConfigurationManager.AppSettings["PlayerFBS_height"].ToString();
            }
            _hdnFbs_height.Value = fbs_height;

            // Player fullscreen size
            string fbs_fullscreen_width = "557px";
            if (ConfigurationManager.AppSettings != null)
            {
                fbs_fullscreen_width = ConfigurationManager.AppSettings["PlayerFBS_fullscreen_width"].ToString();
            }
            _hdnPlayerFBS_fullscreen_width.Value = fbs_fullscreen_width;

            string fbs_fullscreen_height = "390px";
            if (ConfigurationManager.AppSettings != null)
            {
                fbs_fullscreen_height = ConfigurationManager.AppSettings["PlayerFBS_fullscreen_height"].ToString();
            }
            _hdnPlayerFBS_fullscreen_height.Value = fbs_fullscreen_height;

            // Player popup size
            string fbs_popup_width = "300";
            if (ConfigurationManager.AppSettings != null)
            {
                fbs_popup_width = ConfigurationManager.AppSettings["PlayerFBS_popup_width"].ToString();
            }
            _hdnPlayerFBS_popup_width.Value = fbs_popup_width;

            string fbs_popup_height = "500";
            if (ConfigurationManager.AppSettings != null)
            {
                fbs_popup_height = ConfigurationManager.AppSettings["PlayerFBS_popup_height"].ToString();
            }
            _hdnPlayerFBS_popup_height.Value = fbs_popup_height;

            string Webchimera_Install_URL = "https://github.com/RSATom/WebChimera/releases/download/v0.2.9/WebChimera_0.2.9_vlc_2.2.1.msi";
            if (ConfigurationManager.AppSettings != null)
            {
                Webchimera_Install_URL = ConfigurationManager.AppSettings["Webchimera_Install_URL"].ToString();
            }
            _hdnWebchimera_Install_URL.Value = Webchimera_Install_URL;

            string MaxElementsDownload = "6";
            if (ConfigurationManager.AppSettings != null)
            {
                MaxElementsDownload = ConfigurationManager.AppSettings["MaxElementsDownload"].ToString();
            }
            _hdnMaxElementsDownload.Value = MaxElementsDownload;

            string AutoRefreshDataTimeMilliseconds = "300000";
            if (ConfigurationManager.AppSettings != null)
            {
                AutoRefreshDataTimeMilliseconds = ConfigurationManager.AppSettings["AutoRefreshDataTimeMilliseconds"].ToString();
            }

            int data_time = 30000;
            if (!int.TryParse(AutoRefreshDataTimeMilliseconds, out data_time))
            {
                data_time = 30000;
            }
            Timer1.Interval = data_time;
        }

        private void Logout()
        {
            Session["UserID"] = null;
            Session["UserName"] = null;
            Response.Redirect("Login.aspx");
        }

        private void LoadTypes()
        {
            List<string> list_mediaTypes = GlobalMethods.GetMediaTypes();
            if (list_mediaTypes != null && list_mediaTypes.Count > 0)
            {
                StringBuilder htmlCheckTypes = new StringBuilder();

                int index = 1;
                foreach (string media in list_mediaTypes)
                {
                    string media_name = media;
                    switch (media)
                    {
                        case "S":
                            {
                                media_name = "Grabaciones de pantalla (P)";
                                break;
                            }
                        case "A":
                            {
                                media_name = "Audios (A)";
                                break;
                            }
                        case "V":
                            {
                                media_name = "Videos (V)";
                                break;
                            }
                        case "D":
                            {
                                media_name = "Documentos u otros (D)";
                                break;
                            }
                        case "C":
                            {
                                media_name = "Comentarios (C)";
                                break;
                            }
                        case "I":
                            {
                                media_name = "Imágenes (I)";
                                break;
                            }
                    }
                    if (index % 2 != 0)
                    {
                        htmlCheckTypes.AppendLine("<div class='row'>");
                    }

                    htmlCheckTypes.AppendLine("<div class='col-sm-6'>");
                    htmlCheckTypes.AppendLine("<div class='checkbox pull-left' style='margin-left:8px;'>");
                    htmlCheckTypes.AppendLine("<label>");
                    htmlCheckTypes.AppendLine("<input type='checkbox' name='checkbox_type_" + media + "' type_name=" + media + "  onclick='prepareFilterTimelineElements(this, \"type\", \"" + media + "\")' checked>" + media_name);
                    htmlCheckTypes.AppendLine("</label>");
                    htmlCheckTypes.AppendLine("</div>");
                    htmlCheckTypes.AppendLine("</div>");

                    if (index % 2 == 0 || index == list_mediaTypes.Count)
                    {
                        htmlCheckTypes.AppendLine("</div>");
                    }

                    index++;
                }
                litCheckTypes.Text = htmlCheckTypes.ToString();
            }
        }

        private void LoadRoles()
        {
            if (this.folio_filteredList != null && this.folio_filteredList.Count > 0)
            {
                StringBuilder RtrnHtml = new StringBuilder();
                List<string> list_userGroups = Domain.User.GetUserGroupsNew(this.folio_filteredList.Where(x => x.deleted == 0).ToList());
                if (list_userGroups != null && list_userGroups.Count > 0)
                {
                    int index = 1;
                    StringBuilder htmlCheckRoles = new StringBuilder();
                    foreach (string group in list_userGroups)
                    {
                        if (index % 2 != 0)
                        {
                            htmlCheckRoles.AppendLine("<div class='row'>");
                        }

                        htmlCheckRoles.AppendLine("<div class='col-sm-6'>");
                        htmlCheckRoles.AppendLine("<div class='checkbox pull-left' style='margin-left:8px;'>");
                        htmlCheckRoles.AppendLine("<label>");
                        htmlCheckRoles.AppendLine("<input type='checkbox' name='checkbox_role_" + group + "' onclick='prepareFilterTimelineElements(this, \"role\", \"" + group + "\")' checked>" + group);
                        htmlCheckRoles.AppendLine("</label>");
                        htmlCheckRoles.AppendLine("</div>");
                        htmlCheckRoles.AppendLine("</div>");

                        if (index % 2 == 0 || index == list_userGroups.Count)
                        {
                            htmlCheckRoles.AppendLine("</div>");
                        }

                        index++;
                    }
                    litCheckRoles.Text = htmlCheckRoles.ToString();
                }
            }
        }

        /// <summary>
        /// Returns elements from only 1 Folio
        /// </summary>
        /// <param name="qs_folioID"></param>
        private void SearchFolioElements(string qs_folioID = "")
        {
            int index = 0;
            StringBuilder htmlTable = new StringBuilder();

            /****** Table headers ******/

            htmlTable.AppendLine("<table class='table' id='tblLeftGridElements'>"); // style='display:none;'
            htmlTable.AppendLine("<thead>");
            htmlTable.AppendLine("<tr style='background: transparent'>");
            htmlTable.AppendLine("<th width='3%' style='text-align: center;'><input type='checkbox' id='chbSelectAll' name='timeline_elements_checkAll' class='button' checked></th>");
            htmlTable.AppendLine("<th width='3%' style='text-align: center;'>#</th>");
            htmlTable.AppendLine("<th width='5%' style='text-align: center;'>Usuario</th>");
            htmlTable.AppendLine("<th width='8%' style='text-align: center;'>Local Party</th>");
            htmlTable.AppendLine("<th width='5%' style='text-align: center;'>Remote Party</th>");
            htmlTable.AppendLine("<th width='5%' style='text-align: center;'>Tipo</th>");
            htmlTable.AppendLine("<th width='6%' style='text-align: center;'>Inicio</th>");
            htmlTable.AppendLine("<th width='3%' style='text-align: center;'>Duración</th>");
            htmlTable.AppendLine("</tr>");
            htmlTable.AppendLine("</thead>");
            htmlTable.AppendLine("<tbody>");

            if (string.IsNullOrWhiteSpace(qs_folioID))
            {
                if (!string.IsNullOrWhiteSpace(txbSearchBox1.Text))
                {
                    qs_folioID = txbSearchBox1.Text;
                }
            }

            if (!string.IsNullOrWhiteSpace(qs_folioID))
            {
                this.folio_list = Global.GlobalMethods.GetAllFolios(qs_folioID);
                ViewState["folio_list"] = this.folio_list;

                if (this.folio_list != null && this.folio_list.Count > 0)
                {
                    this.folio_filteredList = this.folio_list.FindAll(x => x.deleted == 0);
                    ViewState["folio_filteredList"] = this.folio_filteredList;

                    string hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus = string.Empty;
                    string hdnElementsIDChecked = string.Empty;

                    //
                    RootObject json_elementList = new RootObject();
                    json_elementList.name = "Elements";
                    json_elementList.color = "#000000";

                    DateTime folio_start = DateTime.MaxValue;
                    DateTime folio_end = DateTime.MinValue;
                    //

                    List<Folio> list = this.folio_filteredList.Where(x => x.deleted == 0).ToList();
                    if (list != null && list.Count > 0)
                    {
                        ViewState["FolioID"] = list[0].folio_textID;
                        foreach (Folio folio in list)
                        {
                            index++;

                            string end_date = folio.timestamp.AddSeconds(folio.duration).ToString("dd'-'MM'-'yyyy HH':'mm':'ss");

                            // Duration
                            TimeSpan time = TimeSpan.FromSeconds(folio.duration);
                            string duration_formatStr = time.ToString(@"hh\:mm\:ss");

                            /****** Hidden fields ******/
                            hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus
                                += folio.tapeID + "#" + folio.groupName + "#" + folio.mediaType.ToString() + "#" + folio.duration + "#" + folio.timestamp.ToString("dd'-'MM'-'yyyy HH':'mm':'ss")
                                + "#" + folio.segmentID + "#" + index + "#" + folio.fileName + "#" + end_date + "#" + folio.filePath + "#" + duration_formatStr + "#" + folio.fileStatus + "$";

                            // Get max and min value
                            folio_start = folio_start > folio.timestamp ? folio.timestamp : folio_start;
                            folio_end = folio_end < folio.timestamp.AddSeconds(folio.duration) ? folio.timestamp.AddSeconds(folio.duration) : folio_end;

                            /****** Create json data ******/
                            Span json_element = new Span();
                            json_element.name = folio.mediaType == "S" ? "P" : folio.mediaType;
                            json_element.start = folio.timestamp.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                            json_element.end = end_date;
                            json_element.id = folio.tapeID.ToString();
                            json_element.type = folio.mediaType;
                            json_element.role = folio.groupName;

                            json_elementList.spans.Add(json_element);

                            // isExtra, type, icon and color
                            //bool isExtra = false; // If its taken from orkextra table
                            string icon = "glyphicon glyphicon-headphones";
                            string media_str = "Grabación";
                            string color_str = "";
                            switch (folio.mediaType)
                            {
                                case "S":
                                    {
                                        icon = "fa fa-video-camera";
                                        media_str = "Grabación";
                                        color_str = "blue";
                                        break;
                                    }
                                case "V":
                                    {
                                        icon = "glyphicon glyphicon-film";
                                        media_str = "Video";
                                        color_str = "purple";
                                        break;
                                    }
                                case "A":
                                    {
                                        icon = "glyphicon glyphicon-headphones";
                                        media_str = "Audio";
                                        color_str = "red";
                                        break;
                                    }
                                case "D":
                                    {
                                        icon = "fa fa-file-text";
                                        media_str = "Documento";
                                        color_str = "green";
                                        break;
                                    }
                                case "C":
                                    {
                                        icon = "glyphicon glyphicon-comment";
                                        media_str = "Comentario";
                                        color_str = "orange";
                                        break;
                                    }
                                case "I":
                                    {
                                        icon = "glyphicon glyphicon-picture";
                                        media_str = "Imagen";
                                        color_str = "Violet";
                                        break;
                                    }
                            }

                            // IsExtra = If filePath is NOT empty, then is extra from incextras table
                            bool isExtra = folio.filePath == string.Empty ? false : true;
                            if (folio.mediaType == "C")
                            {
                                isExtra = true;
                            }

                            string color_icon = isExtra ? "#C4FFD6" : "beige";

                            // Onclick event
                            string onclick_event = FolioElements_GetOnClickEvent(folio, index, isExtra, duration_formatStr, media_str);

                            // Title
                            string title = folio.mediaType == "S" ? "Grabación de Pantalla" : media_str;

                            /****** Table data ******/
                            htmlTable.AppendLine("<tr id='tape_" + folio.tapeID + "'>");
                            htmlTable.AppendLine("<td>");

                            htmlTable.AppendLine("<input type='checkbox' name='timeline_elements' class='button' value='" + folio.tapeID + "#" + isExtra.ToString().ToLowerInvariant() + "#" + folio.mediaType + "' onclick='manageElement(this, " + folio.tapeID + ", " + (index - 1).ToString() + ", " + JsonConvert.SerializeObject(json_element) + ")' checked>");
                            htmlTable.AppendLine("<td>");
                            htmlTable.AppendLine("<h5>" + index + "</h5>");
                            htmlTable.AppendLine("<td>");
                            htmlTable.AppendLine("<h5>" + folio.userName + "</h5>");
                            htmlTable.AppendLine("<td>");
                            htmlTable.AppendLine("<h5>" + folio.localParty + "</h5>");
                            htmlTable.AppendLine("<td>");
                            htmlTable.AppendLine("<h5>" + folio.remoteParty + "</h5>");
                            htmlTable.AppendLine("<td>");

                            htmlTable.AppendLine("<button type='button' class='btn btn-default btn-sm' style='color:" + color_str + "; opacity: 0.9; background-color: " + color_icon + "; background-image: none;' name='btnTimelineElement' data-toggle='tooltip' ");
                            htmlTable.AppendLine("title=" + title + " onclick='" + onclick_event + "'><span class='" + icon + "' aria-hidden='true'></span></button>");
                            htmlTable.AppendLine("<td>");
                            htmlTable.AppendLine("<h5 id='timestamp'>" + folio.timestamp.ToString("dd'-'MM'-'yyyy HH':'mm':'ss") + "</h5>");
                            htmlTable.AppendLine("<td>");

                            htmlTable.AppendLine("<h5>" + duration_formatStr + "</h5>");
                            htmlTable.AppendLine("</tr>");
                        }
                    }

                    if (hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus.Length > 0)
                    {
                        hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus = hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus.Remove(hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus.Length - 1);
                        _hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus.Value = hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus;
                    }

                    /****** Load bottom Timeline ******/
                    string val1 = JsonConvert.SerializeObject(json_elementList);
                    string val2 = folio_start.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                    string val3 = folio_end.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");

                    _hdnJSonList.Value = val1;
                    _hdnJSonStart.Value = val2;
                    _hdnJSonEnd.Value = val3;

                    // Fire the timeframe drawing
                    ScriptManager.RegisterStartupScript(this, typeof(Page), "pre_timeframe_prepare", "pre_timeframe_prepare();", true);
                }
                else
                {
                    // Folio does not exist
                    ViewState["FolioID"] = 0;
                    _hdnTapeID_RoleGroupName_TypeTapeType_duration_timestamp_segmentID_count_fileName_endDate_filePath_duration_formatStr_fileStatus.Value = string.Empty;
                    ScriptManager.RegisterStartupScript(this, typeof(Page), "clear_timeline", "clear_timeline();", true);
                }
            }
            htmlTable.AppendLine("</tbody>");
            htmlTable.AppendLine("</table>");

            litTable.Text = htmlTable.ToString();

            lblResultsCount.Text = index.ToString();

            /****** Clear checkbox filters Rols and Types ******/
            LoadRoles();
            LoadTypes();

            // Change Roles and Types filter checkboxes to checked status
            ScriptManager.RegisterStartupScript(this, typeof(Page), "checkRolesAndTypesFilters", "checkRolesAndTypesFilters();", true);

            // Show visual effect on loading the left grid
            // ScriptManager.RegisterStartupScript(this, typeof(Page), "grid_visualEffect", "runTableVisualEffect();", true);
        }

        private string FolioElements_GetOnClickEvent(Folio folio, int index, bool isExtra, string duration_formatStr, string media_str = "")
        {
            string onclick_event = string.Empty;
            if (folio != null)
            {
                media_str = string.IsNullOrWhiteSpace(media_str) ? GetMediaTypeName(folio) : media_str;

                onclick_event = "clickTimelineElement2(" + folio.tapeID + ", " + index + "," + folio.duration + ",\"";
                onclick_event += folio.timestamp.ToString("dd'-'MM'-'yyyy HH':'mm':'ss") + "\",\"" + media_str + "\",";
                onclick_event += folio.segmentID + ", \"" + isExtra.ToString().ToLowerInvariant() + "\", \"" + folio.fileName + "\",\"";
                onclick_event += folio.filePath + "\",\"" + duration_formatStr + "\",\"" + folio.mediaType + "\",\"" + folio.fileStatus + "\")";
            }
            return onclick_event;
        }

        #endregion Private Methods

        #region Static Methods

        public static double Convert100NanosecondsToMilliseconds(double nanoseconds)
        {
            // One million nanoseconds in 1 millisecond,
            // but we are passing in 100ns units...
            return nanoseconds * 0.0001;
        }

        private static string GetMediaTypeName(Folio folio)
        {
            string media_str = "Grabación";
            if (folio != null && !string.IsNullOrWhiteSpace(media_str))
            {
                switch (folio.mediaType)
                {
                    case "S":
                        {
                            media_str = "Grabación";
                            break;
                        }
                    case "A":
                        {
                            media_str = "Audio";
                            break;
                        }
                    case "V":
                        {
                            media_str = "Video";
                            break;
                        }
                    case "D":
                        {
                            media_str = "Documento";
                            break;
                        }
                    case "C":
                        {
                            media_str = "Comentario";
                            break;
                        }
                    case "I":
                        {
                            media_str = "Imagen";
                            break;
                        }
                }
            }
            return media_str;
        }

        #endregion Static Methods

        #region Web Methods

        [System.Web.Services.WebMethod]
        public static string AddFolioComment(string userID, string folioID, string comment, string date, string duration)
        {
            Logger.LogDebug("Log Test Dashboard.aspx.cs");

            Span json_element = null;
            if (!string.IsNullOrWhiteSpace(userID) && !string.IsNullOrWhiteSpace(folioID) && !string.IsNullOrWhiteSpace(comment) && !string.IsNullOrWhiteSpace(date) && !string.IsNullOrWhiteSpace(duration))
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                // #1-2- Params register
                Logger.LogDebug("(%s) (%s) -- Info WebMethod. Testing AddFolioComment", className, methodName);
                Logger.LogDebug("(%s) (%s) -- Info WebMethod. Parametros recibidos: " + userID + ", " + folioID + ", " + comment + ", " + date + ", " + duration, className, methodName);

                int duration_int = 0;
                if (!int.TryParse(duration, out duration_int))
                {
                    duration_int = 0;

                    // #2- Logger exception
                    Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a int.", className, methodName);
                    Logger.LogError("(%s) (%s) -- Dato: " + duration, className, methodName);
                }

                string date_final_start = date;
                string date_final_end = date;
                DateTime date_2 = DateTime.Now;
                Logger.LogDebug("(%s) (%s) -- Intentando convertir a datetime. Formato: dd-MM-yyyy HH:mm:ss. Dato: " + date.ToString(), className, methodName);
                if (!DateTime.TryParseExact(date, "dd-MM-yyyy HH:mm:ss", null, System.Globalization.DateTimeStyles.None, out date_2))
                //if (!DateTime.TryParse(date, out date_2))
                {
                    date_final_start = date_final_end = date;

                    // #2- Logger exception
                    Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a datetime.", className, methodName);
                    Logger.LogError("(%s) (%s) -- Dato: " + date, className, methodName);
                }
                else
                {
                    date_final_start = date_2.ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                    date_final_end = date_2.AddSeconds(duration_int).ToString("dd'-'MM'-'yyyy HH':'mm':'ss");
                }
                Logger.LogDebug("(%s) (%s) -- Datetime date_final_start: " + date_final_start, className, methodName);
                Logger.LogDebug("(%s) (%s) -- Datetime date_final_end: " + date_final_end, className, methodName);

                // Save in DB
                int elementID = Global.GlobalMethods.AddFolioComment(userID, folioID, comment, date_2, duration_int);

                /****** Create json data ******/
                json_element = new Span();
                json_element.name = comment;
                json_element.start = date_final_start;
                json_element.end = date_final_end;
                json_element.id = elementID.ToString(); // wrong: folioID
                json_element.type = "C";
                json_element.role = string.Empty;
            }
            return JsonConvert.SerializeObject(json_element);
        }

        [System.Web.Services.WebMethod]
        public static bool RemoveElement(int tapeID, bool isExtra)
        {
            // #1- Logger variables
            System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
            string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
            string methodName = stackFrame.GetMethod().Name;

            // #1-2- Params register
            Logger.LogDebug("(%s) (%s) -- Info WebMethod. Parametros recibidos: " + tapeID.ToString() + ", " + isExtra.ToString(), className, methodName);

            return tapeID > 0 ? Global.GlobalMethods.RemoveTimelineElement(tapeID, isExtra) : false;
        }

        [System.Web.Services.WebMethod]
        public static bool RemoveElementSelected(string list_elements)
        {
            bool ret = false;
            if (!string.IsNullOrWhiteSpace(list_elements))
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                string[] element_array = list_elements.Split(',');
                if (element_array.Length > 0)
                {
                    foreach (string element in element_array)
                    {
                        string[] attributes_array = element.Split('#');
                        if (attributes_array.Length > 1)
                        {
                            string tapeID_str = attributes_array[0];
                            string isExtra_str = attributes_array[1];

                            bool isExtra = false;
                            if (!bool.TryParse(isExtra_str, out isExtra))
                            {
                                isExtra = false;

                                // #2- Logger exception
                                Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a boolean.", className, methodName);
                                Logger.LogError("(%s) (%s) -- Dato: " + isExtra_str, className, methodName);
                            }

                            int tapeID_int = 0;
                            if (!int.TryParse(tapeID_str, out tapeID_int))
                            {
                                tapeID_int = 0;

                                // #2- Logger exception
                                Logger.LogError("(%s) (%s) -- Excepcion. Convirtiendo a int.", className, methodName);
                                Logger.LogError("(%s) (%s) -- Dato: " + tapeID_str, className, methodName);
                            }
                            if (tapeID_int > 0)
                            {
                                ret = Global.GlobalMethods.RemoveTimelineElement(tapeID_int, isExtra);
                            }
                        }
                    } //foreach
                }
            }
            return ret;

            // Source: http://stackoverflow.com/questions/12895913/what-is-the-simplest-way-to-pass-javascript-object-to-asp-net-codebehind-method
        }

        [System.Web.Services.WebMethod]
        public static int ConfirmRemoveElement(string userID, string password_input, int tapeID, bool isExtra)
        {
            int result = 0;
            /* 0 - Invalid password
             * 1 - OK
             * 2 - DB Error
             * */
            if (!string.IsNullOrWhiteSpace(userID) && !string.IsNullOrWhiteSpace(password_input))
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                // #1-2- Params register
                Logger.LogDebug("(%s) (%s) -- Info WebMethod. Parametros recibidos: " + userID + ", " + password_input + ", " + tapeID.ToString() + ", " + isExtra.ToString(), className, methodName);

                User user = new User(userID, "");
                if (user != null)
                {
                    string uID = Global.GlobalMethods.CheckLogin(user.userName, password_input);
                    {
                        if (!string.IsNullOrWhiteSpace(uID))
                        {
                            result = 1; // OK
                        }
                    }
                }

                if (result == 1)
                {
                    result = Global.GlobalMethods.RemoveTimelineElement(tapeID, isExtra) ? 1 : 2;
                }
            }
            return result;
        }

        #endregion Web Methods
    }
}