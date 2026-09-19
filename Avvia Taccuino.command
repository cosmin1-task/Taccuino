#!/bin/bash
# Doppio clic su questo file per avviare il Taccuino.

cd "$(dirname "$0")" || exit 1
clear

# Cerco Node in tutti i posti dove di solito si installa su macOS.
NODE=""
for candidato in "$(command -v node 2>/dev/null)" \
                 /opt/homebrew/bin/node \
                 /usr/local/bin/node \
                 "$HOME/.nvm/versions/node/"*/bin/node ; do
  if [ -n "$candidato" ] && [ -x "$candidato" ]; then NODE="$candidato"; break; fi
done

if [ -z "$NODE" ]; then
  echo ""
  echo "  Manca Node.js, che e' il motore su cui gira il Taccuino."
  echo ""
  echo "  Come rimediare:"
  echo "    1. Vai su   https://nodejs.org"
  echo "    2. Scarica la versione LTS per macOS"
  echo "    3. Installala facendo doppio clic sul file scaricato"
  echo "    4. Torna qui e fai di nuovo doppio clic su 'Avvia Taccuino'"
  echo ""
  echo "  Premi Invio per chiudere."
  read -r
  exit 1
fi

# Apro il browser un attimo dopo, cosi' il programma ha il tempo di partire.
( sleep 1.5 ; open "http://localhost:4321" ) &

"$NODE" server.js

echo ""
echo "  Il Taccuino e' stato chiuso. Premi Invio per chiudere questa finestra."
read -r
