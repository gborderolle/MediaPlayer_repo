<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Fullscreen.aspx.cs" Inherits="MediaPlayer.Fullscreen" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <link rel="Shortcut Icon" type="image/ico" href="assets/images/logo.ico" />
    <title>inConcert - Media Player</title>

    <!-- Scripts -->
    <script src="assets/js/jquery-1.12.0.js"></script>
    <script src="assets/js/bootstrap.min.js"></script>
    <script src="assets/js/jquery-ui.js"></script>

    <!-- Styles -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet" id="bootstrap" />
    <link href="assets/css/bootstrap.icon-large.css" rel="stylesheet" />
    <link href="assets/css/font-awesome.css" rel="stylesheet" />
    <link href="assets/css/styles.css" rel="stylesheet" id="styles" />
    <link href="assets/css/jquery-ui.css" rel="stylesheet" />
    <link href="assets/css/jquery-ui.structure.css" rel="stylesheet" />
    <link href="assets/css/jquery-ui.theme.css" rel="stylesheet" />

    <script type="text/javascript">

        $(document).ready(function () {

            // Get segment ID
            var segID = "1";
            var _hdnSegID = $("input[id*='_hdnSegID']");
            if (_hdnSegID != null && _hdnSegID.val() != null && _hdnSegID.val().length > 0) {
                segID = _hdnSegID.val();
            }

            // Get FBS player fullscreen width
            var width = "557px";
            var _hdnWidth = $("input[id*='_hdnWidth']");
            if (_hdnWidth != null && _hdnWidth.val() != null && _hdnWidth.val().length > 0) {
                width = _hdnWidth.val();
            }

            // Get FBS player fullscreen height
            var height = "390px";
            var _hdnHeight = $("input[id*='_hdnHeight']");
            if (_hdnHeight != null && _hdnHeight.val() != null && _hdnHeight.val().length > 0) {
                height = _hdnHeight.val();
            }

            // Get FBS player current secs playing
            var currentSecs = "0";
            var _hdnCurrentSecs = $("input[id*='_hdnCurrentSecs']");
            if (_hdnCurrentSecs != null && _hdnCurrentSecs.val() != null && _hdnCurrentSecs.val().length > 0) {
                currentSecs = _hdnCurrentSecs.val();
            }

            // Get OREKA SERVER from web.config
            var WS_Oreka_Server = "http://192.168.10.31";
            var _hdnWS_Oreka_Server = $("input[id*='_hdnWS_Oreka_Server']");
            if (_hdnWS_Oreka_Server != null && _hdnWS_Oreka_Server.val() != null && _hdnWS_Oreka_Server.val().length > 0) {
                WS_Oreka_Server = "http://" + _hdnWS_Oreka_Server.val();
            }

            // Get OREKA WS PORT from web.config
            var WS_Oreka_Port = "8080";
            var _hdnWS_Oreka_Port = $("input[id*='_hdnWS_Oreka_Port']");
            if (_hdnWS_Oreka_Port != null && _hdnWS_Oreka_Port.val() != null && _hdnWS_Oreka_Port.val().length > 0) {
                WS_Oreka_Port = _hdnWS_Oreka_Port.val();
            }

            // Get OREKA WS URL from web.config
            var WS_Oreka_URL = "/icweb/replay";
            var _hdnWS_Oreka_URL = $("input[id*='_hdnWS_Oreka_URL']");
            if (_hdnWS_Oreka_URL != null && _hdnWS_Oreka_URL.val() != null && _hdnWS_Oreka_URL.val().length > 0) {
                WS_Oreka_URL = _hdnWS_Oreka_URL.val();
            }

            var filePath_OREKA = WS_Oreka_Server + ":" + WS_Oreka_Port + WS_Oreka_URL + "?segid=" + segID;

            //var url = 'http://192.168.20.225:8080/icweb/replay?segid=' + segID;

            var applet = "<applet codebase='assets/applets/' code='OrkMP.class' archive='OrkMP.jar' width='" + width + "' height='" + height + "' name='fbsviewer' id='fbsviewer' title='undefined'>";
            applet += "<param name='HOST' value=''>";
            applet += "<param name='PORT' value='5901'>";
            applet += "<param name='FBSURL' value='" + filePath_OREKA + "'>";
            applet += "<param name='AUDIOURL' value=''>";
            applet += "<param name='SHOWPLAYERCONTROLS' value='YES'>";
            applet += "<param name='SHOWPLAYERTAGCONTROLS' value='YES'>";
            applet += "<param name='TIMECOUNTDOWN' value='NO'>";
            applet += "<param name='CACHE' value='NO'>";
            applet += "<param name='RESIZABLE' value='NO'>";
            applet += "<param name='TAGS' value=''>";
            applet += "<param name='QUICK_REWIND_SECS' value='-5'>";
            applet += "<param name='QUICK_ADVANCE_SECS' value='5'>";
            applet += "<param name='NOREC_TAGTYPE_NAME' value='Pause'>";
            applet += "</applet>";

            $("#container").append(applet);

            var currentSecs_int = parseInt(currentSecs, 10);

            // Set current secs playing
            setTimeout(function () {
                if (currentSecs_int > 0) {
                    try {
                        if (document.fbsviewer != null) {
                            document.fbsviewer.seekViewerSeconds(currentSecs_int);
                        }
                    } catch (err) {
                        console.log("falló 1");
                        console.log(err);

                        // Si falla al primer intento, espera 2,5 segs más y vuelve a intentar
                        setTimeout(function () {
                            if (document.fbsviewer != null) {
                                document.fbsviewer.seekViewerSeconds(currentSecs_int);
                            }
                        }, 2500);

                    }
                }
            }, 4000);

        });

        </script>

        </head>
        <body>

  <form id="form1" runat="server" enctype="multipart/form-data">

            <div id="container"></div>

            <asp:HiddenField ID="_hdnSegID" runat="server" />
            <asp:HiddenField ID="_hdnWidth" runat="server" />
            <asp:HiddenField ID="_hdnHeight" runat="server" />
            <asp:HiddenField ID="_hdnCurrentSecs" runat="server" />
            <asp:HiddenField ID="_hdnWS_Oreka_Server" runat="server" />
            <asp:HiddenField ID="_hdnWS_Oreka_Port" runat="server" />
            <asp:HiddenField ID="_hdnWS_Oreka_URL" runat="server" />

    </form>

        </body>
        </html>


