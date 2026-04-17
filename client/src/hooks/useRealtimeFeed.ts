import { useEffect } from "react";
import { getSocket } from "../services/socket";
import { useChainTraceStore } from "../store/useChainTraceStore";
import type { Checkpoint } from "../types";

export function useRealtimeFeed() {
  const addCheckpoint = useChainTraceStore((state) => state.addCheckpoint);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    function onCheckpoint(checkpoint: Checkpoint) {
      addCheckpoint(checkpoint);
    }

    function onSensorUpdate(data: any) {
      // For now, we just log it or we could add a special "Live Sensor" notification
      console.log("Real-time sensor update:", data);
    }

    socket.on("checkpoint:created", onCheckpoint);
    socket.on("sensor:update", onSensorUpdate);
    return () => {
      socket.off("checkpoint:created", onCheckpoint);
      socket.off("sensor:update", onSensorUpdate);
      socket.disconnect();
    };
  }, [addCheckpoint]);
}
