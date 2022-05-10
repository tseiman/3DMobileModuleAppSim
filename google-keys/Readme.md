# MQTT Device certificate and key managment

# certifcate for MQTT TCP connection

Download here the _minimal_ Google Public Root CA Certificate used by the MQTT Server.
Please check out google cloud documentation how to obtain it:
https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#downloading_mqtt_server_certificates

Convert the gtsltsr.crt file downloaded from google to a PEM (ascii armoured certifcate) file by using the following commands:

```
cd certificates
wget https://pki.goog/gtsltsr/gtsltsr.crt
openssl x509 -inform DER -in gtsltsr.crt -out gtsltsr.pem -outform PEM
cd ..
```
Please copy the ASCII armoured certificate to the modem configuration GUI


## key to autenticate agaisnt Google MQTT server

```
cd google-keys
openssl genpkey -algorithm RSA -out rsa_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem
cd ..
```
Place the public key from the *google-keys* folder in the device configuration of Google IoT central device managment (**GCloud --> IoT Core --> Devices --> Create Device --> Coomunication, Cloud Logging, Authentication --> Authentication (optional) --> e.g. Manual key upload**)

The provate kay must be as well configured int the modem configuration GUI

