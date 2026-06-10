# Variables de entorno y Google Auth local

Esta guia resume como manejar configuracion local sin publicar secretos reales.
Los archivos `.env` reales son locales de cada maquina y no deben subirse a GitHub.

## Backend privado

Para ejecucion manual del backend se recomienda usar:

```text
backend/.env
```

Variables privadas esperadas:

```env
MONGO_URI=
JWT_SECRET=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GOOGLE_CLIENT_ID=
CORS_ORIGIN=http://localhost:3000
WEBOTP_DOMAIN=localhost
NODE_ENV=development
```

`JWT_SECRET`, `EMAIL_PASS`, `TWILIO_AUTH_TOKEN` y la cadena real de MongoDB son secretos. Deben vivir solo en backend, Docker o el proveedor de despliegue.

El backend carga variables desde `backend/config/load-env.js`. Prioriza variables reales del proceso y, para desarrollo local, lee `.env` de la raiz y `backend/.env` sin imprimir valores. Ya no carga `apps/web/.env` para secretos del backend.

## Frontend publico

Para ejecucion manual del frontend con Vite se recomienda usar:

```text
apps/web/.env.local
```

Solo debe contener variables publicas `VITE_*`:

```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=
VITE_ENABLE_LOCAL_AUTH_FALLBACK=false
```

Todo lo que empieza por `VITE_` queda disponible en el bundle del navegador. No pongas `JWT_SECRET`, `EMAIL_PASS`, `TWILIO_AUTH_TOKEN`, cadenas privadas de MongoDB ni client secrets de Google en archivos del frontend.

`apps/web/.env.local.example` contiene un ejemplo minimo para este modo.

## Docker y Makefile

El flujo Docker actual se mantiene compatible con:

```bash
make build
make up
```

Docker Compose usa MongoDB interno por defecto:

```env
MONGO_URI=mongodb://mongodb:27017/logistica_db
```

Si necesitas valores privados locales, usa `.env` en la raiz o `backend/.env` para backend. El frontend debe quedarse con variables publicas `VITE_*` en `apps/web/.env.local`. Ningun archivo real de entorno debe subirse a Git.

Para revisar la configuracion sin iniciar contenedores:

```bash
docker compose config
```

## Google Auth local

El frontend usa `VITE_GOOGLE_CLIENT_ID` en:

- `apps/web/src/main.jsx`
- `apps/web/src/components/GoogleAuthButton.jsx`

No se usa `client secret` en el frontend. El componente de Google trabaja con el OAuth Client ID publico del navegador.

El script actual de Vite corre en puerto 3000:

```bash
cd apps/web
npm run dev
```

Docker tambien publica el frontend en:

```text
http://localhost:3000
```

Si aparece:

```text
Error 400: origin_mismatch
```

normalmente no es un bug del codigo, sino que falta registrar el origen local en Google Cloud Console, dentro del OAuth Client ID del frontend. Agrega los origenes que uses:

```text
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://127.0.0.1:5173
http://localhost
http://localhost:80
```

Los puertos `5173` se incluyen por si se ejecuta Vite con su puerto por defecto o una configuracion alternativa. Si se usa un dominio real en produccion, ese dominio tambien debe estar autorizado.

El flujo actual usa el boton de Google con credenciales del navegador, no un redirect propio de la aplicacion. Si en el futuro se cambia a flujo redirect, tambien habria que registrar los redirect URI exactos.

## WebOTP y SMS

El backend puede agregar una linea compatible con WebOTP en SMS:

```text
@localhost #123456
```

La variable `WEBOTP_DOMAIN` permite cambiar `localhost` por el dominio real en produccion. En produccion debe ser el dominio publicado de la app, sin `http://` ni rutas. Si no se configura en produccion, el SMS sigue siendo legible para humanos y no expone secretos.

## Archivos example

Los archivos `.env.example` y `.env.local.example` solo deben contener placeholders. Se pueden versionar porque no contienen credenciales reales.
