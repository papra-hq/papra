import { commonApiErrorDefinitions } from './contracts.errors';
import type { PublicApiErrorDefinition } from './contracts.errors';
import type { EndpointContract } from './contracts.types';

type ApiErrorFactory<Definition extends PublicApiErrorDefinition = PublicApiErrorDefinition> = {
  readonly definition: Definition;
};

type InferErrorDefinitions<Factories extends readonly ApiErrorFactory[]> = {
  readonly [Index in keyof Factories]: Factories[Index] extends ApiErrorFactory<infer Definition>
    ? Definition
    : never;
};

type EndpointContractDefinition = Omit<EndpointContract, 'errors'>;

export function defineEndpointContract<
  const Contract extends EndpointContractDefinition,
  const ErrorFactories extends readonly ApiErrorFactory[] = readonly [],
>(
  contract: Contract & { errors?: ErrorFactories },
): Omit<Contract, 'errors'> & {
  readonly errors: readonly [
    ...typeof commonApiErrorDefinitions,
    ...InferErrorDefinitions<ErrorFactories>,
  ];
} {
  const { errors = [], ...endpointContract } = contract;

  return {
    ...endpointContract,
    errors: [
      ...commonApiErrorDefinitions,
      ...errors.map((errorFactory) => errorFactory.definition),
    ],
  } as unknown as Omit<Contract, 'errors'> & {
    readonly errors: readonly [
      ...typeof commonApiErrorDefinitions,
      ...InferErrorDefinitions<ErrorFactories>,
    ];
  };
}
