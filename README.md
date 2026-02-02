# SIM800 HTTP Server (HTTP puro)
 
Recibe:
  GET /estado?ac=0|1[&key=TOKEN]
 
Rutas útiles:
  GET /health
  GET /last
  GET /history?n=100
 
## Variables (.env)
SECRET_TOKEN=MI_TOKEN_SEGURO
FORWARD_NODE_RED=false
NODE_RED_URL=http://TU_NODE_RED_PUBLICO:1880/estado
PORT=80
 
## Run local
npm install
cp .env.example .env  # edita si usas token o forward
npm start
