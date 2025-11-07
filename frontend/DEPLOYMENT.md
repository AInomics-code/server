# Deployment Guide

## Environment Variables

Para configurar las variables de entorno en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a Settings > Environment Variables
3. Agrega la siguiente variable:

```
VITE_API_URL=https://your-backend-api-url.com
```

## Variables de entorno requeridas:

- `VITE_API_URL`: URL base de tu API backend (ejemplo: `https://api.yourapp.com`)

## Para desarrollo local:

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
VITE_API_URL=http://localhost:8000
```

## Build Commands

- Development: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Configuración actual:

- Framework: React + Vite
- Routing: wouter (client-side routing)
- Build output: `dist/public`
- Configurado como SPA (Single Page Application)
