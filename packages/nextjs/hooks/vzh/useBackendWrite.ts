import { useState } from "react";
import { ExtractAbiFunctionNames } from "abitype";
import { type TransactionReceipt } from "viem";
import { usePublicClient } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import { ContractAbi, ContractName, ScaffoldWriteContractVariables } from "~~/utils/scaffold-eth/contract";

/**
 * @dev Opciones para la función de escritura, incluyendo el callback de confirmación.
 */
type WriteOptions = {
  onBlockConfirmation?: (txnReceipt: TransactionReceipt) => void;
};

/**
 * @author edsphinx
 * @notice Hook personalizado para ejecutar transacciones de administrador a través de un backend seguro.
 * @dev Este hook abstrae la llamada a la API `/api/admin-action`. Proporciona una interfaz similar a
 * `useScaffoldWriteContract`, pero delega la firma y el envío de la transacción al servidor,
 * que utiliza una llave privada de administrador guardada de forma segura en las variables de entorno.
 * Es para funciones que solo el dueño del contrato debe ejecutar (ej. mints, cambios de estado)
 * pero que puedan ser iniciadas por cualquier usuario desde la UI.
 *
 * @template TContractName El nombre del contrato al que se va a llamar, inferido de los tipos generados.
 *
 * @param {TContractName} contractName El nombre del contrato al que se apuntará.
 * @returns Un objeto con:
 * - `isMining` (boolean): `true` mientras la transacción está siendo procesada por el backend.
 * - `writeContractAsync` (function): La función asíncrona para ejecutar la transacción.
 */
export const useBackendWrite = <TContractName extends ContractName>(contractName: TContractName) => {
  const [isMining, setIsMining] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const publicClient = usePublicClient();

  const replacer = (_key: any, value: any) => (typeof value === "bigint" ? value.toString() : value);

  /**
   * @notice Envía la transacción al backend y espera su confirmación en el frontend.
   * @param variables Objeto con `functionName` y `args`.
   * @param options Objeto opcional con callbacks como `onBlockConfirmation`.
   * @returns El hash de la transacción si es exitosa.
   */
  const writeContractAsync = async <
    TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "nonpayable" | "payable">,
  >(
    variables: ScaffoldWriteContractVariables<TContractName, TFunctionName>,
    options?: WriteOptions,
  ): Promise<string | undefined> => {
    setIsMining(true);
    let txHash: string | undefined = undefined;

    try {
      const publicKey = process.env.NEXT_PUBLIC_API_SECRET_KEY;
      if (!publicKey) {
        throw new Error("Clave de API pública (NEXT_PUBLIC_API_SECRET_KEY) no encontrada.");
      }
      const obfuscatedKey = btoa(publicKey);

      const response = await fetch("/api/admin-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obfuscatedKey}`,
        },
        body: JSON.stringify({ contractName, ...variables }, replacer),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error desconocido del servidor.");
      }

      txHash = data.hash;

      if (typeof txHash === "string" && txHash.startsWith("0x")) {
        notification.success(`Transacción enviada! Hash: ${txHash.slice(0, 8)}...`);

        if (!publicClient) {
          throw new Error("Cliente público no disponible. Asegúrate de estar conectado a una wallet.");
        }

        notification.info("Esperando confirmación del bloque...");
        const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

        if (options?.onBlockConfirmation) {
          options.onBlockConfirmation(txReceipt);
        }
        notification.success("¡Transacción confirmada!");
      } else {
        throw new Error("La API no devolvió un hash de transacción válido.");
      }

      return txHash;
    } catch (e: any) {
      console.error("❌ Error en useBackendWrite:", e);
      notification.error(e.message || "Ocurrió un error al procesar la acción.");
    } finally {
      setIsMining(false);
    }
  };

  /**
   * @notice Notifica al backend para que revise una bóveda y la ejecute si cumple las condiciones.
   * @param payload Objeto que contiene los datos necesarios para la API, como 'vaultAddress'.
   */
  const checkAndExecute = async (payload: { vaultAddress: string }) => {
    setIsExecuting(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_API_SECRET_KEY;
      if (!publicKey) throw new Error("Clave de API pública no encontrada.");

      const obfuscatedKey = btoa(publicKey);

      const response = await fetch("/api/execute-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obfuscatedKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error del servidor al ejecutar.");

      if (data.action && data.action !== "none") {
        notification.success(`¡Backend ejecutó ${data.action} exitosamente!`);
      }
    } catch (e: any) {
      console.error("❌ Error en checkAndExecute:", e);
      notification.error(e.message || "Error al notificar al backend.");
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    isMining,
    writeContractAsync,
    isExecuting,
    checkAndExecute,
  };
};
