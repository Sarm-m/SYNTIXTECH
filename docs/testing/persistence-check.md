# Data Persistence Check

Use this checklist to verify that DriveControl stores fleet data in MongoDB instead of relying on browser storage.

## 1. Start The Stack

```sh
docker compose config
docker compose up -d --build
curl --fail http://localhost:5000/api/health/db
curl --fail http://localhost:3000/
curl --fail http://localhost:3000/api/health/db
```

Docker Compose uses the internal MongoDB service by default:

```text
mongodb://mongodb:27017/logistica_db
```

## 2. Register Or Log In

Open:

```text
http://localhost:3000/
```

Register or log in with a test account. Do not use production credentials for this check.

## 3. Create A Vehicle

From the protected app:

1. Go to `Vehiculos`.
2. Create a vehicle with a valid plate such as `ABC123`.
3. Refresh the browser.
4. Confirm the vehicle is still visible.

The refresh step confirms the UI reloads data from the API.

## 4. Query The API

Use a placeholder token. Do not paste real tokens into documentation or shared logs.

```sh
TOKEN="<paste-test-jwt-here>"
curl --fail \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/vehiculos
```

Expected result: the response contains only vehicles owned by the authenticated user.

You can repeat the same pattern for:

```sh
curl --fail -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/conductores
curl --fail -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/soats
curl --fail -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/rtms
curl --fail -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/validaciones
```

## 5. Inspect Local MongoDB

If Docker is running locally:

```sh
docker compose exec mongodb mongosh logistica_db
```

Inside `mongosh`, inspect collections without exposing secrets:

```js
db.vehiculos.find({}, { placa: 1, ownerEmail: 1, marca: 1, modelo: 1 }).pretty()
db.conductors.find({}, { nombre: 1, documento: 1, ownerEmail: 1 }).pretty()
db.soats.find({}, { vehiculoId: 1, placaVehiculo: 1, ownerEmail: 1 }).pretty()
db.rtms.find({}, { vehiculoId: 1, placaVehiculo: 1, ownerEmail: 1 }).pretty()
db.validationhistories.find({}, { placa: 1, ownerEmail: 1, timestamp: 1 }).pretty()
```

## 6. Cleanup

```sh
docker compose down -v
```

The `-v` flag removes the local MongoDB volume, so only use it when you intentionally want to reset test data.
