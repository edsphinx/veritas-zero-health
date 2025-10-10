import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ExtractAbiEvent, type ExtractAbiEventNames } from "abitype";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo, useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { ContractAbi, ContractName } from "~~/utils/scaffold-eth/contract";

// Definimos una configuración simple y clara para nuestro hook.
type UseSunnyHistoryConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = {
  contractName: TContractName;
  eventName: TEventName;
  fromBlock?: bigint;
  filters?: any;
  enabled?: boolean;
};

/**
 * @notice Hook personalizado, simple y seguro con tipos para leer el historial de eventos.
 * @dev Realiza una única llamada 'getLogs' y utiliza genéricos avanzados para devolver
 * un array de eventos perfectamente tipado, eliminando la necesidad de usar 'any' en los componentes.
 */
export const useSunnyHistory = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  enabled = true,
}: UseSunnyHistoryConfig<TContractName, TEventName>) => {
  const { data: deployedContractData } = useDeployedContractInfo({ contractName });
  const publicClient = usePublicClient();
  const selectedNetwork = useSelectedNetwork();

  // Mantenemos la advertencia útil para el desarrollador.
  useEffect(() => {
    if (selectedNetwork.id !== hardhat.id) {
      console.log(`⚠️ Usando useSunnyHistory en una red pública. Para producción, considera un indexer.`);
    }
  }, [selectedNetwork.id]);

  // Mantenemos la lógica inteligente para el 'fromBlock'.
  const fromBlockValue =
    fromBlock ?? (deployedContractData?.deployedOnBlock ? BigInt(deployedContractData.deployedOnBlock) : 0n);

  return useQuery({
    queryKey: ["sunnyHistory", contractName, eventName, fromBlockValue.toString(), JSON.stringify(filters)],
    queryFn: async () => {
      if (!publicClient || !deployedContractData) return [];

      // LA CLAVE DE LA ELEGANCIA ESTÁ AQUÍ:
      // Usamos ExtractAbiEvent para obtener el tipo exacto del evento del ABI.
      const event = deployedContractData.abi.find(part => part.type === "event" && part.name === eventName) as
        | ExtractAbiEvent<ContractAbi<TContractName>, TEventName>
        | undefined;

      if (!event) throw new Error(`Evento '${eventName}' no encontrado en el ABI.`);

      // Gracias a que 'event' está fuertemente tipado, la respuesta de 'getLogs'
      // también lo estará. Viem inferirá automáticamente la estructura de 'args'.
      return await publicClient.getLogs({
        address: deployedContractData.address,
        event: event,
        args: filters,
        fromBlock: fromBlockValue,
        toBlock: "latest",
      });
    },
    enabled: enabled && !!publicClient && !!deployedContractData && fromBlockValue > 0n,
  });
};
