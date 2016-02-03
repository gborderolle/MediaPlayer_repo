using MediaPlayer.Domain;
using MediaPlayer.Extras;
using MediaPlayer.Security;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MediaPlayer
{
    public partial class Login : System.Web.UI.Page
    {
        #region Events

        protected void Page_Load(object sender, EventArgs e)
        {
            Logout();

            if (!IsPostBack)
            {
                string qs_loginToken = Request.QueryString["loginToken"];
                if (!string.IsNullOrWhiteSpace(qs_loginToken) && !string.IsNullOrWhiteSpace(qs_loginToken))
                {
                    UserToken userToken = UserTokenRepository.GetUserToken(qs_loginToken);
                    if (userToken != null)
                    {
                        Perform_login(userToken.User, userToken.Password, true, true);
                    }
                    else
                    {
                        ScriptManager.RegisterStartupScript(this, typeof(Page), "ShowErrorMessage", "ShowErrorMessage('" + 2 + "');", true);
                    }
                }
            }
        }

        private void Logout()
        {
            Session["UserID"] = null;
            Session["UserName"] = null;
        }

        protected void submitButton_ServerClick(object sender, EventArgs e)
        {
            string username = txbUser.Text;
            string password = txbPassword.Text;
            Perform_login(username, password, false);
        }

        protected void btnLoginCandidate_Click(object sender, EventArgs e)
        {
            string username = txbUser.Text;
            string password = txbPassword.Text;
            Perform_login(username, password, false);
        }

        #endregion Events

        #region Methods

        private void Perform_login(string username, string password, bool isPasswordInput_hashed = false, bool isTokenLogin = false)
        {
            if (!string.IsNullOrWhiteSpace(username) || !string.IsNullOrWhiteSpace(password))
            {
                // #1- Logger variables
                System.Diagnostics.StackFrame stackFrame = new System.Diagnostics.StackFrame();
                string className = System.Reflection.MethodBase.GetCurrentMethod().DeclaringType.Name;
                string methodName = stackFrame.GetMethod().Name;

                bool ok = false;
                try
                {
                    string userID = Global.GlobalMethods.CheckLogin(username, password, isPasswordInput_hashed, isTokenLogin);
                    if (!string.IsNullOrWhiteSpace(userID))
                    {
                        User user = new User(userID, "");
                        if (user != null)
                        {
                            ok = true;
                            Session["UserID"] = user.id;
                            Session["UserName"] = user.userName;

                            string returnURL = "Dashboard.aspx";
                            string query_string = Request.QueryString["folioID"];
                            if (!string.IsNullOrWhiteSpace(query_string))
                            {
                                returnURL = "Dashboard.aspx?folioID=" + query_string;
                            }

                            Response.Redirect(returnURL, false);
                        }
                    }
                    if (!ok)
                    {
                        ScriptManager.RegisterStartupScript(this, typeof(Page), "ShowErrorMessage", "ShowErrorMessage('" + 2 + "');", true);
                    }
                }
                catch (Exception e)
                {
                    ScriptManager.RegisterStartupScript(this, typeof(Page), "ShowErrorMessage", "ShowErrorMessage('" + 3 + "');", true);

                    // #2- Logger exception
                    Logger.LogError("(%s) (%s) -- Excepcion. Haciendo login. ERROR: %s", className, methodName, e.Message);
                }
            }
            else
            {
                ScriptManager.RegisterStartupScript(this, typeof(Page), "ShowErrorMessage", "ShowErrorMessage('" + 1 + "');", true);
            }
        }

        #endregion Methods
    }
}