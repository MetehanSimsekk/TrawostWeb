import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabase";

export default function AdminRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    

    const channel = supabase
      .channel("applications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", 
          schema: "public",
          table: "applications",
        },
        (payload) => {
         
          queryClient.invalidateQueries({ queryKey: ["applications"] });
        }
      )
      .subscribe((status) => {
       
      });

    return () => {
      supabase.removeChannel(channel);
      console.log("🔴 Realtime kapandı");
    };
  }, []);

  return null; // sadece listener
}