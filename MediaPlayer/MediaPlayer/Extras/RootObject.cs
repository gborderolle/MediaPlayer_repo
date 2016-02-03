using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MediaPlayer.Extras
{
    public class RootObject
    {
        public string name { get; set; }

        public string color { get; set; }

        public List<Span> spans { get; set; }

        public RootObject()
        {
            this.spans = new List<Span>();
        }
    }
}