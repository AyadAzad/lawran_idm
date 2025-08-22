import './App.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import DashboardHome from "./components/Dashboard/DashboardHome.jsx";
import CosmicCursor from "./components/ComicCursor.jsx";
import {useState} from "react";
import DownloadVideo from "./components/DownloadVideos/DownloadVideo.jsx";
import DownloadAudio from "./components/DownloadAudio/DownloadAudio.jsx";
import Download4K from "./components/Download4K/Download4K.jsx";
import DownloadPlaylist from "./components/DownloadPlaylist/DownloadPlaylist.jsx";
import Downloads from "./components/Downloads/Downloads.jsx";
import Dashboard from "./components/Dashboard/index.jsx";
import OtherPlatforms from "./components/OtherPlatforms/DownloadOtherPlatforms.jsx";
import DownloadDocuments from "./components/DownloadDocuments/Documents.jsx";
function App() {
    const [cursorVariant, setCursorVariant] = useState("default");
  const [cursorText, setCursorText] = useState("");

  const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />, // The Dashboard is the parent layout for all routes
    children: [
      { index: true, element: <DashboardHome /> }, // The default page at '/'
      { path: 'download-hd', element: <DownloadVideo /> },
      { path: 'download-audio', element: <DownloadAudio /> },
      { path: 'download-4k', element: <Download4K /> },
      { path: 'download-playlist', element: <DownloadPlaylist /> },
      { path: 'other-platforms', element: <OtherPlatforms />},
      { path: 'documents', element: <DownloadDocuments />},
      { path: 'downloads', element: <Downloads /> },
    ],
  },
]);
  return (
      <>
          <CosmicCursor variant={cursorVariant} text={cursorText}/>
          <RouterProvider router={router} />
      </>
  )
}

export default App
