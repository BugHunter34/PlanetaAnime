import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default function VideoJSPlayer({ episode }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!episode || !containerRef.current) return;

    // Detect if it's an HLS stream or an MP4 fallback
    const isHls = episode.link?.includes(".m3u8");
    const videoType = isHls ? "application/x-mpegURL" : "video/mp4";

    // Initialize Video.js player only once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered"); // Centers the play button
      containerRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src: episode.link, type: videoType }],
      });
    } else {
      // Update the player source when the episode changes
      const player = playerRef.current;
      player.src({ src: episode.link, type: videoType });
    }

    const player = playerRef.current;

    // Clear existing subtitle tracks to prevent duplicates when switching episodes
    const oldTracks = player.remoteTextTracks();
    let i = oldTracks.length;
    while (i--) {
      player.removeRemoteTextTrack(oldTracks[i]);
    }

    // Add new subtitle tracks dynamically
    if (episode.sub_cz) {
      player.addRemoteTextTrack({
        kind: "captions",
        label: "Čeština",
        srclang: "cs",
        src: episode.sub_cz,
        default: true
      }, false);
    }
    if (episode.sub_en) {
      player.addRemoteTextTrack({
        kind: "captions",
        label: "English",
        srclang: "en",
        src: episode.sub_en,
        default: false
      }, false);
    }

  }, [episode]);

  // Clean up the player instance when the component unmounts
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  if (!episode) return null;

  return (
    <div style={{ width: "100%", marginTop: "1rem" }}>
      <h2 style={{ marginBottom: "1rem", color: "white" }}>
        Episode {episode.number}: {episode.title}
      </h2>
      <div data-vjs-player>
        <div ref={containerRef} />
      </div>
    </div>
  );
}