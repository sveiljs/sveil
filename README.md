# sveil (alpha version)
Sveil core (not for prod yet). 

- Allow to subscribe for svelte stores (with unsubscribeAll option)
- Allow to get current value of store with $ sign (emulate svelte file behaiour)

## Basic example
```
/* eslint-disable @typescript-eslint/no-empty-interface */
import { type SubscribitionsBase, Subscribitions } from '@sveil/core';
import type { SvelteComponentState, SvelteStore, SvelteStoreFn } from '@sveil/core';

export interface State extends SvelteComponentState {
	counter: SvelteStore<number>;
	counterIncrement: SvelteStoreFn<unknown>;
	counterSet: SvelteStoreFn<number>;
}

// Add properties in type
export interface ComponentService extends SubscribitionsBase<State> {}

// Add properties in runtime
export class ComponentService extends Subscribitions {
	constructor(state: State) {
		super(state);
		// after super value of counter should be accessable in class with this.$counter
		// in component you just need to call this.unsubscribeAll() in onDestroy
		this.addSubscription(this.addSubscriptionLog()); //subscription option 1
		this.subscribeStore(this.counter, this.subscribeStoreLog); //subscription option 2
	}

	logCounter() {
		console.log('this.$counter', this.$counter); //current value of counter store
	}

	addSubscriptionLog() {
		return this.counter.subscribe((n) => {
			console.log('addSubscription callback', n);
		});
	}

	subscribeStoreLog(n: number) {
		console.log('subscribeStore callback', n);
	}
}
```




