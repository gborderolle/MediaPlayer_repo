using MediaPlayer.Data_Objects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MediaPlayer.Security
{
    public class UserTokenRepository
    {
        // Source: https://www.youtube.com/watch?v=gRB5zOswWRY

        public static UserToken GetUserToken(string token)
        {
            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            return obj.GetUserToken(token);
        }

        public static string GenerateToken()
        {
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(string.Format("{0}{1}{2}", "testapi", DateTime.Today.ToShortDateString(), DateTime.Today.ToShortTimeString())));
        }

        public static string CreateUserToken(string username, string password)
        {
            var token = GenerateToken();

            ExternalsMethodDAO obj = new ExternalsMethodDAO();
            obj.AddUserToken(new UserToken
            {
                Token = token,
                User = username,
                Password = password
            });
            return token;
        }
    }
}