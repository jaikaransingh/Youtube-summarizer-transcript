const TranscriptModel = require('../models/TranscriptModel');
const { getSubtitles } = require('youtube-captions-scraper');
const ytdl = require('ytdl-core');
const { OpenAI } = require('openai'); // Import the OpenAI API client

// Extract video ID from the YouTube URL
const extractVideoId = (url) => {
  const regex = /(?:\/embed\/|v=|v\/|vi\/|youtu\.be\/|\/v\/|^https?:\/\/(?:www\.)?youtube\.com\/(?:(?:watch)?\?.*v=|(?:embed|v|vi|user)\/))([^#\&\?]*).*/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Fetch video info using ytdl-core package
async function fetchVideoInfo(videoUrl) {
  try {
    const info = await ytdl.getInfo(videoUrl);
    if (!info || !info.videoDetails || !info.videoDetails.title) {
      throw new Error('YouTube video information not found.');
    }
    return { title: info.videoDetails.title };
  } catch (error) {
    if (error.message === 'Video unavailable') {
      throw new Error('YouTube video is unavailable.');
    } else {
      throw new Error('Error fetching video information.');
    }
  }
}

// Fetch video transcript using the youtube-captions-scraper package
async function fetchVideoTranscript(videoId) {
  try {
    if (!videoId) {
      throw new Error('Invalid YouTube video URL.');
    }

    const captions = await getSubtitles({
      videoID: videoId,
      lang: 'en', // English captions
    });

    if (!captions || captions.length === 0) {
      return { transcript: null };
    }

    const transcriptText = captions.reduce((acc, caption) => {
      return acc + caption.text + ' \n';
    }, '');

    return { transcript: transcriptText };
  } catch (error) {
    return { transcript: null };
  }
}

// Initialize the OpenAI API client with your API key
const openai = new OpenAI({
  apiKey: 'YOUR_OPENAI_API_KEY', // Replace with your OpenAI API key
});

// Function to use GPT-3 for summarization
async function generateSummary(transcript) {
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt: `Summarize the following transcript:\n${transcript}`,
      max_tokens: 50,
    });

    return response.choices[0].text;
  } catch (error) {
    throw new Error('Error generating summary with GPT-3.');
  }
}

// Function to use OpenAI to generate transcript from speech
async function generateTranscriptFromSpeech(videoUrl) {
  try {
    // Make a request to OpenAI to generate the transcript from the spoken content
    const openai = new OpenAI({
      apiKey: 'your-openai-key', // Replace with your OpenAI API key
    });

    const response = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt: `Transcribe the spoken content of the following video:\n${videoUrl}`,
      max_tokens: 200, // Adjust the max tokens as needed
    });

    return response.choices[0].text;
  } catch (error) {
    console.error('Error generating transcript with OpenAI:', error);
    return null;
  }
}

const createVideoTranscript = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        error: 'videoUrl is missing in the request body.',
      });
    }

    const regex = /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([^&]+).*/;
    if (!regex.test(videoUrl)) {
      return res.status(400).json({
        error: 'Please enter a valid YouTube video URL.',
      });
    }

    const videoId = extractVideoId(videoUrl);

    const existingVideo = await TranscriptModel.findOne({ videoId });

    if (existingVideo) {
      return res.json({
        videoUrl: existingVideo.videoUrl,
        transcript: existingVideo.transcript,
        summary: existingVideo.summary,
      });
    }

    const videoInfo = await fetchVideoInfo(videoUrl);
    const transcriptData = await fetchVideoTranscript(videoId);

    let transcriptMessage = '';

    if (transcriptData.transcript) {
      transcriptMessage = 'Video saved and transcribed successfully.';
    } else {
      // YouTube captions are not available, use OpenAI to generate transcript
      const spokenContent = await generateTranscriptFromSpeech(videoUrl);
      transcriptMessage = spokenContent
        ? 'Transcript generated successfully using OpenAI.'
        : 'Transcript not available for this video.';
    }

    const video = new TranscriptModel({
      videoId,
      title: videoInfo.title,
      videoUrl,
      transcript: transcriptData.transcript || null,
    });

    await video.save();

    if (!transcriptData.transcript && spokenContent) {
      video.transcript = spokenContent;
      await video.save();
    }

    const summary = await generateSummary(video.transcript);

    video.summary = summary;
    await video.save();

    res.status(201).json({
      message: transcriptMessage,
      videoUrl,
      transcript: video.transcript,
      summary,
    });
  } catch (error) {
    console.error('Error creating video transcript:', error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createVideoTranscript,
};
