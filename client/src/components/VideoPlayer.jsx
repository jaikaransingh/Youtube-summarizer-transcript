import React from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ videoUrl, transcript }) => {
  return (
    <div>
      <ReactPlayer url={videoUrl} />
      <h2>Transcript:</h2>
      <pre className='transcript'>{transcript}</pre>
    </div>
  );
};

export default VideoPlayer;
