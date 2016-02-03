import QtQuick 2.1
import QmlVlc 0.1

Rectangle {
    id: bg
    color: bgcolor
    VlcVideoSurface {
        id: videoOutput
        source: vlcPlayer
        anchors.fill: parent
        MouseArea {
            anchors.fill: parent;
            focus: true;
            onClicked: vlcPlayer.togglePause();
            onDoubleClicked: {
                if (fullscreen) fullscreen = false;
                else fullscreen = true;
                vlcPlayer.togglePause();
            }
            Keys.onPressed: {
                if (event.key == Qt.Key_Escape) if (fullscreen) fullscreen = false;
            }
        }
    }
}