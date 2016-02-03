using MediaPlayer.Data_Objects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MediaPlayer.Domain
{
    [Serializable]
    public class Folio
    {
        #region Properties

        public string folio_textID { get; set; }

        public int tapeID { get; set; }

        public int segmentID { get; set; }

        public string groupName { get; set; }

        public string userName { get; set; }

        public string localParty { get; set; }

        public string remoteParty { get; set; }

        public DateTime timestamp { get; set; }

        public int duration { get; set; }

        public string mediaType { get; set; }

        public EnumTapeType_code TapeType_code { get; set; }

        public enum EnumTapeType_code
        {
            Audio,
            Grabacion,
            Video,
            Documento,
            Comentario,
            Imagen
        }

        public int deleted { get; set; }

        public string fileName { get; set; }

        public string filePath { get; set; }

        public string fileStatus { get; set; }

        #endregion Properties

        #region Constructors

        public Folio()
        {
        }

        public Folio(int FolioID)
        {
            //id = FolioID;
            //Fill();
        }

        #endregion Constructors

        #region Methods

        public void Create()
        {
            //OrkprogramDAO.Create(this);
        }

        #endregion Methods
    }
}