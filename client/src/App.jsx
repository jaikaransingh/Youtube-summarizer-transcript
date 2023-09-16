import React, { useState } from 'react';
import VideoForm from './components/VideoForm';
import VideoPlayer from './components/VideoPlayer';


const App = () => {
  const [videoData, setVideoData] = useState(null);

  return (
    <div className="container">
      <h1>YouTube Video Transcript Viewer</h1>
      <VideoForm setVideoData={setVideoData} />
      {videoData && (
        <div>
          <div className="video-container">
            <VideoPlayer videoUrl={videoData.videoUrl} transcript={videoData.transcript} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;