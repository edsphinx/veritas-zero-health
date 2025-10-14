# Nillion Collections Setup Script

Este script crea automáticamente las 5 colecciones de Nillion necesarias para Veritas Zero Health usando la API de SecretVaults.

## Requisitos Previos

1. **Suscripción activa a Nillion nilDB**
   - Visita: https://nilpay.vercel.app/
   - Conecta tu wallet
   - Suscríbete al servicio nilDB

2. **Variables de entorno configuradas** (en `.env.local`):
   ```bash
   NILLION_CHAIN_URL=http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz
   NILLION_AUTH_URL=https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz
   NILLION_NODE_URLS=https://nildb-stg-n1.nillion.network,https://nildb-stg-n2.nillion.network,https://nildb-stg-n3.nillion.network
   ```

3. **(Opcional) Private Key de tu builder anterior**:
   ```bash
   NILLION_BUILDER_PRIVATE_KEY=tu_private_key_en_hex
   ```
   - Si no lo tienes, el script generará uno nuevo
   - **IMPORTANTE**: Guarda el private key que genere el script

## Uso

```bash
yarn nillion:create-collections
```

## ¿Qué hace el script?

1. **Valida configuración**: Verifica que todas las variables de entorno estén configuradas
2. **Carga/genera keypair**:
   - Si tienes `NILLION_BUILDER_PRIVATE_KEY`, lo usa
   - Si no, genera uno nuevo y te lo muestra para que lo guardes
3. **Inicializa cliente**: Conecta con los nodos de Nillion usando SecretVaultBuilderClient
4. **Verifica suscripción**: Confirma que tengas una suscripción activa
5. **Crea colecciones**: Crea las 5 colecciones con sus schemas:
   - `Veritas Diagnoses Collection`
   - `Veritas Biomarkers Collection`
   - `Veritas Vitals Collection`
   - `Veritas Medications Collection`
   - `Veritas Allergies Collection`

## Salida del Script

Al terminar exitosamente, el script te mostrará:

```bash
✅ All collections created successfully!

📋 Update your .env.local with these collection IDs:

NILLION_COLLECTION_DIAGNOSES=65d3754c-7b7a-4037-b622-4021b2054f34
NILLION_COLLECTION_BIOMARKERS=8dbc8727-494d-450f-bd8c-2e581d7f08ab
NILLION_COLLECTION_VITALS=d460513d-8497-483c-8490-4328aecb29c6
NILLION_COLLECTION_MEDICATIONS=5fad10fa-18f9-4d18-ab0e-9b626ef9b86c
NILLION_COLLECTION_ALLERGIES=5ee48df6-e4e6-4747-bd4e-6352d0bc0a95

🔗 View collections at:
   https://collection-explorer.nillion.com/collections/65d3754c-7b7a-4037-b622-4021b2054f34
```

## Después de Ejecutar el Script

1. **Copia los Collection IDs** a tu `.env.local`
2. **Guarda tu NILLION_BUILDER_PRIVATE_KEY** si fue generado
3. **Verifica en Collection Explorer**: Visita el link proporcionado para ver tus colecciones
4. **Reinicia el servidor de desarrollo**: `yarn dev`

## Troubleshooting

### Error: "No active subscription found"
- Visita https://nilpay.vercel.app/
- Asegúrate de que el DID mostrado en el error tenga una suscripción activa
- Si generaste un nuevo keypair, necesitas suscribir ese nuevo DID

### Error: "Missing required environment variables"
- Verifica que tu archivo `.env.local` tenga todas las variables requeridas
- Asegúrate de que estés ejecutando el comando desde `packages/nextjs`

### Error: "Failed to create collection"
- Verifica tu conexión a internet
- Asegúrate de que los URLs de Nillion sean correctos
- Verifica que tu suscripción no haya expirado

## Notas de Seguridad

⚠️ **NUNCA** compartas tu `NILLION_BUILDER_PRIVATE_KEY` públicamente
⚠️ **NUNCA** commitees tu `.env.local` al repositorio Git
✅ Usa `.env.example` como plantilla y mantén `.env.local` en `.gitignore`

## Referencias

- **Nillion Docs**: https://docs.nillion.com
- **SecretVaults SDK**: https://docs.nillion.com/secretvaults
- **Collection Explorer**: https://collection-explorer.nillion.com
- **NilPay (Subscriptions)**: https://nilpay.vercel.app/
