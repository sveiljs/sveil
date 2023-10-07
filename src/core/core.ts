import { Readable, Subscriber, Unsubscriber, Writable } from "svelte/store";

export type SvelteStore<T> = Writable<T> | Readable<T>;

export type SvelteStoreFn<T> = (data?: T) => void;

export type SvelteResource<T> = SvelteStore<T> | SvelteStoreFn<T>;

export type SvelteComponentState = Record<string, SvelteResource<any>>;

export type extractGeneric<Type> = Type extends SvelteStore<infer X>
  ? X
  : never;

type MapToSubscribitions<T> = {
  readonly [K in keyof T as T[K] extends Function
    ? K
    : `$${K & string}`]: T[K] extends Function ? T[K] : extractGeneric<T[K]>;
} & T;

export type SubscribitionsBase<T> = MapToSubscribitions<T>;

export class Subscribitions {
  [key: string]: any;
  private subscriptions: Unsubscriber[] = [];

  constructor(state: SvelteComponentState) {
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === "function") {
        this.addStoreMethod(key, value);
      } else {
        this.watchLocalStoreValue(key, value);
      }
    }
  }

  public unsubscribeAll() {
    this.subscriptions.forEach((unsubscription) => unsubscription());
  }

  protected addSubscription(unsubscriptions: Unsubscriber | Unsubscriber[]) {
    const sub = Array.isArray(unsubscriptions)
      ? unsubscriptions
      : [unsubscriptions];
    this.subscriptions = [...this.subscriptions, ...sub];
  }

  protected subscribeStore<T>(
    store: Writable<T> | Readable<T>,
    callback: Subscriber<T>
  ) {
    this.addSubscription(store.subscribe(callback.bind(this)));
  }

  private watchLocalStoreValue<T>(
    storeName: string,
    store: Writable<T> | Readable<T>
  ) {
    this.addSubscription(
      store.subscribe((data) => {
        this.storeValueSubscriber.call(this, data, storeName);
      })
    );
    this[storeName] = store;
  }

  private addStoreMethod<T = void>(
    fnName: string,
    storeMethod: (data?: any) => T
  ) {
    this[fnName] = storeMethod.bind(this);
  }

  private storeValueSubscriber<T>(data: T, storeName: string) {
    this[`$${storeName}`] = data;
  }
}
