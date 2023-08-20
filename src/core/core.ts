import { getContext, onDestroy } from "svelte";
import { Readable, Subscriber, Unsubscriber, Writable } from "svelte/store";

export type SvelteStore<T> = Writable<T> | Readable<T>;

export type SvelteStoreFn<T> = (data?: T) => void;

export type SvelteResource<T> = SvelteStore<T> | SvelteStoreFn<T>;

export type SvelteComponentState = Record<string, SvelteResource<any>>;

export type extractGeneric<Type> = Type extends SvelteStore<infer X>
  ? X
  : never;

type MapToSubscribitions<T> = {
  [K in keyof T as T[K] extends Function
    ? K
    : `$${K & string}`]: T[K] extends Function ? T[K] : extractGeneric<T[K]>;
} & T;

export type SubscribitionsBase<T> = MapToSubscribitions<T>;

export class Subscribitions {
  [key: string]: any;
  private subscriptions: Unsubscriber[] = [];

  constructor(state: SvelteComponentState | string) {
    const innerState =
      typeof state === "string"
        ? (getContext("state") as SvelteComponentState)
        : state;

    for (const [key, value] of Object.entries(innerState)) {
      if (typeof value === "function") {
        this.addMethod(key, value);
      } else {
        this.subscribeStore(value, key);
      }
    }

    onDestroy(() => {
      this.subscriptions.forEach((unsubscription) => unsubscription());
    });
  }

  protected addSubscription(unsubscriptions: Unsubscriber | Unsubscriber[]) {
    const sub = Array.isArray(unsubscriptions)
      ? unsubscriptions
      : [unsubscriptions];
    this.subscriptions = [...this.subscriptions, ...sub];
  }

  protected addMethod<T = void>(
    fnName: string,
    storeMethod: (data?: any) => T
  ) {
    this[fnName] = storeMethod.bind(this);
  }

  protected subscribeStore<T>(
    store: Writable<T> | Readable<T>,
    callback: Subscriber<T> | string
  ) {
    if (typeof callback === "function") {
      this.addSubscription(store.subscribe(callback.bind(this)));
    } else {
      this.addSubscription(
        store.subscribe((data) => {
          this.storeCallback.call(this, data, callback);
        })
      );
    }
  }

  private storeCallback<T>(data: T, internalPropName: string) {
    (this as any)[`$${internalPropName}`] = data;
  }
}
