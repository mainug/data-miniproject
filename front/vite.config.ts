import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 0.0.0.0 바인딩 — 같은 네트워크의 다른 PC에서 접속 가능
    port: 3000,
    strictPort: true, // 3000이 점유돼 있으면 자동 변경 대신 에러로 알림
    proxy: {
      "/api": {
        // localhost 대신 127.0.0.1 고정 — IPv6(::1) 우선 해석로 인한 ECONNREFUSED 방지
        target: process.env.VITE_API_BASE_URL || "http://127.0.0.1:8080",
        changeOrigin: true,
        // AI(Ollama) 응답이 길어 기본 타임아웃에 끊기는 것 방지 (3분)
        timeout: 180000,
        proxyTimeout: 180000,
        // 백엔드 @CrossOrigin이 프록시로 전달된 Origin을 보고 403 내는 것 방지
        // (프록시 경유는 사실상 same-origin이므로 Origin 헤더 제거)
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
    },
  },
});
