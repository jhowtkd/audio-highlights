# FFmpeg Video Processing Service

Microservice for fast video processing using native FFmpeg.

## Endpoints

### `GET /health`
Health check endpoint.

### `POST /cut-video`
Cut a segment from a video file.

**Request:** `multipart/form-data`
- `video`: Video file
- `start`: Start time in seconds
- `end`: End time in seconds

**Response:** Video file (video/mp4)

## Local Development

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t ffmpeg-service .
docker run -p 3001:3001 ffmpeg-service
```

## Deploy to Railway

1. Create new project on Railway
2. Connect this repository
3. Set root directory to `ffmpeg-service`
4. Railway will auto-detect Dockerfile
5. Add environment variable: `ALLOWED_ORIGIN=https://your-app.vercel.app`
