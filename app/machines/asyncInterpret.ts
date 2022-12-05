import { interpret } from 'xstate';
import { waitFor } from 'xstate/lib/waitFor';
import type { AnyStateMachine, AnyState, EventObject } from 'xstate';

export async function asyncInterpret(
	machine: AnyStateMachine,
	msToWait: number,
	initialState?: AnyState,
	initialEvent?: EventObject
) {
	const service = interpret(machine);
	service.start(initialState);
	if (initialEvent) {
		service.send(initialEvent);
	}
	return await waitFor(service, (state) =>  state.done || state.hasTag('pause'), {
		timeout: msToWait,
	});
}
