import { makeObservable, observable, action } from 'mobx';

class GlobalStore {
  @observable accessTokens = '';

  constructor() {
    makeObservable(this);
  }

  @action
  setAccessTokens(token: string): void {
    this.accessTokens = token;
  }
}

export default new GlobalStore();
export type IGlobalStore = GlobalStore;
