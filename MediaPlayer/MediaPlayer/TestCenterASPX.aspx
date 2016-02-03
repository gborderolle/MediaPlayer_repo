<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="TestCenterASPX.aspx.cs" Inherits="MediaPlayer.TestCenterASPX" MasterPageFile="~/Site.Master" %>

<asp:content id="Content2" ContentPlaceHolderID="ContentHeader" runat="server">

    <script src="assets/js/jquery-1.12.0.js"></script>

    <link href="theme-2.css" type="text/css" rel="stylesheet"/> 

   <script type="text/javascript"> </script>

  <style type="text/css">
    #UpdatePanel1 { 
      width:300px; height:100px;
     }
    </style>

</asp:content>

<asp:content id="Content1" ContentPlaceHolderID="ContentBody" runat="server">
     <form id="form1" runat="server">
    <div style="padding-top: 10px">
        <asp:ScriptManager ID="ScriptManager1" runat="server">
        </asp:ScriptManager>
        <asp:UpdatePanel ID="UpdatePanel1" runat="server">
            <ContentTemplate>
                <fieldset>
                <legend>UpdatePanel</legend>
                <asp:Label ID="Label1" runat="server" Text="Panel created."></asp:Label><br />
                <asp:Button ID="Button1" runat="server" OnClick="Button1_Click" Text="Button" />
                </fieldset>
            </ContentTemplate>
        </asp:UpdatePanel>
        <br />
        </div>

    <br />
    <br />
    <br />
    <br />

    <div id="playerContainer" style="height: 50px;">
		<div id="controlContainer">
			<ul class="controls">
			<li>
				<a href="#" class="shuffle" data-attr="shuffled"></a>
			</li>
				<li>
					<a href="#" class="left" data-attr="prevAudio"></a>
				</li>
				<li>
					<a href="#" class="play" data-attr="playPauseAudio"></a> <!-- pauseAudio -->
				</li>
				<li>
					<a href="#" class="right" data-attr="nextAudio"></a>
				</li>
				<li>
					<a href="#" class="repeat" data-attr="repeatSong"></a>
				</li>
			</ul>
		</div>
	</div>


    </form>
</asp:content>