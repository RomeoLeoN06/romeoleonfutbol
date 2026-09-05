using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

class Program {
    static void Main() {
        try {
            string tempPath = Path.Combine(Path.GetTempPath(), "RomeoLeoNFutbol_Game.html");
            
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("game.html"))
            {
                if (stream != null) {
                    using (FileStream fileStream = new FileStream(tempPath, FileMode.Create)) {
                        stream.CopyTo(fileStream);
                    }
                }
            }

            string iconPath = Path.Combine(Path.GetTempPath(), "RomeoLeoNFutbol_icon.ico");
            using (Stream iconStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("icon.ico"))
            {
                if (iconStream != null) {
                    using (FileStream iconFileStream = new FileStream(iconPath, FileMode.Create)) {
                        iconStream.CopyTo(iconFileStream);
                    }
                }
            }

            string pngPath = Path.Combine(Path.GetTempPath(), "RomeoLeoNFutbol_icon.png");
            using (Stream pngStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("logo.png"))
            {
                if (pngStream != null) {
                    using (FileStream pngFileStream = new FileStream(pngPath, FileMode.Create)) {
                        pngStream.CopyTo(pngFileStream);
                    }
                }
            }

            // Try Edge App Mode (Hides address bar)
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            string chromePath86 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            
            if (File.Exists(chromePath)) {
                Process.Start(chromePath, "--app=\"file:///" + tempPath.Replace('\\', '/') + "\"");
            } else if (File.Exists(chromePath86)) {
                Process.Start(chromePath86, "--app=\"file:///" + tempPath.Replace('\\', '/') + "\"");
            } else if (File.Exists(edgePath)) {
                Process.Start(edgePath, "--app=\"file:///" + tempPath.Replace('\\', '/') + "\"");
            } else {
                // Fallback to default browser
                Process.Start(new ProcessStartInfo {
                    FileName = tempPath,
                    UseShellExecute = true
                });
            }
        } catch (Exception ex) {
            // Hata olursa gizlice gec
        }
    }
}
